const express = require('express');
const router = express.Router();
const db = require('../db');
const { streamRun } = require('../runner');

// GET /api/routines?company_id=X
router.get('/', (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ error: 'company_id is required' });

  const routines = db.prepare(`
    SELECT r.*, a.name AS agent_name, a.role AS agent_role
    FROM routines r
    LEFT JOIN agents a ON r.agent_id = a.id
    WHERE r.company_id = ?
    ORDER BY r.created_at DESC
  `).all(company_id);
  res.json(routines);
});

// POST /api/routines
router.post('/', (req, res) => {
  const { company_id, agent_id, title, description, frequency } = req.body;
  if (!company_id || !title) return res.status(400).json({ error: 'company_id and title are required' });

  const result = db.prepare(`
    INSERT INTO routines (company_id, agent_id, title, description, frequency)
    VALUES (?, ?, ?, ?, ?)
  `).run(company_id, agent_id || null, title, description || null, frequency || 'manual');

  const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(routine);
});

// POST /api/routines/:id/run
// Creates a task from the routine template, updates last_run_at, then streams the agent run.
router.post('/:id/run', (req, res) => {
  const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  if (!routine) return res.status(404).json({ error: 'Routine not found' });

  // Create task from template
  db.prepare(`
    INSERT INTO tasks (company_id, assigned_agent_id, title, description, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    routine.company_id,
    routine.agent_id || null,
    routine.title,
    routine.description || null,
    `Routine #${routine.id}`
  );

  // Stamp last_run_at
  db.prepare("UPDATE routines SET last_run_at = datetime('now') WHERE id = ?").run(routine.id);

  if (routine.agent_id) {
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(routine.agent_id);
    if (agent) return streamRun(agent, res, req);
  }

  // No agent assigned — return the updated routine as plain JSON
  res.json({ routine: db.prepare('SELECT * FROM routines WHERE id = ?').get(routine.id) });
});

module.exports = router;
