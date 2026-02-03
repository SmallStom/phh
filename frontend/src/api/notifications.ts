import api from './client';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system' | 'collect' | 'mention';
  title: string;
  content?: string;
  is_read: boolean;
  created_at: string;
  sender_id?: string;
  sender_username?: string;
  sender_avatar?: string;
  resource_type?: 'record' | 'experience' | 'collection' | 'comment' | 'user';
  resource_id?: string;
  resource_title?: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
}

export interface NotificationCountResponse {
  total: number;
  unread: number;
}

export const notificationsApi = {
  /**
   * 获取通知列表
   */
  async getNotifications(params?: {
    page?: number;
    page_size?: number;
    unread_only?: boolean;
  }): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>('/notifications', { params });
    return response.data;
  },

  /**
   * 获取通知数量统计
   */
  async getCount(): Promise<NotificationCountResponse> {
    const response = await api.get<NotificationCountResponse>('/notifications/count');
    return response.data;
  },

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<NotificationCountResponse>('/notifications/count');
    return response.data.unread;
  },

  /**
   * 标记单个通知为已读
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.put(`/notifications/${notificationId}/read`);
  },

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  },

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },
};
