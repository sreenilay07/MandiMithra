import { apiClient } from './apiClient';

export const centreApi = {
  getCentres: async (params?: any) => {
    const res = await apiClient.get('/centres', { params });
    return res.data;
  },

  getAllCentres: async (params?: any) => {
    const res = await apiClient.get('/centres/list', { params });
    return res.data;
  },

  getCentreById: async (id: string) => {
    const res = await apiClient.get(`/centres/${id}`);
    return res.data;
  },

  createCentre: async (data: any) => {
    const res = await apiClient.post('/centres', data);
    return res.data;
  },

  updateCentre: async (id: string, data: any) => {
    const res = await apiClient.patch(`/centres/${id}`, data);
    return res.data;
  },

  getCrops: async () => {
    const res = await apiClient.get('/crops');
    return res.data;
  },

  getCounters: async (centreId: string) => {
    const res = await apiClient.get(`/centres/${centreId}/counters`);
    return res.data;
  },

  createCounter: async (centreId: string, data: any) => {
    const res = await apiClient.post(`/centres/${centreId}/counters`, data);
    return res.data;
  },

  openCounter: async (counterId: string) => {
    const res = await apiClient.post(`/counters/${counterId}/open`);
    return res.data;
  },

  closeCounter: async (counterId: string) => {
    const res = await apiClient.post(`/counters/${counterId}/close`);
    return res.data;
  }
};
