import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

function Badge({ value }) {
  return <span className={`badge badge-${value}`}>{value.replace(/_/g, ' ')}</span>;
}

const FREQ_LABELS = { manual: 'Manual', daily: 'Daily', weekly: 'Weekly' };

export default function CompanyPage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [agentForm, setAgentForm] = useState({ name: '', role: '', model: 'claude-opus-4-6', persona_prompt: '', heartbeat_prompt: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_agent_id: '' });
  const [routineForm, setRoutineForm] = useState({ title: '', description: '', agent_id: '', frequency: 'manual' });

  const [contextAgent, setContextAgent] = useState(null);
  const [context, setContext] = useState('');
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showRoutineForm, setShowRoutineForm] = useState(false);

  // Runner state — label can be agent name or routine title
  const [runState, setRunState] = useState(null); // { label, lines, done, error }
  const abortRef = useRef(null);
  const logEndRef = useRef(null);

  async function load() {
    const [data, approvals, rts] = await Promise.all([
      api.getCompany(id),
      api.getPendingApprovals(id),
      api.getRoutines(id),
    ]);
    setCompany(data);
    setPendingApprovals(approvals);
    setRoutines(rts);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runState?.lines]);

  // ── Shared SSE streaming helper ───────────────────────────────────────────
  // Used by both "Run" (agents) and "Run Now" (routines).
  async function runStream(url, label, onStatusUpdate) {
    if (runState && !runState.done) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setRunState({ label, lines: [], done: false, error: null });

    let response;
    try {
      response = await fetch(url, { method: 'POST', signal: controller.signal });
    } catch (err) {
      if (err.name !== 'AbortError') setRunState(prev => ({ ...prev, error: err.message, done: true }));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    const append = (text) => setRunState(prev => prev ? { ...prev, lines: [...prev.lines, text] } : prev);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const messages = buf.split('\n\n');
        buf = messages.pop();

        for (const msg of messages) {
          const eventMatch = msg.match(/^event: (.+)$/m);
          const dataMatch = msg.match(/^data: (.+)$/m);
          if (!dataMatch) continue;

          const event = eventMatch?.[1] ?? 'message';
          let data;
          try { data = JSON.parse(dataMatch[1]); } catch { continue; }

          if (event === 'chunk' || event === 'log') {
            append(data.text);
          } else if (event === 'error') {
            append(`[stderr] ${data.text}`);
          } else if (event === 'result' && data.usage) {
            append(`\n[tokens: ${data.usage.input_tokens ?? 0} in / ${data.usage.output_tokens ?? 0} out]\n`);
          } else if (event === 'status' && data.agent_id) {
            // Update the right agent's badge
            setCompany(prev => prev ? {
              ...prev,
              agents: prev.agents.map(a => a.id === data.agent_id ? { ...a, status: data.status } : a),
            } : prev);
            if (onStatusUpdate) onStatusUpdate(data.status);
          } else if (event === 'close') {
            setRunState(prev => prev ? { ...prev, done: true } : prev);
            load(); // refresh task logs, last_run_at, token spend
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setRunState(prev => prev ? { ...prev, error: err.message, done: true } : prev);
    }
  }

  function runAgent(agent) {
    // Optimistically flip badge before the first SSE status event arrives
    setCompany(prev => prev ? {
      ...prev,
      agents: prev.agents.map(a => a.id === agent.id ? { ...a, status: 'working' } : a),
    } : prev);
    runStream(`/api/agents/${agent.id}/run`, agent.name);
  }

  function runRoutine(routine) {
    runStream(`/api/routines/${routine.id}/run`, routine.title);
  }

  function stopRun() {
    abortRef.current?.abort();
    setRunState(prev => prev ? { ...prev, done: true } : prev);
    setTimeout(load, 800);
  }

  async function toggleAutoRun(agent) {
    const updated = await api.updateAgent(agent.id, { auto_run: agent.auto_run ? 0 : 1 });
    setCompany(prev => prev ? {
      ...prev,
      agents: prev.agents.map(a => a.id === updated.id ? updated : a),
    } : prev);
  }

  async function handleAddAgent(e) {
    e.preventDefault();
    await api.addAgent(id, agentForm);
    setAgentForm({ name: '', role: '', model: 'claude-opus-4-6', persona_prompt: '', heartbeat_prompt: '' });
    setShowAgentForm(false);
    load();
  }

  async function handleAddTask(e) {
    e.preventDefault();
    await api.createTask({
      company_id: Number(id),
      title: taskForm.title,
      description: taskForm.description,
      assigned_agent_id: taskForm.assigned_agent_id ? Number(taskForm.assigned_agent_id) : null,
    });
    setTaskForm({ title: '', description: '', assigned_agent_id: '' });
    setShowTaskForm(false);
    load();
  }

  async function handleCreateRoutine(e) {
    e.preventDefault();
    await api.createRoutine({
      company_id: Number(id),
      agent_id: routineForm.agent_id ? Number(routineForm.agent_id) : null,
      title: routineForm.title,
      description: routineForm.description,
      frequency: routineForm.frequency,
    });
    setRoutineForm({ title: '', description: '', agent_id: '', frequency: 'manual' });
    setShowRoutineForm(false);
    load();
  }

  async function loadContext(agentId) {
    if (contextAgent === agentId) { setContextAgent(null); setContext(''); return; }
    const data = await api.getAgentContext(agentId);
    setContextAgent(agentId);
    setContext(data.context);
  }

  if (loading) return <p className="empty">Loading...</p>;
  if (!company) return <p className="empty">Company not found.</p>;

  const isRunning = runState && !runState.done;

  return (
    <>
      <div className="row" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>{company.name}</h2>
          <div style={{ color: '#71717a', fontSize: 14 }}>{company.goal || 'No goal set'}</div>
        </div>
      </div>

      {/* Inbox */}
      {pendingApprovals.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ marginBottom: 12, color: '#fbbf24' }}>
            Inbox — {pendingApprovals.length} pending
          </h3>
          {pendingApprovals.map(a => (
            <div key={a.id} className="card" style={{ borderColor: '#3b2d0f' }}>
              <div className="row" style={{ marginBottom: 8 }}>
                <div className="card-title">{a.proposed_title}</div>
                <span className="spacer" />
                <span className="badge badge-pending">pending</span>
              </div>
              <div className="card-meta" style={{ marginBottom: 4 }}>
                <strong style={{ color: '#e2e2e8' }}>{a.action}</strong>
              </div>
              {a.proposed_description && (
                <div className="card-meta" style={{ marginBottom: 4 }}>{a.proposed_description}</div>
              )}
              <div className="card-meta" style={{ marginBottom: 12 }}>
                Requested by {a.agent_name ? `${a.agent_name} (${a.agent_role})` : 'unknown agent'}
                {a.proposed_agent_id && company.agents.find(ag => ag.id === a.proposed_agent_id) && (
                  <span> · Assign to {company.agents.find(ag => ag.id === a.proposed_agent_id).name}</span>
                )}
              </div>
              <div className="row">
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 12px' }}
                  onClick={async () => { await api.approveApproval(a.id); load(); }}>
                  Approve
                </button>
                <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 12px' }}
                  onClick={async () => { await api.rejectApproval(a.id); load(); }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
          <hr className="divider" />
        </div>
      )}

      {/* Agents */}
      <div className="row" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Agents ({company.agents.length})</h3>
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={() => setShowAgentForm(!showAgentForm)}>
          {showAgentForm ? 'Cancel' : '+ Add Agent'}
        </button>
      </div>

      {showAgentForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleAddAgent}>
            <div className="grid-2">
              <label>Name
                <input value={agentForm.name} onChange={e => setAgentForm({ ...agentForm, name: e.target.value })} required />
              </label>
              <label>Role
                <input value={agentForm.role} onChange={e => setAgentForm({ ...agentForm, role: e.target.value })} required />
              </label>
            </div>
            <label>Model
              <select value={agentForm.model} onChange={e => setAgentForm({ ...agentForm, model: e.target.value })}>
                <option value="claude-opus-4-6">claude-opus-4-6</option>
                <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
                <option value="claude-haiku-4-5-20251001">claude-haiku-4-5-20251001</option>
              </select>
            </label>
            <label>Persona Prompt
              <textarea value={agentForm.persona_prompt} onChange={e => setAgentForm({ ...agentForm, persona_prompt: e.target.value })} />
            </label>
            <label>Heartbeat Prompt
              <textarea value={agentForm.heartbeat_prompt} onChange={e => setAgentForm({ ...agentForm, heartbeat_prompt: e.target.value })} />
            </label>
            <div><button className="btn btn-primary" type="submit">Add Agent</button></div>
          </form>
        </div>
      )}

      {company.agents.length === 0 ? (
        <p className="empty">No agents yet.</p>
      ) : (
        <div className="grid-2" style={{ marginBottom: runState ? 16 : 28 }}>
          {company.agents.map(agent => (
            <div key={agent.id} className="card">
              <div className="row" style={{ marginBottom: 8 }}>
                <div className="card-title">{agent.name}</div>
                <span className="spacer" />
                <Badge value={agent.status} />
              </div>
              <div className="card-meta" style={{ marginBottom: 10 }}>{agent.role} · {agent.model}</div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => loadContext(agent.id)}>
                  {contextAgent === agent.id ? 'Hide Context' : 'Context'}
                </button>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => runAgent(agent)}
                  disabled={isRunning}
                  title={isRunning ? 'Another agent is running' : `Run ${agent.name}`}
                >
                  Run
                </button>
                {/* Auto-run toggle */}
                <button
                  className={`btn ${agent.auto_run ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    opacity: agent.auto_run ? 1 : 0.7,
                    outline: agent.auto_run ? '1px solid #a78bfa' : 'none',
                  }}
                  onClick={() => toggleAutoRun(agent)}
                  title={agent.auto_run ? 'Auto mode: agent runs when assigned a task. Click to disable.' : 'Manual mode: click to enable auto-run.'}
                >
                  {agent.auto_run ? 'Auto' : 'Manual'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {contextAgent && (
        <div style={{ marginBottom: 28 }}>
          <h3>Agent Context</h3>
          <div className="context-box">{context}</div>
        </div>
      )}

      {/* Live run output panel */}
      {runState && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>
              {isRunning
                ? <span style={{ color: '#fbbf24' }}>● Running — {runState.label}</span>
                : <span style={{ color: '#34d399' }}>✓ Done — {runState.label}</span>}
            </h3>
            <span className="spacer" />
            {isRunning
              ? <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 10px' }} onClick={stopRun}>Stop</button>
              : <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setRunState(null)}>Dismiss</button>}
          </div>
          {runState.error && (
            <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>Error: {runState.error}</div>
          )}
          <div style={{
            background: '#111113', border: '1px solid #27272a', borderRadius: 8,
            padding: '12px 16px', fontFamily: "'Menlo','Monaco',monospace",
            fontSize: 12, color: '#d4d4d8', whiteSpace: 'pre-wrap',
            wordBreak: 'break-word', maxHeight: 420, overflowY: 'auto', lineHeight: 1.6,
          }}>
            {runState.lines.length === 0
              ? <span style={{ color: '#52525b' }}>Waiting for output…</span>
              : runState.lines.join('')}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      <hr className="divider" />

      {/* Routines */}
      <div className="row" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Routines ({routines.length})</h3>
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={() => setShowRoutineForm(!showRoutineForm)}>
          {showRoutineForm ? 'Cancel' : '+ New Routine'}
        </button>
      </div>

      {showRoutineForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleCreateRoutine}>
            <label>Title
              <input value={routineForm.title} onChange={e => setRoutineForm({ ...routineForm, title: e.target.value })} required />
            </label>
            <label>Description
              <textarea value={routineForm.description} onChange={e => setRoutineForm({ ...routineForm, description: e.target.value })} />
            </label>
            <div className="grid-2">
              <label>Assign to Agent
                <select value={routineForm.agent_id} onChange={e => setRoutineForm({ ...routineForm, agent_id: e.target.value })}>
                  <option value="">None</option>
                  {company.agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </label>
              <label>Frequency
                <select value={routineForm.frequency} onChange={e => setRoutineForm({ ...routineForm, frequency: e.target.value })}>
                  <option value="manual">Manual</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
            </div>
            <div><button className="btn btn-primary" type="submit">Create Routine</button></div>
          </form>
        </div>
      )}

      {routines.length === 0 ? (
        <p className="empty">No routines yet.</p>
      ) : (
        routines.map(routine => (
          <div key={routine.id} className="card">
            <div className="row" style={{ marginBottom: 8 }}>
              <div className="card-title">{routine.title}</div>
              <span className="spacer" />
              <span className={`badge badge-freq-${routine.frequency}`}>
                {FREQ_LABELS[routine.frequency]}
              </span>
            </div>
            {routine.description && (
              <div className="card-meta" style={{ marginBottom: 6 }}>{routine.description}</div>
            )}
            <div className="card-meta" style={{ marginBottom: 12 }}>
              {routine.agent_name
                ? `${routine.agent_name} (${routine.agent_role})`
                : 'No agent assigned'}
              {routine.last_run_at
                ? ` · Last run ${new Date(routine.last_run_at).toLocaleString()}`
                : ' · Never run'}
            </div>
            <button
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '4px 12px' }}
              onClick={() => runRoutine(routine)}
              disabled={isRunning}
            >
              Run Now
            </button>
          </div>
        ))
      )}

      <hr className="divider" />

      {/* Tasks */}
      <div className="row" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Tasks ({company.tasks.length})</h3>
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={() => setShowTaskForm(!showTaskForm)}>
          {showTaskForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showTaskForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleAddTask}>
            <label>Title
              <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
            </label>
            <label>Description
              <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
            </label>
            <label>Assign to Agent
              <select value={taskForm.assigned_agent_id} onChange={e => setTaskForm({ ...taskForm, assigned_agent_id: e.target.value })}>
                <option value="">Unassigned</option>
                {company.agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                ))}
              </select>
            </label>
            <div><button className="btn btn-primary" type="submit">Create Task</button></div>
          </form>
        </div>
      )}

      {company.tasks.length === 0 ? (
        <p className="empty">No tasks yet.</p>
      ) : (
        company.tasks.map(task => (
          <Link to={`/tasks/${task.id}`} key={task.id}>
            <div className="card" style={{ cursor: 'pointer' }}>
              <div className="row">
                <div className="card-title">{task.title}</div>
                <span className="spacer" />
                <Badge value={task.status} />
              </div>
              {task.description && (
                <div className="card-meta" style={{ marginTop: 6 }}>{task.description}</div>
              )}
              <div className="card-meta" style={{ marginTop: 6 }}>
                #{task.id} · {task.created_by || 'unknown'} · {new Date(task.created_at).toLocaleDateString()}
                {task.token_spend > 0 && ` · ${task.token_spend.toLocaleString()} tokens`}
              </div>
            </div>
          </Link>
        ))
      )}
    </>
  );
}
