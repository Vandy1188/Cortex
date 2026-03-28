import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const STATUSES = ['open', 'in_progress', 'pending_approval', 'done'];

function Badge({ value }) {
  return <span className={`badge badge-${value}`}>{value.replace('_', ' ')}</span>;
}

export default function TaskPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api.getTask(id);
    setTask(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function setStatus(status) {
    await api.updateTask(id, { status });
    load();
  }

  async function handleApprove(approvalId) {
    await api.approveApproval(approvalId);
    load();
  }

  async function handleReject(approvalId) {
    await api.rejectApproval(approvalId);
    load();
  }

  if (loading) return <p className="empty">Loading...</p>;
  if (!task) return <p className="empty">Task not found.</p>;

  return (
    <>
      <div className="row" style={{ marginBottom: 4 }}>
        <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <h2 style={{ marginBottom: 0 }}>{task.title}</h2>
          <span className="spacer" />
          <Badge value={task.status} />
        </div>
        {task.description && (
          <p style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 12 }}>{task.description}</p>
        )}
        <div style={{ fontSize: 12, color: '#52525b' }}>
          Task #{task.id}
          {task.assigned_agent
            ? ` · Assigned to ${task.assigned_agent.name} (${task.assigned_agent.role})`
            : ' · Unassigned'}
          {' · '}Created by {task.created_by || 'unknown'}
          {task.token_spend > 0 && ` · ${task.token_spend.toLocaleString()} tokens`}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Update Status</h3>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {STATUSES.map(s => (
            <button
              key={s}
              className={`btn ${task.status === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatus(s)}
              disabled={task.status === s}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {task.approvals?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3>Approvals</h3>
          {task.approvals.map(a => (
            <div key={a.id} className="card">
              <div className="row">
                <div>
                  <div className="card-title">{a.action}</div>
                  {a.description && <div className="card-meta">{a.description}</div>}
                </div>
                <span className="spacer" />
                <Badge value={a.status} />
              </div>
              {a.status === 'pending' && (
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={() => handleApprove(a.id)}>Approve</button>
                  <button className="btn btn-danger" onClick={() => handleReject(a.id)}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <h3>Activity Log</h3>
        {task.logs?.length === 0 ? (
          <p className="empty">No activity yet.</p>
        ) : (
          task.logs?.map(log => (
            <div key={log.id} className="log-entry">
              <div className="log-time">{new Date(log.created_at).toLocaleString()}</div>
              {log.content}
            </div>
          ))
        )}
      </div>
    </>
  );
}
