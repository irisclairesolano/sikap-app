import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { JobPost, PaginatedResponse } from '../types';

interface JobFilters {
  search?: string;
  category?: string;
  barangay?: string;
  municipality?: string;
  skills?: string[];
}

export const useJobs = (filters?: JobFilters) => {
  return useQuery<PaginatedResponse<JobPost>, Error>({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams({ per_page: '50' });
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category && filters.category !== 'All')
        params.append('category', filters.category);
      if (filters?.barangay) params.append('barangay', filters.barangay);
      if (filters?.municipality) params.append('municipality', filters.municipality);
      if (filters?.skills && filters.skills.length > 0) {
        filters.skills.forEach((skill) => {
          params.append('skills[]', skill);
        });
      }

      const response = await apiClient<PaginatedResponse<JobPost>>(`/jobs?${params.toString()}`);
      return response;
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, number>({
    mutationFn: async (id) => {
      return apiClient<{ message: string }>(`/jobs/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['archivedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useMarkJobComplete = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, number>({
    mutationFn: async (id) => {
      return apiClient<{ message: string }>(`/jobs/${id}/complete`, { method: 'PATCH' });
    },
    onSuccess: (_, jobId) => {
      // 1. Immediately update matching job and applications in myJobs in-memory cache
      queryClient.setQueriesData({ queryKey: ['myJobs'] }, (old: any) => {
        if (!old) return old;
        const updateJobItem = (job: any) => {
          if (Number(job.id) !== Number(jobId)) return job;
          const updatedApps = (job.applications || []).map((app: any) => {
            if (app.status === 'accepted') {
              return { ...app, status: 'completed' };
            }
            if (
              [
                'pending',
                'shortlisted',
                'employer_requested',
                'pending_negotiation',
                'employer_confirmed',
              ].includes(app.status)
            ) {
              return { ...app, status: 'rejected' };
            }
            return app;
          });
          return {
            ...job,
            status: 'completed',
            rating_window_expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            applications: updatedApps,
          };
        };

        if (Array.isArray(old.data)) {
          return { ...old, data: old.data.map(updateJobItem) };
        }
        if (Array.isArray(old)) {
          return old.map(updateJobItem);
        }
        return old;
      });

      queryClient.invalidateQueries({ queryKey: ['employer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};
