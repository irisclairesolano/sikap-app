import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { Message } from '../types';

export function useMessages(conversationId: number) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      messagesApi.getMessages(conversationId, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    refetchInterval: 8_000,
    staleTime: 4_000,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Flat sorted list for display (oldest first)
      messages: data.pages
        .flatMap((p) => p.data)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }),
  });
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => messagesApi.sendMessage(conversationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendImage(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUri: string) => messagesApi.sendImage(conversationId, imageUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkRead(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => messagesApi.markRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'unread-count'] });
    },
  });
}
