import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/jobs';
import { JobPost, PaginatedResponse } from '../types';

export const useEmployerJobs = () => {
  return useQuery<PaginatedResponse<JobPost>, Error>({
    queryKey: ['myJobs'],
    queryFn: jobsApi.getMyJobs,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => jobsApi.createJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<JobPost> }) =>
      jobsApi.updateJob(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => jobsApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['archivedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useArchivedJobs = () => {
  return useQuery<PaginatedResponse<JobPost>, Error>({
    queryKey: ['archivedJobs'],
    queryFn: jobsApi.getArchivedJobs,
  });
};

export const useRestoreJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => jobsApi.restoreJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['archivedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};
