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

  jobRequest: async (applicationId: number) => {
    return apiClient<{ message: string }>(`/applications/${applicationId}/request`, {
      method: 'POST',
    });
  },

  confirmHire: async (applicationId: number, price: number) => {
    return apiClient<{ message: string }>(`/applications/${applicationId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ price }),
    });
  },

  cancelHire: async (applicationId: number) => {
    return apiClient<{ message: string }>(`/applications/${applicationId}/cancel`, {
      method: 'POST',
    });
  },

  getContact: async (applicationId: number) => {
    return apiClient<{ phone: string }>(`/applications/${applicationId}/contact`);
  },
};
