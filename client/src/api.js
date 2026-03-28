const BASE = '/api';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCompanies: () => req('GET', '/companies'),
  createCompany: (data) => req('POST', '/companies', data),
  getCompany: (id) => req('GET', `/companies/${id}`),
  addAgent: (companyId, data) => req('POST', `/companies/${companyId}/agents`, data),

  getTask: (id) => req('GET', `/tasks/${id}`),
  createTask: (data) => req('POST', '/tasks', data),
  updateTask: (id, data) => req('PATCH', `/tasks/${id}`, data),

  getAgentContext: (id) => req('GET', `/agents/${id}/context`),
  updateAgent: (id, data) => req('PATCH', `/agents/${id}`, data),

  getRoutines: (companyId) => req('GET', `/routines?company_id=${companyId}`),
  createRoutine: (data) => req('POST', '/routines', data),

  getPendingApprovals: (companyId) => req('GET', `/approvals?company_id=${companyId}&status=pending`),
  createApproval: (data) => req('POST', '/approvals', data),
  approveApproval: (id) => req('POST', `/approvals/${id}/approve`),
  rejectApproval: (id) => req('POST', `/approvals/${id}/reject`),
};
