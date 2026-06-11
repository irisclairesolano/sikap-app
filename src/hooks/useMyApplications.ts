import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Application } from '../types';

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export const useMyApplications = (statusFilter?: string) => {
  return useInfiniteQuery<PaginatedResponse<Application>, Error>({
    queryKey: ['my-applications', statusFilter],
    queryFn: async ({ pageParam = 1 }) => {
      let url = `/my-applications?page=${pageParam}`;
      if (statusFilter && statusFilter !== 'All') {
        // Map UI buckets to backend statuses
        let statusValues = '';
        switch (statusFilter) {
          case 'Waiting':
            statusValues = 'pending';
            break;
          case 'Offers':
            statusValues = 'employer_confirmed';
            break;
          case 'Active':
            statusValues = 'accepted';
            break;
          case 'Done':
            statusValues = 'completed,rejected,withdrawn,cancelled,expired';
            break;
        }
        if (statusValues) {
          url += `&status=${statusValues}`;
        }
      }
      return apiClient<PaginatedResponse<Application>>(url);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.current_page < lastPage.last_page) {
        return lastPage.current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};
