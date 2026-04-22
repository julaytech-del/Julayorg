import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: BASE_URL, timeout: 120000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('julay_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    if (!err.response) {
      return Promise.reject({ success: false, message: err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : 'Unable to connect to the server. Please check your connection.' });
    }
    if (err.response.status === 401) {
      // Only clear localStorage token if the request used the same token
      // (prevents clearing a fresh token when a stale-token request races with registration)
      const failedToken = err.config?.headers?.Authorization?.replace('Bearer ', '');
      const currentToken = localStorage.getItem('julay_token');
      if (!failedToken || failedToken === currentToken) {
        localStorage.removeItem('julay_token');
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
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

// Gantt
export const ganttAPI = {
  getData: (projectId) => api.get(`/projects/${projectId}/gantt`),
  saveBaseline: (projectId) => api.post(`/projects/${projectId}/gantt/baseline`),
  getAIRisks: (projectId) => api.post(`/projects/${projectId}/gantt/ai-risks`),
};

// Notifications
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getCount: () => api.get('/notifications/count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Dashboard Config
export const dashboardConfigAPI = {
  getConfig: () => api.get('/dashboard-config/config'),
  updateConfig: (data) => api.put('/dashboard-config/config', data),
  getAIInsight: () => api.get('/dashboard-config/ai-insight'),
};

// Reports
export const reportsAPI = {
  generate: (config) => api.post('/reports/generate', config),
  exportExcel: (config) => api.post('/reports/export-excel', config, { responseType: 'blob' }),
  getAINarrative: (data) => api.post('/reports/ai-narrative', data),
};

// Webhooks
export const webhooksAPI = {
  getAll: () => api.get('/webhooks'),
  create: (data) => api.post('/webhooks', data),
  update: (id, data) => api.put(`/webhooks/${id}`, data),
  delete: (id) => api.delete(`/webhooks/${id}`),
  test: (id) => api.post(`/webhooks/${id}/test`),
};

// AI
export const aiAPI = {
  generatePlan: data => api.post('/ai/generate-plan', data),
  assignTeam: projectId => api.post(`/ai/assign-team/${projectId}`),
  getStandup: projectId => api.get(`/ai/standup/${projectId}`),
  getPerformance: projectId => api.get(`/ai/performance/${projectId}`),
  replan: (projectId, reason) => api.post(`/ai/replan/${projectId}`, { reason })
};

// Context / Smart Share
export const contextAPI = {
  analyze: (text, projectId, source) => api.post('/context/analyze', { text, projectId, source }),
  getSuggestions: () => api.get('/context/suggestions'),
  getCount: () => api.get('/context/suggestions/count'),
  applyItem: (suggestionId, itemIndex) => api.post(`/context/suggestions/${suggestionId}/items/${itemIndex}/apply`),
  rejectItem: (suggestionId, itemIndex) => api.post(`/context/suggestions/${suggestionId}/items/${itemIndex}/reject`)
};

// Subscription
export const subscriptionAPI = {
  checkout: () => api.post('/subscription/checkout'),
  status: () => api.get('/subscription/status')
};

export default api;

// Calendar
export const calendarAPI = {
  getTasks: (params) => api.get('/calendar', { params }),
  optimizeDeadline: (data) => api.post('/calendar/optimize-deadline', data),
};

// Workload
export const workloadAPI = {
  getWorkload: (params) => api.get('/workload', { params }),
  aiRebalance: (data) => api.post('/workload/ai-rebalance', data),
};

// Automations
export const automationsAPI = {
  getAll: () => api.get('/automations'),
  create: (data) => api.post('/automations', data),
  update: (id, data) => api.put(`/automations/${id}`, data),
  delete: (id) => api.delete(`/automations/${id}`),
  toggle: (id) => api.patch(`/automations/${id}/toggle`),
};

// Forms
export const formsAPI = {
  getAll: () => api.get('/forms'),
  create: (data) => api.post('/forms', data),
  update: (id, data) => api.put(`/forms/${id}`, data),
  delete: (id) => api.delete(`/forms/${id}`),
  getPublic: (token) => api.get(`/forms/public/${token}`),
  submit: (token, data) => api.post(`/forms/public/${token}`, data),
};

// My Tasks
export const myTasksAPI = {
  getTasks: (params) => api.get('/my-tasks', { params }),
  getStats: () => api.get('/my-tasks/stats'),
};

// Sprints
export const sprintsAPI = {
  getAll: (params) => api.get('/sprints', { params }),
  create: (data) => api.post('/sprints', data),
  update: (id, data) => api.put(`/sprints/${id}`, data),
  delete: (id) => api.delete(`/sprints/${id}`),
  addTask: (id, taskId) => api.post(`/sprints/${id}/tasks`, { taskId }),
  removeTask: (id, taskId) => api.delete(`/sprints/${id}/tasks/${taskId}`),
  getBurndown: (id) => api.get(`/sprints/${id}/burndown`),
};

// Portfolio
export const portfolioAPI = {
  getPortfolio: () => api.get('/portfolio'),
};

// Activity
export const activityAPI = {
  getLog: (params) => api.get('/activity', { params }),
};

// Settings
export const settingsAPI = {
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  getOrgMembers: () => api.get('/users'),
};
