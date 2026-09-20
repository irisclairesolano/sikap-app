import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { Conversation } from '../types';

export function useConversations(role?: 'worker' | 'employer' | 'all' | string) {
  return useQuery({
    queryKey: ['conversations', role ?? 'default'],
    queryFn: () => messagesApi.getConversations(role).then((res) => res.data),
    refetchInterval: 5_000,
    staleTime: 2_500,
  });
}

export function useUnreadMessageCount(role?: 'worker' | 'employer' | 'all' | string) {
  return useQuery({
    queryKey: ['conversations', 'unread-count', role ?? 'default'],
    queryFn: () => messagesApi.getUnreadCount(role).then((res) => res.unread_count),
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

export function useConversation(conversationId: number) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => messagesApi.getConversation(conversationId),
    staleTime: 5_000,
  });
}
