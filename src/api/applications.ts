import { apiClient } from './client';
import { Application } from '../types';

export const applicationsApi = {
  getJobApplications: async (jobId: number) => {
    return apiClient<Application[]>(`/jobs/${jobId}/applications`);
  },

  withdraw: async (applicationId: number) => {
    return apiClient<{ message: string }>(`/applications/${applicationId}`, {
      method: 'DELETE',
    });
  },

  jobRequest: async (applicationId: number | string) => {
    const cleanId = String(applicationId).replace(/[^0-9]/g, '');
    return apiClient<{ message: string }>(`/applications/${cleanId}/request`, {
      method: 'POST',
    });
  },

  shortlist: async (applicationId: number | string) => {
    const cleanId = String(applicationId).replace(/[^0-9]/g, '');
    return apiClient<{ message: string }>(`/applications/${cleanId}/request`, {
      method: 'POST',
    });
  },

  confirmHire: async (applicationId: number, price: number) => {
    return apiClient<{ message: string; conversation_id?: number }>(
      `/applications/${applicationId}/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({ price, final_agreed_price: price }),
      },
    );
  },

  cancelHire: async (applicationId: number) => {
    return apiClient<{ message: string }>(`/applications/${applicationId}/cancel`, {
      method: 'POST',
    });
  },

  getContact: async (applicationId: number) => {
    return apiClient<{ phone: string }>(`/applications/${applicationId}/contact`);
  },

  getById: async (applicationId: number): Promise<Application> => {
    const res = await apiClient<any>(`/applications/${applicationId}`);
    return (res?.data ?? res) as Application;
  },
};
