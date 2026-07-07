import { useMutation } from '@tanstack/react-query';
import { reportsApi, SubmitReportPayload } from '../api/reports';

export const useSubmitReport = () => {
  return useMutation<{ message: string }, Error, SubmitReportPayload>({
    mutationFn: (payload) => reportsApi.submitReport(payload),
  });
};
