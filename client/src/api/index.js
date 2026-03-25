import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000/api' })

// Attach JWT to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('campusfix_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('campusfix_user')
      localStorage.removeItem('campusfix_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────────────
export const authAPI = {
  login:    data => api.post('/auth/login',    data),
  register: data => api.post('/auth/register', data),
}

// ── Complaints ──────────────────────────────────────────
export const complaintsAPI = {
  getAll:    params => api.get('/complaints', { params }),
  getMine:   ()     => api.get('/complaints/mine'),
  getById:   id     => api.get(`/complaints/${id}`),
  create:    data   => api.post('/complaints', data),          // FormData for image
  update:    (id, data) => api.patch(`/complaints/${id}`, data),
  delete:    id     => api.delete(`/complaints/${id}`),
  assign:    (id, data) => api.patch(`/complaints/${id}/assign`, data),
  exportCSV: ()     => api.get('/complaints/export/csv', { responseType: 'blob' }),
}

// ── Notifications ────────────────────────────────────────
export const notifAPI = {
  getAll:   ()  => api.get('/notifications'),
  markRead: id  => api.patch(`/notifications/${id}/read`),
  markAllRead: ()=> api.patch('/notifications/read-all'),
}

// ── Users (admin) ────────────────────────────────────────
export const usersAPI = {
  getStaff: () => api.get('/users/staff'),
}

// ── Analytics ────────────────────────────────────────────
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
}

export default api
