import { apiClient } from './apiClient';

export const managerApi = {
  getDashboard: async (centreId?: string) => {
    const res = await apiClient.get('/manager/dashboard', { params: { centreId } });
    return res.data;
  },

  getAnalytics: async (centreId: string) => {
    const res = await apiClient.get(`/manager/analytics/${centreId}`);
    return res.data;
  },

  getAssignedOfficers: async (centreId: string) => {
    const res = await apiClient.get(`/centres/${centreId}/officers`);
    return res.data;
  },

  assignOfficer: async (centreId: string, data: { officerId: string; counterId?: string }) => {
    const res = await apiClient.post(`/centres/${centreId}/officers/assign`, data);
    return res.data;
  },

  updateCentreConfig: async (centreId: string, data: any) => {
    const res = await apiClient.patch(`/centres/${centreId}`, data);
    return res.data;
  }
};
