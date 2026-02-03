import { create } from 'zustand';
import type { User, Tenant } from '../types/auth';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tenant: Tenant, token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, tenant, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('tenant_id', tenant.id);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tenant', JSON.stringify(tenant));
    set({ user, tenant, token, isAuthenticated: true });
  },
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    set({ user: null, tenant: null, token: null, isAuthenticated: false });
  },
  initializeAuth: () => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenant_id');
    const userStr = localStorage.getItem('user');
    const tenantStr = localStorage.getItem('tenant');
    
    if (token && tenantId) {
      const user = userStr ? JSON.parse(userStr) : null;
      const tenant = tenantStr ? JSON.parse(tenantStr) : null;
      set({ user, tenant, token, isAuthenticated: true });
    }
  },
}));
