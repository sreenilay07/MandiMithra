import { apiClient } from './apiClient';

export interface CentrePricing {
  _id: string;
  centreId: string;
  cropId: string;
  cropName: string;
  price: number;
  unit: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export const pricingApi = {
  getByCentre: async (centreId: string) => {
    const response = await apiClient.get<{ success: boolean; data: CentrePricing[] }>(`/pricing/centre/${centreId}`);
    return response.data;
  },

  getHistory: async (centreId: string) => {
    const response = await apiClient.get<{ success: boolean; data: CentrePricing[] }>(`/pricing/history/${centreId}`);
    return response.data;
  },

  createOrUpdatePrice: async (payload: {
    centreId: string;
    cropId: string;
    cropName?: string;
    price: number;
    unit?: string;
    effectiveFrom?: string;
  }) => {
    const response = await apiClient.post<{ success: boolean; data: CentrePricing }>('/pricing', payload);
    return response.data;
  },

  updateStatus: async (id: string, payload: { price?: number; status?: 'ACTIVE' | 'INACTIVE'; unit?: string }) => {
    const response = await apiClient.patch<{ success: boolean; data: CentrePricing }>(`/pricing/${id}`, payload);
    return response.data;
  }
};
