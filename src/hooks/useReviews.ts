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
  reviewer: Reviewer;
  reviewer_role: string;
  cat1: number;
  cat2: number;
  cat3: number;
  cat4: number;
  overall_rating: number;
  comment: string | null;
}

export interface ReviewsResponse {
  reputation_score: number;
  reviews_count: number;
  reviews: ReviewItem[];
}

export const useReviews = () => {
  return useQuery<ReviewsResponse, Error>({
    queryKey: ['reviews'],
    queryFn: async () => {
      const response = await apiClient<ReviewsResponse>('/reviews');
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
    { message: string },
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
