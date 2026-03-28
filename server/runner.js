// Shared agent-running logic.
// Used by POST /api/agents/:id/run (SSE) and POST /api/routines/:id/run (SSE),
// as well as the auto-run background trigger from task creation.

const { spawn } = require('child_process');
const db = require('./db');
const fs = require('fs');
const path = require('path');

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildEnv() {
  return {
    ...process.env,
    PATH: [
      process.env.PATH,
      '/usr/local/bin',
      '/opt/homebrew/bin',
      path.join(process.env.HOME || '', '.local', 'bin'),
      path.join(process.env.HOME || '', '.npm-global', 'bin'),
    ].filter(Boolean).join(':'),
  };
}

function buildContext(agent) {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(agent.company_id);

  const tasks = db.prepare(`
    SELECT * FROM tasks
    WHERE company_id = ? AND (assigned_agent_id = ? OR assigned_agent_id IS NULL)
    AND status != 'done'
    ORDER BY created_at
  `).all(agent.company_id, agent.id);

  const memPath = path.join(__dirname, '../data/agents', String(agent.id), 'memory.md');
  let memory = '_No memory file found._';
  try { memory = fs.readFileSync(memPath, 'utf-8'); } catch { /* not yet created */ }

  const taskList = tasks.length
    ? tasks.map(t => `- [${t.status}] #${t.id}: ${t.title}${t.description ? ` — ${t.description}` : ''}`).join('\n')
    : '_No active tasks._';

  return {
    context: [
      '## Persona',
      agent.persona_prompt || '_No persona defined._',
      '',
      '## Company',
      `Name: ${company?.name || 'Unknown'}`,
      `Goal: ${company?.goal || '_No goal set._'}`,
      '',
      '## Your Role',
      agent.role,
      '',
      '## Active Tasks',
      taskList,
      '',
      '## Memory',
      memory,
      '',
      '## Heartbeat Instructions',
      agent.heartbeat_prompt || '_No heartbeat prompt defined._',
    ].join('\n'),
    tasks,
  };
}

function buildFirstMessage(tasks) {
  const taskLines = tasks.length
    ? tasks.map(t => `#${t.id} [${t.status}]: ${t.title}`).join('\n')
    : 'No active tasks right now.';
  return ['You are now active. Review your memory and take action.', '', 'Current tasks:', taskLines].join('\n');
}

function saveOutput(agent, tasks, output) {
  const assignedTasks = tasks.filter(t => t.assigned_agent_id === agent.id);
  const targets = assignedTasks.length ? assignedTasks : tasks;
  for (const t of targets) {
    db.prepare('INSERT INTO task_logs (task_id, content) VALUES (?, ?)').run(
      t.id, `[${agent.name}] ${output}`
    );
  }

  const memDir = path.join(__dirname, '../data/agents', String(agent.id));
  const memPath = path.join(memDir, 'memory.md');
  try {
    fs.mkdirSync(memDir, { recursive: true });
    const datestamp = new Date().toISOString().slice(0, 10);
    fs.appendFileSync(memPath, `\n## ${datestamp}\n${output}\n`);
  } catch (err) {
    console.error(`[runner] Failed to write memory for agent ${agent.id}:`, err.message);
  }
}

function parseStdoutLine(line) {
  try {
    const parsed = JSON.parse(line);
    if (parsed.type === 'assistant') {
      return {
        type: 'text',
        text: (parsed.message?.content ?? []).filter(c => c.type === 'text').map(c => c.text).join(''),
      };
    }
    if (parsed.type === 'result') {
      return { type: 'result', usage: parsed.usage ?? {}, is_error: parsed.is_error ?? false };
    }
    return null;
  } catch {
    return { type: 'raw', text: line + '\n' };
  }
}

// ─── Stream run (SSE) ────────────────────────────────────────────────────────
// Attaches to an Express res and streams output as SSE events.
// Includes agent_id in status events so the client can update the right badge.

