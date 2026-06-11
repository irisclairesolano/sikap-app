import { useQuery } from '@tanstack/react-query';
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
