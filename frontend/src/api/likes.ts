import api from './client';
import type { LikeResponse, LikeStatusResponse } from '../types/like';

export const likesApi = {
  async likeRecord(recordId: string): Promise<LikeResponse> {
    const response = await api.post<LikeResponse>(`/records/${recordId}/like`);
    return response.data;
  },

  async unlikeRecord(recordId: string): Promise<void> {
    await api.delete(`/records/${recordId}/like`);
  },

  async getLikeStatus(recordId: string): Promise<LikeStatusResponse> {
    const response = await api.get<LikeStatusResponse>(`/records/${recordId}/like/status`);
    return response.data;
  },

  async getPublicLikeStatus(recordId: string): Promise<LikeStatusResponse> {
    const response = await api.get<LikeStatusResponse>(`/records/public/${recordId}/like/status`);
    return response.data;
  },
};
