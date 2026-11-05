import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { triggerSystemNotification } from './usePushNotifications';
import { formatLocalizedNotification } from '../utils/notificationFormatter';

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

const seenNotificationIds = new Set<string>();
let initialLoadComplete = false;

export const useNotifications = () => {
  const query = useQuery<NotificationsResponse, Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient<NotificationsResponse>('/notifications');
      return response;
    },
    staleTime: 5000,
    refetchInterval: 8000,
  });

  const prevDataRef = useRef<NotificationsResponse | undefined>(undefined);

  useEffect(() => {
    const items = query.data?.notifications?.data;
    if (!items || !Array.isArray(items)) return;

    if (!initialLoadComplete) {
      items.forEach((item) => {
        if (item?.id) seenNotificationIds.add(item.id);
      });
      initialLoadComplete = true;
      prevDataRef.current = query.data;
      return;
    }

    items.forEach((item) => {
      if (!item?.id || seenNotificationIds.has(item.id)) return;
      seenNotificationIds.add(item.id);

      if (item.read_at === null) {
        const { title, message, parsedData } = formatLocalizedNotification(item);
        triggerSystemNotification(title, message, parsedData || {}, `notif:${item.id}`);
      }
    });

    prevDataRef.current = query.data;
  }, [query.data]);

  return query;
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
