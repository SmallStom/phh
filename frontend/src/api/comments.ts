import api from './client';
import type { CommentCreate, Comment, CommentListResponse } from '../types/comment';

export const commentsApi = {
  async createComment(recordId: string, data: CommentCreate): Promise<Comment> {
    const response = await api.post<Comment>(`/records/${recordId}/comments`, data);
    return response.data;
  },

  async getComments(recordId: string, params?: {
    page?: number;
    page_size?: number;
    parent_id?: string;
  }): Promise<CommentListResponse> {
    const response = await api.get<CommentListResponse>(`/records/${recordId}/comments`, { params });
    return response.data;
  },

  async getCommentReplies(recordId: string, commentId: string, params?: {
    page?: number;
    page_size?: number;
  }): Promise<CommentListResponse> {
    const response = await api.get<CommentListResponse>(
      `/records/${recordId}/comments/${commentId}/replies`,
      { params }
    );
    return response.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/records/comments/${commentId}`);
  },
};
