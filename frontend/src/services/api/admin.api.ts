import { apiClient } from './apiClient';

export const adminApi = {
  getUsers: async (params?: any) => {
    const res = await apiClient.get('/users', { params });
    return res.data;
  },

  createUser: async (data: any) => {
    const res = await apiClient.post('/users', data);
    return res.data;
  },

  updateUser: async (id: string, data: any) => {
    const res = await apiClient.patch(`/users/${id}`, data);
    return res.data;
  },

  getAuditLogs: async (params?: any) => {
    const res = await apiClient.get('/audit-logs', { params });
    return res.data;
  }
};
