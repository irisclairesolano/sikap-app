import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface NotificationItem {
  id: string;
  type: string;
  data: any;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  unread_count: number;
  notifications: {
    data: NotificationItem[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

export const useNotifications = () => {
  return useQuery<NotificationsResponse, Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient<NotificationsResponse>('/notifications');
      return response;
    },
  });
};
