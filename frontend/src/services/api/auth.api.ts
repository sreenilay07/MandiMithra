import { apiClient } from './apiClient';

export const authApi = {
  registerFarmer: async (data: any) => {
    const res = await apiClient.post('/auth/register/farmer', data);
    return res.data;
  },

  registerStaff: async (data: any) => {
    const res = await apiClient.post('/auth/register/staff', data);
    return res.data;
  },

  login: async (credentials: { phoneNumber?: string; email?: string; password?: string; otp?: string }) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  sendOtp: async (phoneNumber: string) => {
    const res = await apiClient.post('/auth/send-otp', { phoneNumber });
    return res.data;
  },

  verifyOtp: async (phoneNumber: string, otp: string) => {
    const res = await apiClient.post('/auth/verify-otp', { phoneNumber, otp });
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  }
};
