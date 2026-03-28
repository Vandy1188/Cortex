const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const db = require('../db');
const fs = require('fs');
const path = require('path');

// Shared helper: build the full system prompt string for an agent
function buildContext(agent) {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(agent.company_id);

  const tasks = db.prepare(`
    SELECT * FROM tasks
    WHERE company_id = ? AND (assigned_agent_id = ? OR assigned_agent_id IS NULL)
    AND status != 'done'
    ORDER BY created_at
  `).all(agent.company_id, agent.id);

  const memPath = path.join(__dirname, '../../data/agents', String(agent.id), 'memory.md');
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

// GET /api/agents/:id/context
router.get('/:id/context', (req, res) => {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  const { context } = buildContext(agent);
  res.json({ agent_id: agent.id, context });
});

// POST /api/agents/:id/run
// Spawns a Claude CLI subprocess and streams output back via SSE.
router.post('/:id/run', (req, res) => {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function send(event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const { context, tasks } = buildContext(agent);

  const taskLines = tasks.length
    ? tasks.map(t => `#${t.id} [${t.status}]: ${t.title}`).join('\n')
    : 'No active tasks right now.';

  const firstMessage = [
    'You are now active. Review your memory and take action.',
    '',
    'Current tasks:',
    taskLines,
  ].join('\n');

  // Update agent status → working
  db.prepare("UPDATE agents SET status = 'working' WHERE id = ?").run(agent.id);
  send('status', { status: 'working' });
  send('log', { text: `[cortex] Starting agent ${agent.name} (${agent.role})…\n` });

  // Inherit PATH and append common locations so we can find the claude binary
  const env = {
    ...process.env,
    PATH: [
      process.env.PATH,
      '/usr/local/bin',
      '/opt/homebrew/bin',
      path.join(process.env.HOME || '', '.local', 'bin'),
      path.join(process.env.HOME || '', '.npm-global', 'bin'),
    ].filter(Boolean).join(':'),
  };

  const child = spawn(
    'claude',
    ['-p', firstMessage, '--system-prompt', context, '--output-format', 'stream-json', '--verbose'],
    { env }
  );

  let stdoutBuf = '';
  let fullOutput = '';

  child.stdout.on('data', (chunk) => {
    stdoutBuf += chunk.toString();
    const lines = stdoutBuf.split('\n');
    stdoutBuf = lines.pop(); // hold the potentially incomplete last line

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);

        if (parsed.type === 'assistant') {
          // Extract text content from the message content array
          const text = (parsed.message?.content ?? [])
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('');
          if (text) {
            fullOutput += text;
            send('chunk', { text });
          }
        } else if (parsed.type === 'result') {
          const usage = parsed.usage ?? {};
          send('result', {
            text: parsed.result ?? '',
            usage,
            is_error: parsed.is_error ?? false,
          });
          // Update token spend on each assigned task
          if (usage.output_tokens && tasks.length) {
            for (const t of tasks) {
              db.prepare('UPDATE tasks SET token_spend = token_spend + ? WHERE id = ?')
                .run(usage.input_tokens + usage.output_tokens, t.id);
            }
          }
        }
        // system/init messages are silently ignored
      } catch {
        // Non-JSON stdout line — pass through as-is
        fullOutput += line + '\n';
        send('chunk', { text: line + '\n' });
      }
    }
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    send('error', { text });
  });

  child.on('error', (err) => {
    send('error', { text: `[cortex] Failed to start claude: ${err.message}\n` });
  });

  child.on('close', (code) => {
    const output = fullOutput.trim();

    // Save full output to task_logs for every active task assigned to this agent
    if (output) {
      const assignedTasks = tasks.filter(t => t.assigned_agent_id === agent.id);
      const targets = assignedTasks.length ? assignedTasks : tasks;
      for (const t of targets) {
        db.prepare('INSERT INTO task_logs (task_id, content) VALUES (?, ?)').run(
          t.id,
          `[${agent.name}] ${output}`
        );
      }
    }

    // Append run output to the agent's memory file
    if (output) {
      const memDir = path.join(__dirname, '../../data/agents', String(agent.id));
      const memPath = path.join(memDir, 'memory.md');
      try {
        fs.mkdirSync(memDir, { recursive: true });
        const datestamp = new Date().toISOString().slice(0, 10);
        fs.appendFileSync(memPath, `\n## ${datestamp}\n${output}\n`);
        send('log', { text: `[cortex] Memory updated.\n` });
      } catch (err) {
        send('error', { text: `[cortex] Failed to write memory: ${err.message}\n` });
      }
    }

    db.prepare("UPDATE agents SET status = 'idle' WHERE id = ?").run(agent.id);
    send('status', { status: 'idle' });
    send('log', { text: `[cortex] Agent finished (exit code ${code}).\n` });
    send('close', { code });
    res.end();
  });

  // Kill child if client disconnects early
  req.on('close', () => {
    if (!child.killed) child.kill('SIGTERM');
  });
});

module.exports = router;
