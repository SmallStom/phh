import api from './client';
import type { LikeResponse, LikeStatusResponse } from '../types/like';
import type { Record } from '../types/record';

interface LikedItem {
  like_id: string;
  liked_at: string;
  record: Record;
}

interface MyLikesResponse {
  data: LikedItem[];
  total: number;
  page: number;
  page_size: number;
}

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

  async getMyLikes(page: number = 1, page_size: number = 20): Promise<MyLikesResponse> {
    const response = await api.get<MyLikesResponse>('/records/my/likes', {
      params: { page, page_size }
    });
    return response.data;
  },
};
