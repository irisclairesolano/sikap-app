import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface Reviewer {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ReviewItem {
  id: number;
  application_id?: number;
  reviewee_id?: number;
  reviewer: Reviewer;
  reviewer_role: string;
  cat1: number;
  cat2: number;
  cat3: number;
  cat4: number;
  overall_rating: number;
  comment: string | null;
  created_at?: string;
}

export interface ReviewsResponse {
  reputation_score: number;
  reviews_count: number;
  distribution?: Record<number, number>;
  reviews: ReviewItem[];
}

export const useReviews = (userId?: number, role?: 'worker' | 'employer') => {
  return useQuery<ReviewsResponse, Error>({
    queryKey: ['reviews', userId, role],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', String(userId));
      if (role) params.append('role', role);
      const queryStr = params.toString();
      const endpoint = queryStr ? `/reviews?${queryStr}` : '/reviews';
      const response = await apiClient<ReviewsResponse>(endpoint);
      return response;
    },
  });
};

export interface SubmitReviewPayload {
  cat1: number;
  cat2: number;
  cat3: number;
  cat4: number;
  comment?: string;
}

export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; content_warnings?: string[] },
    Error,
    { applicationId: number; payload: SubmitReviewPayload }
  >({
    mutationFn: async ({ applicationId, payload }) => {
      return apiClient<{ message: string }>(`/applications/${applicationId}/review`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, variables) => {
      // 1. Immediately set query data on the specific application
      queryClient.setQueriesData(
        { queryKey: ['application', variables.applicationId] },
        (old: any) => {
          if (!old) return old;
          const currentData = old.data || old;
          const overallRating =
            (variables.payload.cat1 +
              variables.payload.cat2 +
              variables.payload.cat3 +
              variables.payload.cat4) /
            4;
          const updated = {
            ...currentData,
            has_reviewed: true,
            user_review: {
              id: -1,
              overall_rating: overallRating,
              comment: variables.payload.comment || null,
              created_at: new Date().toISOString(),
            },
          };
          return old.data ? { ...old, data: updated } : updated;
        },
      );

      // 2. Immediately update matching application in myJobs
      queryClient.setQueriesData({ queryKey: ['myJobs'] }, (old: any) => {
        if (!old) return old;
        const updateApps = (apps: any[]) =>
          apps.map((app) =>
            Number(app.id) === Number(variables.applicationId)
              ? { ...app, has_reviewed: true }
              : app,
          );

        if (Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((job: any) => ({
              ...job,
              applications: updateApps(job.applications || []),
            })),
          };
        }
        if (Array.isArray(old)) {
          return old.map((job: any) => ({
            ...job,
            applications: updateApps(job.applications || []),
          }));
        }
        return old;
      });

      // 3. Immediately update matching application in my-applications
      queryClient.setQueriesData({ queryKey: ['my-applications'] }, (old: any) => {
        if (!old) return old;
        const updateList = (list: any[]) =>
          list.map((item) =>
            Number(item.id) === Number(variables.applicationId)
              ? { ...item, has_reviewed: true }
              : item,
          );
        if (Array.isArray(old.data)) {
          return { ...old, data: updateList(old.data) };
        }
        if (Array.isArray(old)) {
          return updateList(old);
        }
        return old;
      });

      // 4. Invalidate all relevant queries to refetch fresh server data
      queryClient.invalidateQueries({ queryKey: ['employer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
