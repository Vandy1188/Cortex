const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const logs = db.prepare('SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at').all(req.params.id);
  const approvals = db.prepare('SELECT * FROM approvals WHERE task_id = ? ORDER BY created_at DESC').all(req.params.id);
  const assignedAgent = task.assigned_agent_id
    ? db.prepare('SELECT id, name, role FROM agents WHERE id = ?').get(task.assigned_agent_id)
    : null;

  res.json({ ...task, assigned_agent: assignedAgent, logs, approvals });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { company_id, assigned_agent_id, title, description, created_by } = req.body;
  if (!company_id || !title) return res.status(400).json({ error: 'company_id and title are required' });

  const company = db.prepare('SELECT id FROM companies WHERE id = ?').get(company_id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const result = db.prepare(`
    INSERT INTO tasks (company_id, assigned_agent_id, title, description, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(company_id, assigned_agent_id || null, title, description || null, created_by || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

  // Auto-run: if the assigned agent has auto_run enabled, fire a background run
  if (task.assigned_agent_id) {
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(task.assigned_agent_id);
    if (agent?.auto_run) {
      const { backgroundRun } = require('../runner');
      setImmediate(() => backgroundRun(agent));
    }
  }

  res.status(201).json(task);
});

// PATCH /api/tasks/:id
router.patch('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const allowed = ['status', 'assigned_agent_id', 'title', 'description', 'token_spend'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.updated_at = new Date().toISOString();
  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), req.params.id];

  db.prepare(`UPDATE tasks SET ${setClauses} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
