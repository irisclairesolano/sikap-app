import { useQuery } from '@tanstack/react-query';
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
