import { apiClient } from './apiClient';

export const procurementApi = {
  getProcurementById: async (id: string) => {
    const res = await apiClient.get(`/procurements/${id}`);
    return res.data;
  },

  scanArrival: async (id: string, qrData: string) => {
    const res = await apiClient.post(`/procurements/${id}/arrival`, { qrData });
    return res.data;
  },

  getStages: async (procurementId: string) => {
    const res = await apiClient.get(`/procurements/${procurementId}/stages`);
    return res.data;
  },

  completeStage: async (procurementId: string, stageId: string, payload: any) => {
    const res = await apiClient.post(`/procurements/${procurementId}/stages/${stageId}/complete`, payload);
    return res.data;
  }
};
