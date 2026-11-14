import { useMutation, useQuery } from '@tanstack/react-query';
import { reportsApi, SubmitReportPayload, UserReportItem } from '../api/reports';

export const useSubmitReport = () => {
  return useMutation<{ message: string }, Error, SubmitReportPayload>({
    mutationFn: (payload) => reportsApi.submitReport(payload),
  });
};

export const useMyReports = () => {
  return useQuery<{ data: UserReportItem[] }, Error>({
    queryKey: ['my-reports'],
    queryFn: () => reportsApi.getMyReports(),
  });
};
