import { useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/jobs';
import { EmployerStats } from '../types';
import { useEmployerJobs } from './useEmployerJobs';
import { useAuth } from './useAuth';
import { useRealtimeUserEvents } from '../services/realtime';

export const useEmployerStats = () => {
  const queryClient = useQueryClient();
  const { data: myJobsData } = useEmployerJobs();
  const { user: authUser } = useAuth();

  // Subscribe to real-time user stats events over WebSockets
  useRealtimeUserEvents(authUser?.id);

  const {
    data: stats,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<EmployerStats, Error>({
    queryKey: ['employer-stats'],
    queryFn: jobsApi.getEmployerStats,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 1000 * 60 * 5,
  });

  // Fallback calculation from cached jobs if stats endpoint has not resolved yet
  const allJobs = myJobsData?.data || [];
  const fallbackHires = allJobs.reduce((acc, j) => {
    if (j.applications && Array.isArray(j.applications) && j.applications.length > 0) {
      const hiredCount = j.applications.filter(
        (a: any) =>
          a.status === 'accepted' || a.status === 'completed' || a.status === 'employer_confirmed',
      ).length;
      return acc + Math.max(hiredCount, (j.filled_slots ?? j.accepted_count) || 0);
    }
    return acc + ((j.filled_slots ?? j.accepted_count) || 0);
  }, 0);

  const fallbackPaid = allJobs.reduce((acc, j) => {
    const completedApps = (j.applications || []).filter(
      (a: any) => a.status === 'completed' || a.status === 'accepted',
    );
    const paid = completedApps.reduce(
      (pAcc: number, a: any) =>
        pAcc + (Number(a.final_agreed_price) || Number(j.compensation) || 0),
      0,
    );
    return acc + paid;
  }, 0);

  const fallbackActiveJobs = allJobs.filter(
    (j: any) =>
      j.status === 'open' || j.status === 'closed_in_progress' || j.status === 'in_progress',
  ).length;

  const userProfile: any = queryClient.getQueryData(['profile']) || authUser;
  const profileStats = userProfile?.employer_stats;

  const totalHires = stats?.total_hires ?? profileStats?.total_hires ?? fallbackHires;
  const totalPaid = stats?.total_paid ?? profileStats?.total_paid ?? fallbackPaid;
  const activeJobs = stats?.active_jobs ?? profileStats?.active_jobs ?? fallbackActiveJobs;

  const rawReputation =
    stats?.reputation_score ??
    profileStats?.reputation_score ??
    userProfile?.reputation_score ??
    null;
  const ratingsCount =
    stats?.ratings_count ?? profileStats?.ratings_count ?? userProfile?.ratings_count ?? 0;

  const reputationFormatted = (() => {
    if (ratingsCount === 0 || rawReputation === null || rawReputation === undefined) return 'N/A';
    const num = Number(rawReputation);
    if (isNaN(num) || num <= 0) return '0.0';
    if (num % 1 === 0) return num.toFixed(1);
    if (Number(num.toFixed(1)) === num) return num.toFixed(1);
    return Number(num.toFixed(2)).toString();
  })();

  const totalPaidFormatted = `₱${Math.round(totalPaid).toLocaleString()}`;

  return {
    stats,
    totalHires,
    totalPaid,
    totalPaidFormatted,
    activeJobs,
    reputation: rawReputation ? Number(rawReputation) : 0,
    reputationFormatted,
    ratingsCount,
    isLoading,
    isRefetching,
    refetch,
  };
};
