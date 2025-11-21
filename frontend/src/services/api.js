import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://carbon-tracker-backend-r5ll.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

export const emissionsAPI = {
  getAll: (params) => api.get('/emissions', { params }),
  getStats: (period) => api.get(`/emissions/stats/summary?period=${period}`),
  getOverTime: (period) => api.get(`/emissions/stats/over-time?period=${period}`),
  getCategoryBreakdown: (period) => api.get(`/emissions/stats/category-breakdown?period=${period}`),
  getById: (id) => api.get(`/emissions/${id}`),
  create: (data) => api.post('/emissions', data),
  update: (id, data) => api.put(`/emissions/${id}`, data),
  delete: (id) => api.delete(`/emissions/${id}`),
  getActivities: (category) => api.get(`/emissions/activities/${category}`),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePreferences: (data) => api.put('/users/preferences', data),
};

export default api;