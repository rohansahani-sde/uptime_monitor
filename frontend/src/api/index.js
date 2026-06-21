import api from './axios'

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  refresh: () => api.post('/auth/refresh'),
}

// ─── Monitors ────────────────────────────────────────────────────────────────
export const monitorsApi = {
  getAll: (params) => api.get('/monitors', { params }),
  getById: (id) => api.get(`/monitors/${id}`),
  create: (data) => api.post('/monitors', data),
  update: (id, data) => api.put(`/monitors/${id}`, data),
  delete: (id) => api.delete(`/monitors/${id}`),
  pause: (id) => api.post(`/monitors/${id}/pause`),
  resume: (id) => api.post(`/monitors/${id}/resume`),
  test: (id) => api.post(`/monitors/${id}/test`),
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  getResponseTime: (monitorId, hours = 24) =>
    api.get(`/analytics/${monitorId}/response-time`, { params: { hours } }),
  getUptimeStats: (monitorId) => api.get(`/analytics/${monitorId}/uptime`),
  getUptimeBars: (monitorId) => api.get(`/analytics/${monitorId}/bars`),
  getIncidents: (monitorId, params) =>
    api.get(`/analytics/${monitorId}/incidents`, { params }),
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getMonitors: (params) => api.get('/admin/monitors', { params }),
  getIncidents: (params) => api.get('/admin/incidents', { params }),
  getPlatformStats: () => api.get('/admin/analytics'),
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export const subscriptionApi = {
  get: () => api.get('/subscriptions'),
  upgrade: (data) => api.post('/subscriptions/upgrade', data),
  cancel: () => api.post('/subscriptions/cancel'),
}

// ─── Status Page (public) ─────────────────────────────────────────────────────
export const statusApi = {
  getBySlug: (slug) => api.get(`/status/${slug}`),
}
