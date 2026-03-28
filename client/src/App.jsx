import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import CompaniesPage from './pages/CompaniesPage';
import CompanyPage from './pages/CompanyPage';
import TaskPage from './pages/TaskPage';

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Cortex</h1>
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Companies
          </NavLink>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyPage />} />
          <Route path="/tasks/:id" element={<TaskPage />} />
        </Routes>
      </main>
    </div>
  );
}
