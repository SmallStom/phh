import apiClient from './client';

export interface ContentStats {
  total_views: number;
  today_views: number;
  today_unique_visitors: number;
}

export interface HotItem {
  id: string;
  score: number;
  title?: string;
  author?: string;
  is_public?: boolean;
  username?: string;
  followers_count?: number;
}

export interface HotListResponse {
  success: boolean;
  data: HotItem[];
}

export interface TotalStats {
  total_pv: number;
  today_uv: number;
}

export const analyticsApi = {
  // 记录页面浏览
  recordView: async (contentType: string, contentId: string, visitorId?: string): Promise<{ data: { success: boolean; page_view: number } }> => {
    const params = visitorId ? `?visitor_id=${visitorId}` : '';
    return apiClient.post(`/analytics/view/${contentType}/${contentId}${params}`);
  },

  // 获取内容统计
  getContentStats: async (contentType: string, contentId: string): Promise<{ data: { success: boolean; data: ContentStats } }> => {
    return apiClient.get(`/analytics/stats/${contentType}/${contentId}`);
  },

  // 获取热门记录
  getHotRecords: async (limit: number = 10): Promise<HotListResponse> => {
    const response = await apiClient.get(`/analytics/hot/records?limit=${limit}`);
    return response.data;
  },

  // 获取热门经历
  getHotExperiences: async (limit: number = 10): Promise<HotListResponse> => {
    const response = await apiClient.get(`/analytics/hot/experiences?limit=${limit}`);
    return response.data;
  },

  // 获取热门收藏
  getHotCollections: async (limit: number = 10): Promise<HotListResponse> => {
    const response = await apiClient.get(`/analytics/hot/collections?limit=${limit}`);
    return response.data;
  },

  // 获取热门用户
  getHotUsers: async (limit: number = 10): Promise<HotListResponse> => {
    const response = await apiClient.get(`/analytics/hot/users?limit=${limit}`);
    return response.data;
  },

  // 获取总体统计（管理员）
  getTotalStats: async (): Promise<{ data: { success: boolean; data: TotalStats } }> => {
    return apiClient.get('/analytics/total');
  },

  // 获取Redis状态（管理员）
  getRedisStatus: async (): Promise<{ data: { success: boolean; data: { enabled: boolean; connected: boolean } } }> => {
    return apiClient.get('/analytics/redis/status');
  },
};
