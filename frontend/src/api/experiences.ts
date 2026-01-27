import api from './client';
import type { Experience, ExperienceCreate, ExperienceUpdate, ExperienceListResponse } from '../types/experience';

export const experiencesApi = {
  async getExperiences(params?: {
    page?: number;
    page_size?: number;
    category?: string;
    year?: number;
  }): Promise<ExperienceListResponse> {
    const response = await api.get<ExperienceListResponse>('/experiences', { params });
    return response.data;
  },

  async getExperience(id: string): Promise<Experience> {
    const response = await api.get<Experience>(`/experiences/${id}`);
    return response.data;
  },

  async createExperience(data: ExperienceCreate): Promise<Experience> {
    const response = await api.post<Experience>('/experiences', data);
    return response.data;
  },

  async updateExperience(id: string, data: ExperienceUpdate): Promise<Experience> {
    const response = await api.put<Experience>(`/experiences/${id}`, data);
    return response.data;
  },

  async deleteExperience(id: string): Promise<void> {
    await api.delete(`/experiences/${id}`);
  },

  async createFromRecord(recordId: string): Promise<Experience> {
    const response = await api.post<Experience>(`/experiences/from-record/${recordId}`);
    return response.data;
  },
};
