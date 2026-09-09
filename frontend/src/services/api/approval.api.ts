import { apiClient } from './apiClient';

export interface ApprovalRequestItem {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    phoneNumber: string;
    email?: string;
    state?: string;
    district?: string;
    employeeId?: string;
    createdAt?: string;
  };
  requestedRole: string;
  districtId?: {
    _id: string;
    name: string;
    code: string;
    state: string;
  };
  centreId?: {
    _id: string;
    name: string;
    code: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  remarks?: string;
  createdAt: string;
}

export const approvalApi = {
  getPendingCentreManagers: async () => {
    const response = await apiClient.get('/approvals/centre-managers');
    return response.data;
  },

  getPendingCentreOperators: async () => {
    const response = await apiClient.get('/approvals/centre-operators');
    return response.data;
  },

  getPendingDistrictAdmins: async () => {
    const response = await apiClient.get('/approvals/district-admins');
    return response.data;
  },

  approveRequest: async (id: string, remarks: string = '') => {
    const response = await apiClient.patch(`/approvals/${id}/approve`, { remarks });
    return response.data;
  },

  rejectRequest: async (id: string, rejectionReason: string, remarks: string = '') => {
    const response = await apiClient.patch(`/approvals/${id}/reject`, { rejectionReason, remarks });
    return response.data;
  }
};
