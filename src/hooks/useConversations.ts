import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';

export function useConversations(role?: 'worker' | 'employer' | 'all' | string) {
  return useQuery({
    queryKey: ['conversations', role ?? 'default'],
    queryFn: () => messagesApi.getConversations(role).then((res) => res.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUnreadMessageCount(role?: 'worker' | 'employer' | 'all' | string) {
  return useQuery({
    queryKey: ['conversations', 'unread-count', role ?? 'default'],
    queryFn: () => messagesApi.getUnreadCount(role).then((res) => res.unread_count),
    staleTime: 1000 * 60 * 5,
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

export function useDeclineUnlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => messagesApi.declineUnlock(conversationId),
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
    staleTime: 1000 * 60 * 5,
  });
}
