import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reactToJob } from '../api/jobs';

const updateJobInCache = (
  job: any,
  jobId: number,
  user_has_reacted: boolean,
  reactions_count: number,
) => {
  if (job?.id === jobId) {
    return {
      ...job,
      user_has_reacted,
      reactions_count: Math.max(0, reactions_count),
    };
  }
  return job;
};

const updateCacheDataStructure = (
  oldData: any,
  jobId: number,
  user_has_reacted: boolean,
  reactions_count: number,
) => {
  if (!oldData) return oldData;

  // Case 1: Paginated response with old.data as Array
  if (Array.isArray(oldData.data)) {
    return {
      ...oldData,
      data: oldData.data.map((j: any) =>
        updateJobInCache(j, jobId, user_has_reacted, reactions_count),
      ),
    };
  }

  // Case 2: Array of jobs directly
  if (Array.isArray(oldData)) {
    return oldData.map((j: any) => updateJobInCache(j, jobId, user_has_reacted, reactions_count));
  }

  // Case 3: Infinite query with pages
  if (Array.isArray(oldData.pages)) {
    return {
      ...oldData,
      pages: oldData.pages.map((page: any) => {
        if (Array.isArray(page?.data)) {
          return {
            ...page,
            data: page.data.map((j: any) =>
              updateJobInCache(j, jobId, user_has_reacted, reactions_count),
            ),
          };
        }
        if (Array.isArray(page)) {
          return page.map((j: any) =>
            updateJobInCache(j, jobId, user_has_reacted, reactions_count),
          );
        }
        return page;
      }),
    };
  }

  // Case 4: Single Job object
  if (oldData.id === jobId) {
    return {
      ...oldData,
      user_has_reacted,
      reactions_count: Math.max(0, reactions_count),
    };
  }

  return oldData;
};

export const useReactToJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => reactToJob(jobId),

    // Optimistic update — flip the UI instantly across all list caches
    onMutate: async (jobId: number) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      await queryClient.cancelQueries({ queryKey: ['job', jobId] });
      await queryClient.cancelQueries({ queryKey: ['saved-jobs'] });

      const previousJobs = queryClient.getQueriesData({ queryKey: ['jobs'] });
      const previousJob = queryClient.getQueryData(['job', jobId]);
      const previousSavedJobs = queryClient.getQueryData(['saved-jobs']);

      // Determine current reaction state from any existing cache entry
      let currentReacted = false;
      let currentCount = 0;

      if (previousJob && typeof (previousJob as any).user_has_reacted === 'boolean') {
        currentReacted = (previousJob as any).user_has_reacted;
        currentCount = (previousJob as any).reactions_count || 0;
      } else {
        for (const [, qData] of previousJobs) {
          const list = Array.isArray((qData as any)?.data)
            ? (qData as any).data
            : Array.isArray(qData)
              ? qData
              : [];
          const found = list.find((j: any) => j?.id === jobId);
          if (found) {
            currentReacted = Boolean(found.user_has_reacted);
            currentCount = found.reactions_count || 0;
            break;
          }
        }
      }

      const nextReacted = !currentReacted;
      const nextCount = nextReacted ? currentCount + 1 : Math.max(0, currentCount - 1);

      // Optimistically update all queries under ['jobs']
      queryClient.setQueriesData({ queryKey: ['jobs'] }, (old: any) =>
        updateCacheDataStructure(old, jobId, nextReacted, nextCount),
      );

      // Optimistically update single job cache
      queryClient.setQueryData(['job', jobId], (old: any) =>
        updateCacheDataStructure(old, jobId, nextReacted, nextCount),
      );

      // Optimistically update saved jobs cache if present
      queryClient.setQueriesData({ queryKey: ['saved-jobs'] }, (old: any) =>
        updateCacheDataStructure(old, jobId, nextReacted, nextCount),
      );

      return { previousJobs, previousJob, previousSavedJobs };
    },

    // On error, revert to snapshot
    onError: (_err, jobId, context) => {
      if (context?.previousJobs) {
        context.previousJobs.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousJob) {
        queryClient.setQueryData(['job', jobId], context.previousJob);
      }
      if (context?.previousSavedJobs) {
        queryClient.setQueryData(['saved-jobs'], context.previousSavedJobs);
      }
    },

    // On success, apply authoritative server truth
    onSuccess: (result, jobId) => {
      queryClient.setQueriesData({ queryKey: ['jobs'] }, (old: any) =>
        updateCacheDataStructure(old, jobId, result.reacted, result.reactions_count),
      );

      queryClient.setQueryData(['job', jobId], (old: any) =>
        updateCacheDataStructure(old, jobId, result.reacted, result.reactions_count),
      );

      queryClient.setQueriesData({ queryKey: ['saved-jobs'] }, (old: any) =>
        updateCacheDataStructure(old, jobId, result.reacted, result.reactions_count),
      );
    },

    // When mutation is settled (success or fail), invalidate to ensure 100% sync
    onSettled: (_result, _err, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
  });
};
