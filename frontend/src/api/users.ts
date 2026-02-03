import api from './client';
import type { User, UserStats, ActivityData } from '../types/auth';

export interface UpdateProfileData {
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export const usersApi = {
  // 获取当前用户完整资料（包含统计）
  async getMyProfile(): Promise<User & UserStats> {
    const response = await api.get('/auth/me/profile');
    return response.data;
  },

  // 更新当前用户信息
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put('/auth/me', data);
    return response.data;
  },

  // 上传头像
  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 获取用户活动数据（用于热力图）
  async getMyActivity(days: number = 30): Promise<{
    data: ActivityData[];
    total_contributions: number;
  }> {
    const response = await api.get('/users/me/activity', {
      params: { days },
    });
    return response.data;
  },

  // 获取用户统计数据
  async getMyStats(): Promise<UserStats> {
    const response = await api.get('/users/me/stats');
    return response.data;
  },

  // 获取指定用户公开资料
  async getUserProfile(userId: string): Promise<User & UserStats> {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },
};
