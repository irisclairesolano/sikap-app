import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface ApplyPayload {
  cover_note?: string;
}

interface ApplyResponse {
  message: string;
  application_id: number;
}

export const useApply = (jobId: number) => {
  const queryClient = useQueryClient();

  return useMutation<ApplyResponse, Error, ApplyPayload>({
    mutationFn: async (payload) => {
      return apiClient<ApplyResponse>(`/jobs/${jobId}/apply`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      // ['jobs'] invalidation is optional as requested
    },
  });
};
