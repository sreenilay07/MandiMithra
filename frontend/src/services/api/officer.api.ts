import { apiClient } from './apiClient';

export const officerApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/officers/me/dashboard');
    return res.data;
  }
};
