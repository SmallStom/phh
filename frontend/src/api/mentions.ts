import apiClient from './client';

export interface MentionUser {
  id: string;
  username: string;
  avatar?: string;
  relation?: string; // 关系：已关注、粉丝、活跃用户
}

export interface Mention {
  id: string;
  sender_id: string;
  recipient_id: string;
  content_type: string;
  content_id: string;
  comment_id?: string;
  is_read: boolean;
  created_at: string;
  sender_username?: string;
  sender_avatar?: string;
}

export interface MentionListResponse {
  data: Mention[];
  total: number;
  page: number;
  page_size: number;
}

export const mentionsApi = {
  // 获取提及列表
  getMentions: async (page: number = 1, pageSize: number = 20, unreadOnly: boolean = false): Promise<MentionListResponse> => {
    return apiClient.get(`/mentions?page=${page}&page_size=${pageSize}&unread_only=${unreadOnly}`);
  },

  // 获取未读提及数量
  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiClient.get('/mentions/unread-count');
  },

  // 标记提及为已读
  markAsRead: async (mentionId: string): Promise<void> => {
    return apiClient.post(`/mentions/${mentionId}/read`);
  },

  // 标记所有提及为已读
  markAllAsRead: async (): Promise<void> => {
    return apiClient.post('/mentions/read-all');
  },

  // 搜索用户（用于@提及）
  searchUsers: async (query: string, limit: number = 10): Promise<{ data: MentionUser[] }> => {
    return apiClient.get(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  // 获取推荐用户（从关注/粉丝/活跃用户中）
  getSuggestedUsers: async (limit: number = 10): Promise<{ data: MentionUser[] }> => {
    return apiClient.get(`/users/suggested?limit=${limit}`);
  },
};