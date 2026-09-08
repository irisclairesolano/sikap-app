import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { Conversation } from '../types';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations().then((res) => res.data),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ['conversations', 'unread-count'],
    queryFn: () => messagesApi.getUnreadCount().then((res) => res.unread_count),
    refetchInterval: 10_000,
    staleTime: 5_000,
    select: (count) => count ?? 0,
  });
}

export function useUnlockConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => messagesApi.unlockConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useRequestUnlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => messagesApi.requestUnlock(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
