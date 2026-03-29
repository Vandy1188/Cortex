# Cortex

**Lightweight AI agent orchestration system — run companies with autonomous agents.**

Cortex is a local dashboard where you create companies, hire AI agents, assign tasks, and watch them do real work using the Claude CLI. Agents read their memory, reason about their tasks, stream output back to your browser in real time, and write what they learned back to memory for next time.

---

## Features

- **Multi-agent support** — Add as many agents as you want, each with their own role, persona, and model
- **Real-time streaming output** — Watch agents think and respond live as Claude generates output
- **Persistent agent memory** — Each agent has a `memory.md` file that grows over time and is injected into every run
- **Approval gates** — Agents can request to create tasks; you approve or reject from the Inbox before anything happens
- **Routines** — Recurring task templates (manual, daily, weekly) with a Run Now button and last-run timestamp
- **Auto-run mode** — Toggle an agent into Auto mode and it runs automatically whenever a task is assigned to it
- **Task activity logs** — Every agent run saves its full output to the task's activity log
- **Token spend tracking** — Input + output tokens are tracked per task across all runs

## Tech Stack

- **Backend** — Node.js, Express, SQLite (via sql.js — no native compilation required)
- **Frontend** — React 18, Vite, React Router

## Requirements

- Node.js v18+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated (`claude` must be available in your PATH)

## Install & Run

```bash
# 1. Install server dependencies
npm install

# 2. Install frontend dependencies
cd client && npm install && cd ..

# 3. Seed the database (creates Demo Co + CEO agent + 2 starter tasks)
npm run seed

# 4. Start both servers
npm run dev
```

Open **http://localhost:5173**

The Express API runs on port 3001. The Vite dev server proxies `/api` requests automatically.

## Project Structure

```
/server          Express app, routes, DB wrapper
  /routes        companies, agents, tasks, approvals, routines
  runner.js      Shared Claude subprocess logic (stream + background)
  db.js          sql.js wrapper with better-sqlite3-compatible API
  seed.js        Demo data

/client          React + Vite frontend
  /src/pages     CompanyPage, TaskPage

/data
  cortex.db      SQLite database (auto-created)
  /agents/{id}
    memory.md    Per-agent persistent memory file
```

## How It Works

1. **Create a company** with a goal
2. **Add agents** — give each one a name, role, persona prompt, and heartbeat instructions
3. **Create tasks** or let agents create them via approval requests
4. **Click Run** on an agent — it reads its persona, company goal, active tasks, and memory file, then calls Claude CLI and streams the response back to your dashboard
5. After each run, output is saved to the task log and appended to the agent's memory file
6. **Routines** let you template recurring tasks and trigger them manually or on a schedule
7. **Auto mode** fires an agent automatically whenever a new task lands in their queue

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/companies` | Create a company |
| `GET` | `/api/companies/:id` | Get company with agents and tasks |
| `POST` | `/api/companies/:id/agents` | Add an agent |
| `PATCH` | `/api/agents/:id` | Update agent (auto_run, model, prompts) |
| `GET` | `/api/agents/:id/context` | Get assembled system prompt |
| `POST` | `/api/agents/:id/run` | Run agent (SSE stream) |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Update task status |
| `GET` | `/api/tasks/:id` | Get task with logs and approvals |
| `GET` | `/api/approvals?company_id=X` | List approvals (inbox) |
| `POST` | `/api/approvals` | Create a pending approval |
| `POST` | `/api/approvals/:id/approve` | Approve (creates task if pre-task) |
| `POST` | `/api/approvals/:id/reject` | Reject |
| `GET` | `/api/routines?company_id=X` | List routines |
| `POST` | `/api/routines` | Create a routine |
| `POST` | `/api/routines/:id/run` | Trigger routine (SSE stream) |
