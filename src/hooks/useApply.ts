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
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number>({
    mutationFn: async (applicationId) => {
      return apiClient<{ message: string }>(`/applications/${applicationId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useAcceptOffer = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number>({
    mutationFn: async (applicationId) => {
      return apiClient<{ message: string }>(`/applications/${applicationId}/accept`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useRejectOffer = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number>({
    mutationFn: async (applicationId) => {
      return apiClient<{ message: string }>(`/applications/${applicationId}/reject`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
