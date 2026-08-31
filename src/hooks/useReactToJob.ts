import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reactToJob } from '../api/jobs';

export const useReactToJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => reactToJob(jobId),
    onMutate: async (jobId: number) => {
      // Optimistic update on job list queries
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['jobs'] });

      queryClient.setQueriesData({ queryKey: ['jobs'] }, (old: any) => {
        if (!old) return old;
        // Handle paginated data structures
        const jobs = Array.isArray(old) ? old : old?.data || old?.jobs || [];
        const updated = jobs.map((job: any) =>
          job.id === jobId
            ? {
                ...job,
                user_has_reacted: !job.user_has_reacted,
                reactions_count: job.user_has_reacted
                  ? (job.reactions_count || 1) - 1
                  : (job.reactions_count || 0) + 1,
              }
            : job,
        );
        if (Array.isArray(old)) return updated;
        return { ...old, data: updated };
      });

      return { previousData };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (result, jobId) => {
      // Update single job query if cached
      queryClient.setQueryData(['job', jobId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          reactions_count: result.reactions_count,
          user_has_reacted: result.reacted,
        };
      });

      // Update all job lists in cache in-place
      queryClient.setQueriesData({ queryKey: ['jobs'] }, (old: any) => {
        if (!old) return old;
        const jobs = Array.isArray(old) ? old : old?.data || old?.jobs || [];
        const updated = jobs.map((job: any) =>
          job.id === jobId
            ? {
                ...job,
                user_has_reacted: result.reacted,
                reactions_count: result.reactions_count,
              }
            : job,
        );
        if (Array.isArray(old)) return updated;
        return { ...old, data: updated };
      });
    },
  });
};
