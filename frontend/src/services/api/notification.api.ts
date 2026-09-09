import { apiClient } from './apiClient';

export const notificationApi = {
  getNotifications: async () => {
    const res = await apiClient.get('/notifications');
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  }
};
