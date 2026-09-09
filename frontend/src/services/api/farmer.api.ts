import { apiClient } from './apiClient';

export const farmerApi = {
  getProfile: async () => {
    const res = await apiClient.get('/farmers/me');
    return res.data;
  },

  updateProfile: async (data: any) => {
    const res = await apiClient.patch('/farmers/me', data);
    return res.data;
  },

  getQueueDetails: async () => {
    const res = await apiClient.get('/farmers/me/queue');
    return res.data;
  }
};
