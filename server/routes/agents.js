const express = require('express');
const router = express.Router();
const db = require('../db');
const { buildContext, streamRun } = require('../runner');

// GET /api/agents/:id/context
router.get('/:id/context', (req, res) => {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  const { context } = buildContext(agent);
  res.json({ agent_id: agent.id, context });
});

// POST /api/agents/:id/run — stream agent run via SSE
router.post('/:id/run', (req, res) => {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  streamRun(agent, res, req);
});

// PATCH /api/agents/:id — update mutable agent fields (auto_run, model, prompts, status)
router.patch('/:id', (req, res) => {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const allowed = ['auto_run', 'status', 'model', 'persona_prompt', 'heartbeat_prompt'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE agents SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), agent.id);

  const updated = db.prepare('SELECT * FROM agents WHERE id = ?').get(agent.id);
  res.json(updated);
});

module.exports = router;
