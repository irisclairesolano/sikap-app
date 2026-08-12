import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { JobPost } from '../types';

export const useJob = (id: number) => {
  const queryClient = useQueryClient();

  return useQuery<JobPost, Error>({
    queryKey: ['jobs', id],
    queryFn: async () => {
      const response = await apiClient<JobPost>(`/jobs/${id}`);
      return response;
    },
    enabled: !!id,
    initialData: () => {
      // Find the job from existing lists
      const jobQueries = queryClient.getQueriesData<any>({ queryKey: ['jobs'] });
      for (const [key, queryData] of jobQueries) {
        if (!queryData) continue;

        // Skip our own query key
        if (key.length === 2 && key[0] === 'jobs' && key[1] === id) {
          continue;
        }

        const jobList = queryData.data || queryData;
        if (Array.isArray(jobList)) {
          const found = jobList.find((j: any) => j.id === id);
          if (found) {
            return found;
          }
        }
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5, // Consider cache fresh for 5 minutes
  });
};
