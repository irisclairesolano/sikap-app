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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
