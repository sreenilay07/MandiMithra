import { apiClient } from './apiClient';

export const qrApi = {
  generateBookingQR: async (bookingId: string) => {
    const res = await apiClient.post<{ success: boolean; data: any }>(`/qr/generate/${bookingId}`);
    return res.data;
  },

  getQRData: async (procurementId: string, stageNumber: number = 0, type: string = 'ARRIVAL') => {
    const res = await apiClient.get<{ success: boolean; data: any }>(`/qr/procurement/${procurementId}`, {
      params: { stageNumber, type }
    });
    return res.data;
  },

  scanQR: async (qrData: string) => {
    const res = await apiClient.post<{ success: boolean; data: any }>('/qr/scan', { qrData });
    return res.data;
  },

  verifyQRData: async (qrData: string) => {
    const res = await apiClient.post<{ success: boolean; data: any }>('/qr/scan', { qrData });
    return res.data;
  }
};
