import { apiClient } from './client';

export interface SubmitReportPayload {
  reported_user_id?: number;
  job_post_id?: number;
  reason: string;
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
