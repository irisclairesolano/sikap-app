import { apiClient } from './client';

export interface SubmitReportPayload {
  reportable_type: 'user' | 'job_post' | 'application';
  reportable_id: number;
  type: 'harassment' | 'fake_account' | 'inappropriate_job' | 'other';
  description: string;
}

export const reportsApi = {
  submitReport: async (payload: SubmitReportPayload) => {
    return apiClient<{ message: string }>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
