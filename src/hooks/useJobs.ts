import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { JobPost, PaginatedResponse } from '../types';

interface JobFilters {
  search?: string;
  category?: string;
  barangay?: string;
  municipality?: string;
}

export const useJobs = (filters?: JobFilters) => {
  return useQuery<PaginatedResponse<JobPost>, Error>({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams({ per_page: '50' });
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters?.barangay) params.append('barangay', filters.barangay);
      if (filters?.municipality) params.append('municipality', filters.municipality);
      
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
