import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { JobPost, PaginatedResponse } from '../types';

export const useJobs = () => {
  return useQuery<PaginatedResponse<JobPost>, Error>({
    queryKey: ['jobs'],
    queryFn: async () => {
      // Fetch a single page with a large per_page for Iteration 1 client-side filtering
      const response = await apiClient<PaginatedResponse<JobPost>>('/jobs?per_page=50');
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
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
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
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
    },
  });
};
