import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const usersAPI = {
  getUsers: (department) => api.get('/users', { params: { department } }),
  getUser: (id) => api.get(`/users/${id}`),
  updateMe: (data) => api.patch('/users/me', data),
  uploadProfilePicture: (data) => api.post('/users/me/picture', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteProfilePicture: () => api.delete('/users/me/picture'),
  getMyShoutouts: () => api.get('/users/me/shoutouts'),
  getTaggedShoutouts: () => api.get('/users/me/tagged'),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export const shoutoutsAPI = {
  create: (data) => api.post('/shoutouts', data),
  getAll: (params) => api.get('/shoutouts', { params }),
  getById: (id) => api.get(`/shoutouts/${id}`),
  addComment: (id, content) => api.post(`/shoutouts/${id}/comments`, { content }),
  toggleReaction: (id, type) => api.post(`/shoutouts/${id}/reactions`, { type }),
  getShoutoutReactions: (id, params) => api.get(`/shoutouts/${id}/reactions`, { params }),
  delete: (id) => api.delete(`/shoutouts/${id}`), // New general delete shoutout
  deleteComment: (id) => api.delete(`/comments/${id}`), // New general delete comment
  report: (shoutoutId, commentId, reason) => api.post('/reports', { shoutout_id: shoutoutId, comment_id: commentId, reason }),
};

export const adminAPI = {
  updateUserRole: (userId, role) => api.patch(`/users/${userId}/role`, null, { params: { role } }),
  getStats: () => api.get('/admin/stats'),
  getTopContributors: () => api.get('/admin/stats/top-contributors'),
  getShoutoutsByDepartment: () => api.get('/admin/stats/shoutouts-by-department'),
  getReports: (params) => api.get('/admin/reports', { params }), // NEW
  updateReportStatus: (reportId, status) =>
    api.patch(`/admin/reports/${reportId}/status`, { status }),
};

export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.post(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post('/notifications/mark-all-read'),
};

export default api;
