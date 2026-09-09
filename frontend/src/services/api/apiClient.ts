import axios from 'axios';
import { ENV } from '../../config/env';
import { useAuthStore } from '../../store/useAuthStore';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor to handle errors & session expirations
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear authentication on token invalidation
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
