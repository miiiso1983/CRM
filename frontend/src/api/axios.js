import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/srv',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'حدث خطأ في الاتصال';

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('انتهت الجلسة. يرجى تسجيل الدخول مجدداً');
    } else if (error.response?.status === 403) {
      toast.error('ليس لديك صلاحية لهذا الإجراء');
    } else if (error.response?.status === 409) {
      // Duplicate - let component handle it
    } else if (error.code === 'ECONNABORTED') {
      toast.error('انتهت مهلة الاتصال. تحقق من اتصالك بالإنترنت');
    }

    return Promise.reject(error.response?.data || { message });
  }
);

export default api;

// API Helpers
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  updateFCMToken: (token) => api.put('/auth/fcm-token', { fcm_token: token }),
};

export const leadsAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  transfer: (id, data) => api.post(`/leads/${id}/transfer`, data),
  addActivity: (id, data) => api.post(`/leads/${id}/activities`, data),
  searchByPhone: (phone) => api.get('/leads/search', { params: { phone } }),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/leads/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },
};

export const meetingsAPI = {
  getAll: (params) => api.get('/meetings', { params }),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  getCalendar: (params) => api.get('/meetings/calendar', { params }),
};

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  clear: () => api.delete('/notifications/clear'),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getManagers: () => api.get('/users/managers'),
};

export const dashboardAPI = {
  getData: () => api.get('/dashboard'),
  export: () => api.get('/dashboard/export', { responseType: 'blob' }),
};

