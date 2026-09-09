import { apiClient } from './apiClient';

export const paymentApi = {
  getMyPayments: async () => {
    const res = await apiClient.get('/payments/my-payments');
    return res.data;
  },

  getByProcurement: async (procurementId: string) => {
    const res = await apiClient.get(`/payments/procurement/${procurementId}`);
    return res.data;
  }
};
