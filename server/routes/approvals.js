const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/approvals?company_id=X&status=pending
// Used by the Inbox — returns approvals with requesting agent name joined in
router.get('/', (req, res) => {
  const { company_id, status } = req.query;
  if (!company_id) return res.status(400).json({ error: 'company_id is required' });

  let query = `
    SELECT a.*, ag.name AS agent_name, ag.role AS agent_role
    FROM approvals a
    LEFT JOIN agents ag ON a.agent_id = ag.id
    WHERE a.company_id = ?
  `;
  const params = [company_id];
  if (status) { query += ' AND a.status = ?'; params.push(status); }
  query += ' ORDER BY a.created_at DESC';

  const approvals = db.prepare(query).all(...params);
  res.json(approvals);
});

// POST /api/approvals — create a pending pre-task approval request
router.post('/', (req, res) => {
  const { company_id, agent_id, action, proposed_title, proposed_description, proposed_agent_id } = req.body;
  if (!company_id || !action || !proposed_title) {
    return res.status(400).json({ error: 'company_id, action, and proposed_title are required' });
  }

  const result = db.prepare(`
    INSERT INTO approvals (company_id, agent_id, action, proposed_title, proposed_description, proposed_agent_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    company_id,
    agent_id || null,
    action,
    proposed_title,
    proposed_description || null,
    proposed_agent_id || null
  );

  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(approval);
});

// POST /api/approvals/:id/approve
router.post('/:id/approve', (req, res) => {
  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  if (!approval) return res.status(404).json({ error: 'Approval not found' });
  if (approval.status !== 'pending') return res.status(409).json({ error: `Approval already ${approval.status}` });

  let taskId = approval.task_id;
  let createdTaskId = null;

  // Pre-task approval: task doesn't exist yet — create it now
  if (!taskId && approval.proposed_title) {
    const taskResult = db.prepare(`
      INSERT INTO tasks (company_id, assigned_agent_id, title, description, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      approval.company_id,
      approval.proposed_agent_id || null,
      approval.proposed_title,
      approval.proposed_description || null,
      approval.agent_name || `Approval #${approval.id}`
    );
    taskId = taskResult.lastInsertRowid;
    createdTaskId = taskId;
    // Link the approval to the newly created task
    db.prepare('UPDATE approvals SET task_id = ? WHERE id = ?').run(taskId, approval.id);
  }

  db.prepare("UPDATE approvals SET status = 'approved' WHERE id = ?").run(req.params.id);

  if (taskId) {
    db.prepare('INSERT INTO task_logs (task_id, content) VALUES (?, ?)').run(
      taskId,
      `Approval #${approval.id} approved: ${approval.action}`
    );
  }

  const updated = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  res.json({ ...updated, created_task_id: createdTaskId });
});

// POST /api/approvals/:id/reject
router.post('/:id/reject', (req, res) => {
  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  if (!approval) return res.status(404).json({ error: 'Approval not found' });
  if (approval.status !== 'pending') return res.status(409).json({ error: `Approval already ${approval.status}` });

  db.prepare("UPDATE approvals SET status = 'rejected' WHERE id = ?").run(req.params.id);

  // Only log to the task if one exists (post-creation approvals)
  if (approval.task_id) {
    db.prepare('INSERT INTO task_logs (task_id, content) VALUES (?, ?)').run(
      approval.task_id,
      `Approval #${approval.id} rejected: ${approval.action}`
    );
  }

  const updated = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
