import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi, SubmitReportPayload, UserReportItem } from '../api/reports';
import { getItemAsync, setItemAsync } from '../utils/storage';

export const REPORTS_BADGE_KEY = 'sikap_has_unseen_reports';
export const LAST_VIEWED_REPORTS_AT_KEY = 'sikap_last_viewed_reports_at';

export const markReportSubmitted = async (): Promise<void> => {
  try {
    await setItemAsync(REPORTS_BADGE_KEY, 'true');
  } catch (e) {
    console.warn('Failed to mark report submitted flag:', e);
  }
};

export const markReportsViewed = async (): Promise<void> => {
  try {
    await setItemAsync(REPORTS_BADGE_KEY, 'false');
    await setItemAsync(LAST_VIEWED_REPORTS_AT_KEY, new Date().toISOString());
  } catch (e) {
    console.warn('Failed to mark reports viewed flag:', e);
  }
};

export const useReportsBadge = (): boolean => {
  const query = useQuery<boolean>({
    queryKey: ['reports-badge'],
    queryFn: async () => {
      try {
        const unseenFlag = await getItemAsync(REPORTS_BADGE_KEY);
        if (unseenFlag === 'true') {
          return true;
        }

        const lastViewedStr = await getItemAsync(LAST_VIEWED_REPORTS_AT_KEY);
        const lastViewed = lastViewedStr ? new Date(lastViewedStr).getTime() : 0;

        const res = await reportsApi.getMyReports();
        const rawReports = Array.isArray(res) ? res : (res as any)?.data;
        const reports: UserReportItem[] = Array.isArray(rawReports) ? rawReports : [];

        if (reports.length > 0) {
          // If the user has reports but has never opened My Reports yet, show badge
          if (!lastViewed) {
            return true;
          }

          // Check if any report was submitted or updated after the last viewed timestamp
          const hasNew = reports.some((r) => {
            const created = r.created_at ? new Date(r.created_at).getTime() : 0;
            const resolved = r.resolved_at ? new Date(r.resolved_at).getTime() : 0;
            return created > lastViewed || resolved > lastViewed;
          });

          return hasNew;
        }

        return false;
      } catch {
        return false;
      }
    },
    staleTime: 5000,
  });

  return query.data ?? false;
};

export const useSubmitReport = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; report_id?: number }, Error, SubmitReportPayload>({
    mutationFn: (payload) => reportsApi.submitReport(payload),
    onSuccess: async () => {
      await markReportSubmitted();
      queryClient.setQueryData(['reports-badge'], true);
      await queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      await queryClient.refetchQueries({ queryKey: ['my-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['reports-badge'] });
    },
  });
};

export const useMyReports = () => {
  return useQuery<{ data: UserReportItem[] }, Error>({
    queryKey: ['my-reports'],
    queryFn: () => reportsApi.getMyReports(),
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};
