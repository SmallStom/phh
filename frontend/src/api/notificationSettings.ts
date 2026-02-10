import apiClient from './client';

export interface NotificationSettings {
  email_enabled: boolean;
  push_enabled: boolean;
  like_enabled: boolean;
  comment_enabled: boolean;
  follow_enabled: boolean;
  mention_enabled: boolean;
}

export const notificationSettingsApi = {
  getSettings: async (): Promise<{ data: NotificationSettings }> => {
    return apiClient.get('/notification-settings');
  },

  updateSettings: async (settings: NotificationSettings): Promise<{ data: NotificationSettings }> => {
    return apiClient.put('/notification-settings', settings);
  },

  resetSettings: async (): Promise<void> => {
    return apiClient.delete('/notification-settings');
  },
};