import api from './client';
import type { Collection, CollectionCreate, CollectionUpdate, CollectionListResponse } from '../types/collection';

export const collectionsApi = {
  async getCollections(params?: {
    page?: number;
    page_size?: number;
    content_type?: string;
    is_favorite?: boolean;
    search?: string;
  }): Promise<CollectionListResponse> {
    const response = await api.get<CollectionListResponse>('/collections', { params });
    return response.data;
  },

  async getCollection(id: string): Promise<Collection> {
    const response = await api.get<Collection>(`/collections/${id}`);
    return response.data;
  },

  async createCollection(data: CollectionCreate): Promise<Collection> {
    const response = await api.post<Collection>('/collections', data);
    return response.data;
  },

  async updateCollection(id: string, data: CollectionUpdate): Promise<Collection> {
    const response = await api.put<Collection>(`/collections/${id}`, data);
    return response.data;
  },

  async deleteCollection(id: string): Promise<void> {
    await api.delete(`/collections/${id}`);
  },

  async toggleFavorite(id: string): Promise<Collection> {
    const response = await api.post<Collection>(`/collections/${id}/favorite`);
    return response.data;
  },

  async checkCollected(contentType: string, contentId: string): Promise<{ is_collected: boolean; collection_id: string | null }> {
    const response = await api.get<{ is_collected: boolean; collection_id: string | null }>(`/collections/check/${contentType}/${contentId}`);
    return response.data;
  },

  async collectContent(contentType: string, contentId: string): Promise<Collection> {
    const response = await api.post<Collection>(`/collections/collect/${contentType}/${contentId}`);
    return response.data;
  },

  async uncollectContent(contentType: string, contentId: string): Promise<void> {
    await api.delete(`/collections/uncollect/${contentType}/${contentId}`);
  },
};
