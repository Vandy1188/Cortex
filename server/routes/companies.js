const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');

// POST /api/companies
router.post('/', (req, res) => {
  const { name, goal } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const result = db.prepare(
    'INSERT INTO companies (name, goal) VALUES (?, ?)'
  ).run(name, goal || null);

  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(company);
});

// GET /api/companies
router.get('/', (req, res) => {
  const companies = db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();
  res.json(companies);
});

// GET /api/companies/:id
router.get('/:id', (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const agents = db.prepare('SELECT * FROM agents WHERE company_id = ? ORDER BY created_at').all(req.params.id);
  const tasks = db.prepare('SELECT * FROM tasks WHERE company_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({ ...company, agents, tasks });
});

// POST /api/companies/:id/agents
router.post('/:id/agents', (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const { name, role, model, persona_prompt, heartbeat_prompt } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'name and role are required' });

  const result = db.prepare(`
    INSERT INTO agents (company_id, name, role, model, persona_prompt, heartbeat_prompt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    name,
    role,
    model || 'claude-opus-4-6',
    persona_prompt || null,
    heartbeat_prompt || null
  );

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(result.lastInsertRowid);

  // Create memory file for agent
  const memDir = path.join(__dirname, '../../data/agents', String(agent.id));
  fs.mkdirSync(memDir, { recursive: true });
  fs.writeFileSync(
    path.join(memDir, 'memory.md'),
    `# Memory — ${agent.name}\n\n_No entries yet._\n`
  );

  res.status(201).json(agent);
});

module.exports = router;
