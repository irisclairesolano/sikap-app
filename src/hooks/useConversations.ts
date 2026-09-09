import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { Conversation } from '../types';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations().then((res) => res.data),
    refetchInterval: 5_000,
    staleTime: 2_500,
  });
}

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ['conversations', 'unread-count'],
    queryFn: () => messagesApi.getUnreadCount().then((res) => res.unread_count),
    refetchInterval: 5_000,
    staleTime: 2_500,
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
