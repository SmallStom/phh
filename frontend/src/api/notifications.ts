import apiClient from './client';

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  COLLECT = 'collect',
  SYSTEM = 'system',
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  type: NotificationType;
  title: string;
  content?: string;
  resource_type?: string;
  resource_id?: string;
  is_read: boolean;
  created_at: string;
  sender_username?: string;
  sender_avatar?: string;
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
  // 获取通知列表
  getNotifications: async (
    page: number = 1,
    pageSize: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ data: NotificationListResponse }> => {
    return apiClient.get(
      `/notifications?page=${page}&page_size=${pageSize}&unread_only=${unreadOnly}`
    );
  },

  // 获取通知数量统计
  getNotificationCount: async (): Promise<{ data: NotificationCountResponse }> => {
    return apiClient.get('/notifications/count');
  },

  // 获取未读通知数量（用于轮询）
  getUnreadCount: async (): Promise<{ data: { unread_count: number } }> => {
    return apiClient.get('/notifications/unread-count');
  },

  // 标记单个通知为已读
  markAsRead: async (notificationId: string): Promise<{ data: { success: boolean } }> => {
    return apiClient.put(`/notifications/${notificationId}/read`);
  },

  // 标记所有通知为已读
  markAllAsRead: async (): Promise<{ data: { success: boolean; marked_count: number } }> => {
    return apiClient.put('/notifications/read-all');
  },

  // 删除通知
  deleteNotification: async (notificationId: string): Promise<{ data: { success: boolean } }> => {
    return apiClient.delete(`/notifications/${notificationId}`);
  },
};
