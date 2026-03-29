import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('work_os_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    if (!err.response) {
      return Promise.reject({ success: false, message: 'Cannot connect to server. Make sure the backend is running on port 5000.' });
    }
    if (err.response.status === 401) {
      localStorage.removeItem('work_os_token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err.response.data || { success: false, message: err.message });
  }
);

// Auth
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: data => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

// Projects
export const projectsAPI = {
  getAll: (filters = {}) => api.get('/projects', { params: filters }),
  create: data => api.post('/projects', data),
  getOne: id => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: id => api.delete(`/projects/${id}`),
  getStats: id => api.get(`/projects/${id}/stats`)
};

// Goals
export const goalsAPI = {
  getAll: projectId => api.get(`/projects/${projectId}/goals`),
  create: (projectId, data) => api.post(`/projects/${projectId}/goals`, data),
  update: (projectId, goalId, data) => api.put(`/projects/${projectId}/goals/${goalId}`, data),
  delete: (projectId, goalId) => api.delete(`/projects/${projectId}/goals/${goalId}`)
};

// Tasks
export const tasksAPI = {
  getAll: (filters = {}) => api.get('/tasks', { params: filters }),
  create: data => api.post('/tasks', data),
  getOne: id => api.get(`/tasks/${id}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: id => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  addComment: (id, content) => api.post(`/tasks/${id}/comments`, { content }),
  addSubtask: (id, data) => api.post(`/tasks/${id}/subtasks`, data),
  updateSubtask: (taskId, subtaskId, data) => api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, data),
  reorder: tasks => api.put('/tasks/reorder', { tasks })
};

// Users
export const usersAPI = {
  getAll: (filters = {}) => api.get('/users', { params: filters }),
  getOne: id => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: id => api.delete(`/users/${id}`)
};

// Departments
export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  create: data => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: id => api.delete(`/departments/${id}`)
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getActivity: (page = 1, limit = 20) => api.get('/dashboard/activity', { params: { page, limit } })
};

// AI
export const aiAPI = {
  generatePlan: data => api.post('/ai/generate-plan', data),
  assignTeam: projectId => api.post(`/ai/assign-team/${projectId}`),
  getStandup: projectId => api.get(`/ai/standup/${projectId}`),
  getPerformance: projectId => api.get(`/ai/performance/${projectId}`),
  replan: (projectId, reason) => api.post(`/ai/replan/${projectId}`, { reason })
};

export default api;
