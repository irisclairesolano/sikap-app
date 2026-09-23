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
    onSuccess: () => {
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
