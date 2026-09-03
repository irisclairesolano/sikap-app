import { apiClient } from './client';
import { JobPost, PaginatedResponse } from '../types';

export const jobsApi = {
  createJob: async (payload: any) => {
    return apiClient<{ message: string; job: JobPost }>('/jobs', {
      method: 'POST',
      body:
        typeof FormData !== 'undefined' && payload instanceof FormData
          ? payload
          : JSON.stringify(payload),
    });
  },

  updateJob: async (id: number, payload: Partial<JobPost>) => {
    return apiClient<{ message: string; job: JobPost }>(`/jobs/${id}`, {
      method: 'PATCH',
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

  getArchivedJobs: async () => {
    return apiClient<PaginatedResponse<JobPost>>('/jobs/archived');
  },

  restoreJob: async (id: number) => {
    return apiClient<{ message: string }>(`/jobs/${id}/restore`, {
      method: 'PATCH',
    });
  },

  markJobComplete: async (id: number) => {
    return apiClient<{ message: string }>(`/jobs/${id}/complete`, {
      method: 'PATCH',
    });
  },
};

export const reactToJob = async (
  jobId: number,
): Promise<{ reacted: boolean; reactions_count: number }> => {
  return apiClient<{ reacted: boolean; reactions_count: number }>(`/jobs/${jobId}/react`, {
    method: 'POST',
  });
};

export const getShareLink = async (
  jobId: number,
): Promise<{ share_link: string; job_title: string }> => {
  return apiClient<{ share_link: string; job_title: string }>(`/jobs/${jobId}/share-link`);
};
