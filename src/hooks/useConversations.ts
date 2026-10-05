import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { Conversation } from '../types';

export function useConversations(role?: 'worker' | 'employer' | 'all' | string) {
  return useQuery({
    queryKey: ['conversations', role ?? 'default'],
    queryFn: () => messagesApi.getConversations(role).then((res) => res.data),
    refetchInterval: 3_000,
    staleTime: 1_000,
  });
}

export function useUnreadMessageCount(role?: 'worker' | 'employer' | 'all' | string) {
  return useQuery({
    queryKey: ['conversations', 'unread-count', role ?? 'default'],
    queryFn: () => messagesApi.getUnreadCount(role).then((res) => res.unread_count),
    refetchInterval: 3_000,
    staleTime: 1_000,
    select: (count) => count ?? 0,
  });
}

export function useUnlockConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => messagesApi.unlockConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}

export function useRequestUnlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => messagesApi.requestUnlock(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}

export function useConversation(conversationId: number) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => messagesApi.getConversation(conversationId),
    refetchInterval: 1_500,
    staleTime: 500,
  });
}
