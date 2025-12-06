import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
};


export const usersAPI = {
  getUsers: (department) => api.get('/api/users', { params: { department } }),
  getUser: (id) => api.get(`/api/users/${id}`),
  updateMe: (data) => api.patch('/api/users/me', data),
  uploadProfilePicture: (data) =>
    api.post('/api/users/me/picture', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteProfilePicture: () => api.delete('/api/users/me/picture'),
  getMyShoutouts: () => api.get('/api/users/me/shoutouts'),
  getTaggedShoutouts: () => api.get('/api/users/me/tagged'),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
};

export const shoutoutsAPI = {
  create: (data) => api.post('/api/shoutouts', data),
  getAll: (params) => api.get('/api/shoutouts', { params }),
  getById: (id) => api.get(`/api/shoutouts/${id}`),
  addComment: (id, content) =>
    api.post(`/api/shoutouts/${id}/comments`, { content }),
  toggleReaction: (id, type) =>
    api.post(`/api/shoutouts/${id}/reactions`, { type }),
  getShoutoutReactions: (id, params) =>
    api.get(`/api/shoutouts/${id}/reactions`, { params }),
  delete: (id) => api.delete(`/api/shoutouts/${id}`),
  deleteComment: (id) => api.delete(`/api/comments/${id}`),
  report: (shoutoutId, commentId, reason) =>
    api.post('/api/reports', {
      shoutout_id: shoutoutId,
      comment_id: commentId,
      reason,
    }),
};

export const adminAPI = {
  updateUserRole: (userId, role) =>
    api.patch(`/api/users/${userId}/role`, null, { params: { role } }),
  getStats: () => api.get('/api/admin/stats'),
  getTopContributors: () =>
    api.get('/api/admin/stats/top-contributors'),
  getShoutoutsByDepartment: () =>
    api.get('/api/admin/stats/shoutouts-by-department'),
  getReports: (params) => api.get('/api/admin/reports', { params }),
  updateReportStatus: (reportId, status) =>
    api.patch(`/api/admin/reports/${reportId}/status`, { status }),
};


export const notificationsAPI = {
  getNotifications: () => api.get('/api/notifications'),
  markNotificationRead: (id) => api.post(`/api/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    api.post('/api/notifications/mark-all-read'),
};

export default api;
