import { apiClient } from './client';
import { JobPost, PaginatedResponse } from '../types';

export const jobsApi = {
  createJob: async (payload: FormData) => {
    return apiClient<{ message: string; job: JobPost }>('/jobs', {
      method: 'POST',
      body: payload,
    });
  },

  updateJob: async (id: number, payload: Partial<JobPost>) => {
    return apiClient<{ message: string; job: JobPost }>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteJob: async (id: number) => {
    return apiClient<{ message: string }>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  getMyJobs: async () => {
    return apiClient<PaginatedResponse<JobPost>>('/my-jobs');
  },

  markJobComplete: async (id: number) => {
    return apiClient<{ message: string }>(`/jobs/${id}/complete`, {
      method: 'POST',
    });
  },
};
