import api from './client';
import type { Tag, TagStats, TagSuggestResponse } from '../types/tag';

export const tagsApi = {
  async getTags(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Tag[]> {
    const response = await api.get<Tag[]>('/tags', { params });
    return response.data;
  },

  async suggestTags(q: string, limit?: number): Promise<string[]> {
    const response = await api.get<TagSuggestResponse>('/tags/suggest', { 
      params: { q, limit } 
    });
    return response.data.tags;
  },

  async getPopularTags(limit?: number): Promise<{name: string; count: number}[]> {
    const response = await api.get<{name: string; count: number}[]>('/tags/popular', { 
      params: { limit } 
    });
    return response.data;
  },

  async getTagStats(): Promise<TagStats> {
    const response = await api.get<TagStats>('/tags/stats');
    return response.data;
  },

  async createTag(data: { name: string; color?: string }): Promise<Tag> {
    const response = await api.post<Tag>('/tags', data);
    return response.data;
  },

  async updateTag(id: string, data: { name?: string; color?: string }): Promise<Tag> {
    const response = await api.put<Tag>(`/tags/${id}`, data);
    return response.data;
  },

  async deleteTag(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  },

  async mergeTags(sourceTag: string, targetTag: string): Promise<{message: string; merged_count: number}> {
    const response = await api.post<{message: string; merged_count: number}>('/tags/merge', {
      source_tag: sourceTag,
      target_tag: targetTag
    });
    return response.data;
  },
};
