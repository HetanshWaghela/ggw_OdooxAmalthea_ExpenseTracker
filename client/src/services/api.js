import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
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

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Users API
export const usersAPI = {
  getUsers: () => api.get('/users'),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  sendPassword: (id) => api.post(`/users/${id}/send-password`),
  getManagers: () => api.get('/users/managers'),
  getEmployees: () => api.get('/users/employees'),
};

// Expenses API
export const expensesAPI = {
  getExpenses: (params) => api.get('/expenses', { params }),
  createExpense: (data) => api.post('/expenses', data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  submitExpense: (id) => api.post(`/expenses/${id}/submit`),
  getCategories: () => api.get('/expenses/categories'),
  uploadReceipt: (file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.post('/expenses/upload-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  processReceipt: (file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.post('/expenses/process-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  processExistingReceipt: (filePath, mimeType) => {
    return api.post('/expenses/process-existing-receipt', {
      filePath,
      mimeType
    });
  },
  approveExpense: (id, comments) => api.post(`/expenses/${id}/approve`, { comments }),
  rejectExpense: (id, comments) => api.post(`/expenses/${id}/reject`, { comments }),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
};

// Approvals API
export const approvalsAPI = {
  getPendingApprovals: () => api.get('/approvals/pending'),
  approveExpense: (id, comments) => api.post(`/approvals/${id}/approve`, { comments }),
  rejectExpense: (id, comments) => api.post(`/approvals/${id}/reject`, { comments }),
  processApproval: (id, data) => api.post(`/approvals/${id}/process`, data),
  getApprovalHistory: (expenseId) => api.get(`/approvals/expense/${expenseId}`),
};

// Currency API
export const currencyAPI = {
  getCountries: () => api.get('/currency/countries'),
  convertCurrency: (data) => api.post('/currency/convert', data),
  getExchangeRates: (baseCurrency) => api.get(`/currency/rates/${baseCurrency}`),
};

export default api;
