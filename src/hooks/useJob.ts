import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { JobPost } from '../types';

export const useJob = (id: number) => {
  return useQuery<JobPost, Error>({
    queryKey: ['jobs', id],
    queryFn: async () => {
      const response = await apiClient<JobPost>(`/jobs/${id}`);
      return response;
    },
    enabled: !!id,
  });
};
