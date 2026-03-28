import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ name: '', goal: '' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.getCompanies().then(setCompanies).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const company = await api.createCompany(form);
      setCompanies([company, ...companies]);
      setForm({ name: '', goal: '' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <h2>Companies</h2>

      <div className="card" style={{ marginBottom: 28 }}>
        <h3>New Company</h3>
        <form onSubmit={handleCreate}>
          <label>Name
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Inc"
              required
            />
          </label>
          <label>Goal
            <textarea
              value={form.goal}
              onChange={e => setForm({ ...form, goal: e.target.value })}
              placeholder="What is this company trying to achieve?"
            />
          </label>
          <div>
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <p className="empty">Loading...</p>
      ) : companies.length === 0 ? (
        <p className="empty">No companies yet.</p>
      ) : (
        companies.map(c => (
          <Link to={`/companies/${c.id}`} key={c.id}>
            <div className="card" style={{ cursor: 'pointer' }}>
              <div className="card-title">{c.name}</div>
              <div className="card-meta">{c.goal || 'No goal set'}</div>
              <div className="card-meta" style={{ marginTop: 6 }}>
                Created {new Date(c.created_at).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))
      )}
    </>
  );
}
