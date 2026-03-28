const db = require('./db');
const fs = require('fs');
const path = require('path');

async function seed() {
console.log('Seeding database...');
await db.initDb();

// Wipe existing seed data (idempotent)
db.exec(`
  DELETE FROM task_logs;
  DELETE FROM approvals;
  DELETE FROM tasks;
  DELETE FROM agents;
  DELETE FROM companies;
`);

// Create Demo Co
const companyResult = db.prepare(`
  INSERT INTO companies (name, goal) VALUES (?, ?)
`).run(
  'Demo Co',
  'Build and launch a SaaS product for AI-powered document summarization by Q3 2026.'
);
const companyId = companyResult.lastInsertRowid;

// Create CEO agent
const agentResult = db.prepare(`
  INSERT INTO agents (company_id, name, role, model, persona_prompt, heartbeat_prompt)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  companyId,
  'Alex',
  'CEO',
  'claude-opus-4-6',
  'You are the CEO. Your job is to break down the company goal into tasks and assign them to your team. Always check your memory file before acting.',
  'Review the company goal. Check active tasks. Identify what is blocked or unassigned. Create or delegate tasks as needed. Update your memory with any decisions made.'
);
const agentId = agentResult.lastInsertRowid;

// Create memory file for CEO
const memDir = path.join(__dirname, '../data/agents', String(agentId));
fs.mkdirSync(memDir, { recursive: true });
fs.writeFileSync(path.join(memDir, 'memory.md'), `# Memory — Alex (CEO)

## 2026-03-27
- Company initialized. Goal: AI-powered document summarization SaaS.
- Two initial tasks created to kick off the project.
- Waiting for engineering and product agents to be added.
`);

// Create two open tasks
db.prepare(`
  INSERT INTO tasks (company_id, assigned_agent_id, title, description, status, created_by)
  VALUES (?, ?, ?, ?, 'open', ?)
`).run(
  companyId,
  agentId,
  'Define MVP feature set',
  'Identify the core features required for the first public release. Focus on document upload, summarization quality, and user accounts.',
  'Alex (CEO)'
);

db.prepare(`
  INSERT INTO tasks (company_id, assigned_agent_id, title, description, status, created_by)
  VALUES (?, ?, ?, ?, 'open', ?)
`).run(
  companyId,
  null,
  'Research competitor landscape',
  'Analyze 3-5 competing AI summarization tools. Document their pricing, differentiators, and weaknesses.',
  'Alex (CEO)'
);

console.log(`✓ Created company "Demo Co" (id=${companyId})`);
console.log(`✓ Created CEO agent "Alex" (id=${agentId})`);
console.log(`✓ Created 2 open tasks`);
console.log(`✓ Memory file written to data/agents/${agentId}/memory.md`);
console.log('Done.');
}

seed().catch((err) => { console.error(err); process.exit(1); });
