import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; // Default to FastAPI local server

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authApi = {
  login: async (data: any) => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    const response = await api.post('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  
  register: async (data: any) => {
    const response = await api.post('/api/v1/auth/signup', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  updateMe: async (data: any) => {
    const response = await api.patch('/api/v1/auth/me', data);
    return response.data;
  },

  changePassword: async (data: any) => {
    const response = await api.patch('/api/v1/auth/me/password', data);
    return response.data;
  },

  forgotPassword: async (data: { email: string }) => {
    const response = await api.post('/api/v1/auth/forgot-password', data);
    return response.data;
  },

  verifyResetOtp: async (data: { email: string; otp: string }) => {
    const response = await api.post('/api/v1/auth/verify-reset-otp', data);
    return response.data;
  },

  resetPassword: async (data: { token: string; new_password: string }) => {
    const response = await api.post('/api/v1/auth/reset-password', data);
    return response.data;
  },

  // --- ADMIN ENDPOINTS (QUẢN LÝ TÀI KHOẢN) ---
  
  createAccount: async (data: any) => {
    const response = await api.post('/api/v1/auth/accounts', data);
    return response.data;
  },

  getAccounts: async (skip: number = 0, limit: number = 100) => {
    const response = await api.get(`/api/v1/auth/accounts?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getAccountDetails: async (accountId: string) => {
    const response = await api.get(`/api/v1/auth/accounts/${accountId}`);
    return response.data;
  },

  updateAccount: async (accountId: string, data: any) => {
    const response = await api.patch(`/api/v1/auth/accounts/${accountId}`, data);
    return response.data;
  },

  deactivateAccount: async (accountId: string) => {
    const response = await api.delete(`/api/v1/auth/accounts/${accountId}`);
    return response.data;
  },

  reactivateAccount: async (accountId: string) => {
    const response = await api.patch(`/api/v1/auth/accounts/${accountId}/reactivate`);
    return response.data;
  },
};

export default api;
