import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../api/applications';
import { Application } from '../types';

export const useJobApplications = (jobId: number) => {
  return useQuery<Application[], Error>({
    queryKey: ['jobApplications', jobId],
    queryFn: () => applicationsApi.getJobApplications(jobId),
    enabled: !!jobId,
  });
};

export const useJobRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: number) => applicationsApi.jobRequest(applicationId),
    onSuccess: (_, applicationId) => {
      // Invalidate both job applications and specific queries if any
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
    },
  });
};

export const useConfirmHire = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, price }: { id: number; price: number }) =>
      applicationsApi.confirmHire(id, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
    },
  });
};

export const useCancelHire = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: number) => applicationsApi.cancelHire(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
    },
  });
};
