import { apiClient } from './apiClient';

export interface MockAadhaarResponse {
  status: 'VERIFIED' | 'FAILED';
  nameMatch: boolean;
  maskedAadhaar: string;
  verificationReference: string;
  verifiedAt: string;
  disclaimer: string;
  message: string;
}

export interface DocumentVerification {
  _id?: string;
  procurementId: string;
  bookingId: string;
  farmerId: string;
  centreId: string;
  aadhaarReference: string;
  aadhaarName: string;
  aadhaarStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  accountHolderName: string;
  bankName: string;
  accountNumberMasked: string;
  ifscCode: string;
  accountType: 'SAVINGS' | 'CURRENT';
  bankStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  passbookStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  passbookRemarks?: string;
  landRecordStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_APPLICABLE';
  overallStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string;
}

export const documentApi = {
  mockAadhaarVerify: async (aadhaarNumber: string, name?: string) => {
    const response = await apiClient.post<{ success: boolean; data: MockAadhaarResponse }>('/documents/mock-aadhaar-verify', {
      aadhaarNumber,
      name
    });
    return response.data;
  },

  getByProcurement: async (procurementId: string) => {
    const response = await apiClient.get<{ success: boolean; data: DocumentVerification }>(`/documents/procurement/${procurementId}`);
    return response.data;
  },

  saveVerification: async (procurementId: string, payload: Partial<DocumentVerification> & { accountNumber?: string; confirmAccountNumber?: string }) => {
    const response = await apiClient.post<{ success: boolean; data: DocumentVerification }>(`/documents/procurement/${procurementId}`, payload);
    return response.data;
  }
};
