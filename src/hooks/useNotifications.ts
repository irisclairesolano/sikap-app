import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    staleTime: 30 * 1000,
    // Keep unread badges synced in background as fallback
    refetchInterval: 10000,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<any>(`/notifications/${id}/read`, { method: 'POST' });
    },
    onSuccess: (data) => {
      // Optimistically update or invalidate cache
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return apiClient<any>('/notifications/read-all', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
