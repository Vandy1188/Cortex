const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/cortex.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// The underlying sql.js Database instance, set during initDb()
let _db;

function save() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Wrapper that exposes the same prepare/exec API as better-sqlite3
// so all route files work without changes.
const db = {
  prepare(sql) {
    return {
      // run(...params) or run(param1, param2, ...)
      run(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        if (params.length > 0) {
          _db.run(sql, params);
        } else {
          _db.run(sql);
        }
        const rowid = _db.exec('SELECT last_insert_rowid()')[0]?.values[0][0];
        save();
        return { lastInsertRowid: rowid };
      },

      // get(param1, param2, ...) — returns first row or undefined
      get(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        const stmt = _db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const row = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return row;
      },

      // all(param1, param2, ...) — returns all rows
      all(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        const stmt = _db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
    };
  },

  // exec() for multi-statement DDL/DML with no params
  exec(sql) {
    _db.exec(sql);
    save();
  },
};

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    goal TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'claude-opus-4-6',
    status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle', 'working', 'waiting')),
    persona_prompt TEXT,
    heartbeat_prompt TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    assigned_agent_id INTEGER REFERENCES agents(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'pending_approval', 'done')),
    created_by TEXT,
    token_spend INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    agent_id INTEGER REFERENCES agents(id),
    title TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'manual' CHECK(frequency IN ('daily', 'weekly', 'manual')),
    last_run_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id),
    agent_id INTEGER REFERENCES agents(id),
    action TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    company_id INTEGER REFERENCES companies(id),
    proposed_title TEXT,
    proposed_description TEXT,
    proposed_agent_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// Migrate the approvals table to the new schema if needed.
// Handles two cases:
//   1. Old schema with NOT NULL on task_id → recreate table, copy data
//   2. New-ish schema missing the proposal columns → ALTER TABLE ADD COLUMN
function runMigrations() {
  // Add auto_run column to agents (safe no-op if already present)
  try { _db.run('ALTER TABLE agents ADD COLUMN auto_run INTEGER NOT NULL DEFAULT 0'); } catch { /* already exists */ }

  const result = _db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='approvals'");
  const currentSql = result[0]?.values[0][0] || '';

  if (currentSql.includes('task_id INTEGER NOT NULL')) {
    // Full recreate — old schema is incompatible
    _db.exec(`
      ALTER TABLE approvals RENAME TO _approvals_v1;
      CREATE TABLE approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER REFERENCES tasks(id),
        agent_id INTEGER REFERENCES agents(id),
        action TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        company_id INTEGER REFERENCES companies(id),
        proposed_title TEXT,
        proposed_description TEXT,
        proposed_agent_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO approvals (id, task_id, agent_id, action, description, status, created_at)
        SELECT id, task_id, agent_id, action, description, status, created_at FROM _approvals_v1;
      DROP TABLE _approvals_v1;
    `);
  } else if (currentSql && !currentSql.includes('company_id')) {
    // Schema has nullable task_id but is missing the proposal columns
    for (const col of [
      'company_id INTEGER REFERENCES companies(id)',
      'proposed_title TEXT',
      'proposed_description TEXT',
      'proposed_agent_id INTEGER',
    ]) {
      try { _db.run(`ALTER TABLE approvals ADD COLUMN ${col}`); } catch { /* already exists */ }
    }
  }

  save();
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  _db.run('PRAGMA foreign_keys = ON;');
  _db.exec(SCHEMA);
  runMigrations();
  save();
}

db.initDb = initDb;

module.exports = db;
