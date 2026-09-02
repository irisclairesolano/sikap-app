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
    onMutate: async (id: string) => {
      queryClient.setQueryData<NotificationsResponse>(['notifications'], (old) => {
        if (!old) return old;
        const updatedList = old.notifications?.data?.map((item) =>
          item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
        );
        return {
          ...old,
          unread_count: Math.max(0, (old.unread_count || 1) - 1),
          notifications: {
            ...old.notifications,
            data: updatedList || [],
          },
        };
      });
    },
    onSuccess: () => {
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
    onMutate: async () => {
      queryClient.setQueryData<NotificationsResponse>(['notifications'], (old) => {
        if (!old) return old;
        const updatedList = old.notifications?.data?.map((item) => ({
          ...item,
          read_at: item.read_at || new Date().toISOString(),
        }));
        return {
          ...old,
          unread_count: 0,
          notifications: {
            ...old.notifications,
            data: updatedList || [],
          },
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
