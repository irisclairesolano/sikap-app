import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { JobPost } from '../types';

export const useSavedJobs = () => {
  return useQuery({
    queryKey: ['saved-jobs'],
    queryFn: async () => {
      return await apiClient<{ data: JobPost[] }>('/saved-jobs');
    },
  });
};

export const useToggleSaveJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number) => {
      return await apiClient<{ message: string; saved: boolean }>(`/jobs/${jobId}/save`, {
        method: 'POST',
      });
    },
    onMutate: async (jobId: number) => {
      await queryClient.cancelQueries({ queryKey: ['saved-jobs'] });

      const previousSavedJobs = queryClient.getQueryData<{ data: JobPost[] }>(['saved-jobs']);

      if (previousSavedJobs?.data) {
        const isSaved = previousSavedJobs.data.some((j) => j.id === jobId);

        if (isSaved) {
          queryClient.setQueryData<{ data: JobPost[] }>(['saved-jobs'], {
            ...previousSavedJobs,
            data: previousSavedJobs.data.filter((j) => j.id !== jobId),
          });
        } else {
          let fullJob = queryClient
            .getQueryData<{ data: JobPost[] }>(['jobs'])
            ?.data?.find((j) => j.id === jobId);
          if (!fullJob) {
            fullJob = queryClient.getQueryData<JobPost>(['job', jobId]);
          }

          const newJob = fullJob ? fullJob : ({ id: jobId } as JobPost);

          queryClient.setQueryData<{ data: JobPost[] }>(['saved-jobs'], {
            ...previousSavedJobs,
            data: [newJob, ...previousSavedJobs.data],
          });
        }
      }

      return { previousSavedJobs };
    },
    onError: (err, jobId, context) => {
      if (context?.previousSavedJobs) {
        queryClient.setQueryData(['saved-jobs'], context.previousSavedJobs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
  });
};
