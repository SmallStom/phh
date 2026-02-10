import api from './client';
import type { Record, RecordCreate, RecordUpdate, RecordListResponse } from '../types/record';

export const recordsApi = {
  async getPublicRecords(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    user_id?: string;
  }): Promise<RecordListResponse> {
    const response = await api.get<RecordListResponse>('/records/public', { params });
    return response.data;
  },

  async getPublicRecord(id: string): Promise<Record> {
    const response = await api.get<Record>(`/records/public/${id}`);
    return response.data;
  },

  async getRecords(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    type?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    sort?: 'newest' | 'oldest' | 'popular';
  }): Promise<RecordListResponse> {
    const response = await api.get<RecordListResponse>('/records', { params });
    return response.data;
  },

  async getRecord(id: string): Promise<Record> {
    const response = await api.get<Record>(`/records/${id}`);
    return response.data;
  },

  async createRecord(data: RecordCreate): Promise<Record> {
    const response = await api.post<Record>('/records', data);
    return response.data;
  },

  async updateRecord(id: string, data: RecordUpdate): Promise<Record> {
    const response = await api.put<Record>(`/records/${id}`, data);
    return response.data;
  },

  async deleteRecord(id: string): Promise<void> {
    await api.delete(`/records/${id}`);
  },

  async publishRecord(id: string): Promise<Record> {
    const response = await api.post<Record>(`/records/${id}/publish`);
    return response.data;
  },
};
