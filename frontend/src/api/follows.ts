import apiClient from './client';

export interface FollowUser {
  id: string;
  username: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: FollowUser;
  following?: FollowUser;
}

export interface FollowStats {
  following_count: number;
  followers_count: number;
  is_following: boolean;
}

export interface FollowListResponse {
  data: Follow[];
  total: number;
  page: number;
  page_size: number;
}

export const followsApi = {
  // 关注用户
  follow: async (followingId: string): Promise<{ data: Follow }> => {
    return apiClient.post('/follows', { following_id: followingId });
  },

  // 取消关注
  unfollow: async (userId: string): Promise<void> => {
    return apiClient.delete(`/follows/${userId}`);
  },

  // 获取关注统计
  getStats: async (userId: string): Promise<{ data: FollowStats }> => {
    return apiClient.get(`/follows/stats/${userId}`);
  },

  // 获取关注列表
  getFollowing: async (userId: string, page: number = 1, pageSize: number = 20): Promise<{ data: FollowListResponse }> => {
    return apiClient.get(`/follows/following/${userId}?page=${page}&page_size=${pageSize}`);
  },

  // 获取粉丝列表
  getFollowers: async (userId: string, page: number = 1, pageSize: number = 20): Promise<{ data: FollowListResponse }> => {
    return apiClient.get(`/follows/followers/${userId}?page=${page}&page_size=${pageSize}`);
  },

  // 检查关注状态
  checkFollowStatus: async (userId: string): Promise<{ data: { is_following: boolean } }> => {
    return apiClient.get(`/follows/check/${userId}`);
  },
};
