import { create } from 'zustand';

export interface User {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  role: 'FARMER' | 'CENTER_OPERATOR' | 'PROCUREMENT_OFFICER' | 'CENTRE_MANAGER' | 'CENTER_MANAGER' | 'DISTRICT_ADMIN' | 'DISTRICT_OFFICER' | 'SUPER_ADMIN';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ACTIVE';
  language?: string;
  districtId?: string;
  centreId?: string;
  createdAt?: string;
  employeeId?: string;
}

export interface FarmerProfile {
  farmerId: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  aadhaarLast4: string;
  bankAccountLast4: string;
  landPassbookReference: string;
}

interface AuthState {
  user: User | null;
  farmerProfile: FarmerProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: { accessToken: string; refreshToken: string }, profile?: FarmerProfile | null) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedUser = localStorage.getItem('mandimithra_user') || localStorage.getItem('agriflow_user');
  const savedProfile = localStorage.getItem('mandimithra_profile') || localStorage.getItem('agriflow_profile');
  const savedToken = localStorage.getItem('mandimithra_token') || localStorage.getItem('agriflow_token');
  const savedRefresh = localStorage.getItem('mandimithra_refresh') || localStorage.getItem('agriflow_refresh');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    farmerProfile: savedProfile ? JSON.parse(savedProfile) : null,
    accessToken: savedToken || null,
    refreshToken: savedRefresh || null,
    isAuthenticated: !!savedToken,

    setAuth: (user, tokens, profile = null) => {
      localStorage.setItem('mandimithra_user', JSON.stringify(user));
      localStorage.setItem('mandimithra_token', tokens.accessToken);
      localStorage.setItem('mandimithra_refresh', tokens.refreshToken);
      if (profile) {
        localStorage.setItem('mandimithra_profile', JSON.stringify(profile));
      }

      set({
        user,
        farmerProfile: profile || null,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true
      });
    },

    setUser: (user) => {
      localStorage.setItem('mandimithra_user', JSON.stringify(user));
      set({ user });
    },

    logout: () => {
      localStorage.removeItem('mandimithra_user');
      localStorage.removeItem('mandimithra_profile');
      localStorage.removeItem('mandimithra_token');
      localStorage.removeItem('mandimithra_refresh');
      localStorage.removeItem('agriflow_user');
      localStorage.removeItem('agriflow_profile');
      localStorage.removeItem('agriflow_token');
      localStorage.removeItem('agriflow_refresh');

      set({
        user: null,
        farmerProfile: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false
      });
    }
  };
});
