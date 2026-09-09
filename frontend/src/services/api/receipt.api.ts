import { apiClient } from './apiClient';

export interface ProcurementReceipt {
  _id: string;
  receiptNumber: string;
  procurementId: string;
  bookingId: string;
  farmerId: string;
  farmerName: string;
  tokenNumber: string;
  centreId: string;
  centreName: string;
  districtName?: string;
  cropName: string;
  registeredQuantity: number;
  actualWeight: number;
  quantityInQuintal: number;
  appliedPrice: number;
  priceUnit: string;
  grossAmount: number;
  paymentStatus: string;
  completedAt: string;
  stagesCompleted: Array<{
    stageNumber: number;
    stageName: string;
    completedAt: string;
  }>;
}

export const receiptApi = {
  getById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: ProcurementReceipt }>(`/receipts/${id}`);
    return response.data;
  },

  getByBooking: async (bookingId: string) => {
    const response = await apiClient.get<{ success: boolean; data: ProcurementReceipt }>(`/receipts/booking/${bookingId}`);
    return response.data;
  },

  getDownloadUrl: (id: string, print = false) => {
    const baseURL = apiClient.defaults.baseURL || '/api/v1';
    return `${baseURL}/receipts/${id}/download${print ? '?print=true' : ''}`;
  }
};
