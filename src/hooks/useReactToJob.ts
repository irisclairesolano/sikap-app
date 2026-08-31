import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reactToJob } from '../api/jobs';

export const useReactToJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => reactToJob(jobId),

    // Optimistic update — flip the UI instantly
    onMutate: async (jobId: number) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      await queryClient.cancelQueries({ queryKey: ['job', jobId] });

      const previousJobs = queryClient.getQueriesData({ queryKey: ['jobs'] });
      const previousJob = queryClient.getQueryData(['job', jobId]);

      // Update all paginated job list caches
      queryClient.setQueriesData({ queryKey: ['jobs'] }, (old: any) => {
        if (!old) return old;
        const pages = old?.data;
        if (Array.isArray(pages)) {
          return {
            ...old,
            data: pages.map((job: any) =>
              job.id === jobId
                ? {
                    ...job,
                    user_has_reacted: !job.user_has_reacted,
                    reactions_count: job.user_has_reacted
                      ? Math.max((job.reactions_count || 1) - 1, 0)
                      : (job.reactions_count || 0) + 1,
                  }
                : job,
            ),
          };
        }
        return old;
      });

      // Update single job cache
      queryClient.setQueryData(['job', jobId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          user_has_reacted: !old.user_has_reacted,
          reactions_count: old.user_has_reacted
            ? Math.max((old.reactions_count || 1) - 1, 0)
            : (old.reactions_count || 0) + 1,
        };
      });

      return { previousJobs, previousJob };
    },

    // On error, revert
    onError: (_err, jobId, context) => {
      if (context?.previousJobs) {
        context.previousJobs.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousJob) {
        queryClient.setQueryData(['job', jobId], context.previousJob);
      }
    },

    // On success, apply server truth then invalidate to sync counts
    onSuccess: (result, jobId) => {
      // Apply authoritative server values
      queryClient.setQueriesData({ queryKey: ['jobs'] }, (old: any) => {
        if (!old) return old;
        const pages = old?.data;
        if (Array.isArray(pages)) {
          return {
            ...old,
            data: pages.map((job: any) =>
              job.id === jobId
                ? {
                    ...job,
                    user_has_reacted: result.reacted,
                    reactions_count: result.reactions_count,
                  }
                : job,
            ),
          };
        }
        return old;
      });

      queryClient.setQueryData(['job', jobId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          user_has_reacted: result.reacted,
          reactions_count: result.reactions_count,
        };
      });
    },
  });
};
