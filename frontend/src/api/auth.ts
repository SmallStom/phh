import api, { setAuth, clearAuth } from './client';
import type { AuthResponse, LoginCredentials, RegisterCredentials } from '../types/auth';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    setAuth(response.data);
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    setAuth(response.data);
    return response.data;
  },

  async logout() {
    clearAuth();
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
