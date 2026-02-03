export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface UserStats {
  records_count: number;
  experiences_count: number;
  collections_count: number;
  likes_received: number;
  comments_received: number;
  followers_count: number;
  following_count: number;
  streak_days?: number;
}

export interface ActivityData {
  date: string;
  count: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  tenant: Tenant;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  tenant_slug: string;
}
