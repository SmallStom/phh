import axios from 'axios';
import type { AuthResponse } from '../types/auth';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenant_id');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('tenant_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const setAuth = (auth: AuthResponse) => {
  localStorage.setItem('token', auth.token);
  localStorage.setItem('tenant_id', auth.tenant.id);
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tenant_id');
};

export default api;