function streamRun(agent, res, req) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function send(event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const { context, tasks } = buildContext(agent);

  db.prepare("UPDATE agents SET status = 'working' WHERE id = ?").run(agent.id);
  send('status', { status: 'working', agent_id: agent.id });
  send('log', { text: `[cortex] Starting agent ${agent.name} (${agent.role})…\n` });

  const child = spawn(
    'claude',
    ['-p', buildFirstMessage(tasks), '--system-prompt', context, '--output-format', 'stream-json', '--verbose'],
    { env: buildEnv() }
  );

  let stdoutBuf = '';
  let fullOutput = '';

  child.stdout.on('data', (chunk) => {
    stdoutBuf += chunk.toString();
    const lines = stdoutBuf.split('\n');
    stdoutBuf = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      const parsed = parseStdoutLine(line);
      if (!parsed) continue;

      if (parsed.type === 'text' && parsed.text) {
        fullOutput += parsed.text;
        send('chunk', { text: parsed.text });
      } else if (parsed.type === 'result') {
        send('result', { usage: parsed.usage, is_error: parsed.is_error });
        if (parsed.usage.output_tokens && tasks.length) {
          for (const t of tasks) {
            db.prepare('UPDATE tasks SET token_spend = token_spend + ? WHERE id = ?')
              .run((parsed.usage.input_tokens ?? 0) + parsed.usage.output_tokens, t.id);
          }
        }
      } else if (parsed.type === 'raw') {
        fullOutput += parsed.text;
        send('chunk', { text: parsed.text });
      }
    }
  });

  child.stderr.on('data', (chunk) => send('error', { text: chunk.toString() }));
  child.on('error', (err) => send('error', { text: `[cortex] Failed to start claude: ${err.message}\n` }));

  child.on('close', (code) => {
    const output = fullOutput.trim();
    if (output) {
      saveOutput(agent, tasks, output);
      send('log', { text: '[cortex] Memory updated.\n' });
    }
    db.prepare("UPDATE agents SET status = 'idle' WHERE id = ?").run(agent.id);
    send('status', { status: 'idle', agent_id: agent.id });
    send('log', { text: `[cortex] Agent finished (exit code ${code}).\n` });
    send('close', { code });
    res.end();
  });

  if (req) req.on('close', () => { if (!child.killed) child.kill('SIGTERM'); });
}

// ─── Background run ──────────────────────────────────────────────────────────
// Fire-and-forget: no SSE, saves everything to DB, used by auto-run.

function backgroundRun(agent) {
  const { context, tasks } = buildContext(agent);

  db.prepare("UPDATE agents SET status = 'working' WHERE id = ?").run(agent.id);

  const child = spawn(
    'claude',
    ['-p', buildFirstMessage(tasks), '--system-prompt', context, '--output-format', 'stream-json', '--verbose'],
    { env: buildEnv() }
  );

  let stdoutBuf = '';
  let fullOutput = '';

  child.stdout.on('data', (chunk) => {
    stdoutBuf += chunk.toString();
    const lines = stdoutBuf.split('\n');
    stdoutBuf = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      const parsed = parseStdoutLine(line);
      if (!parsed) continue;

      if (parsed.type === 'text' && parsed.text) {
        fullOutput += parsed.text;
      } else if (parsed.type === 'result' && parsed.usage.output_tokens && tasks.length) {
        for (const t of tasks) {
          db.prepare('UPDATE tasks SET token_spend = token_spend + ? WHERE id = ?')
            .run((parsed.usage.input_tokens ?? 0) + parsed.usage.output_tokens, t.id);
        }
      } else if (parsed.type === 'raw') {
        fullOutput += parsed.text;
      }
    }
  });

  child.on('close', () => {
    const output = fullOutput.trim();
    if (output) saveOutput(agent, tasks, output);
    db.prepare("UPDATE agents SET status = 'idle' WHERE id = ?").run(agent.id);
  });

  child.on('error', (err) => {
    console.error(`[runner] Background run error for agent ${agent.id}:`, err.message);
    db.prepare("UPDATE agents SET status = 'idle' WHERE id = ?").run(agent.id);
  });
}

module.exports = { buildContext, streamRun, backgroundRun };
