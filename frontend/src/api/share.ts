import apiClient from './client';

export interface ShareData {
  content_type: string;
  content_id: string;
  platform: string;
}

export interface ShareStats {
  content_type: string;
  content_id: string;
  total_shares: number;
  platform_stats: {
    link: number;
    wechat: number;
    weibo: number;
    twitter: number;
    facebook: number;
    copy: number;
  };
}

export interface ShareUrlResponse {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

export const shareApi = {
  // 记录分享
  recordShare: async (data: ShareData): Promise<void> => {
    return apiClient.post('/share', data);
  },

  // 获取分享统计
  getShareStats: async (contentType: string, contentId: string): Promise<ShareStats> => {
    return apiClient.get(`/share/stats/${contentType}/${contentId}`);
  },

  // 获取分享链接
  getShareUrl: async (contentType: string, contentId: string): Promise<ShareUrlResponse> => {
    return apiClient.get(`/share/url/${contentType}/${contentId}`);
  },

  // 记录分享并获取链接
  recordAndGetUrl: async (
    contentType: string,
    contentId: string,
    platform: string = 'link'
  ): Promise<ShareUrlResponse> => {
    return apiClient.post(`/share/record/${contentType}/${contentId}?platform=${platform}`);
  },
};