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
    refetchInterval: 3_000,
    staleTime: 1_000,
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
    onMutate: async (newBody: string) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['messages', conversationId]);

      // Get current logged-in user profile from query cache
      const currentUser = queryClient.getQueryData<any>(['profile']);

      const optimisticMessage: Message = {
        id: -Date.now(),
        conversation_id: conversationId,
        sender_id: currentUser?.id ?? null,
        body: newBody,
        image_url: null,
        message_type: 'text',
        card_resolved: false,
        created_at: new Date().toISOString(),
        sender: currentUser
          ? {
              id: currentUser.id,
              name: currentUser.name || 'You',
              avatar_url: currentUser.avatar_url,
            }
          : null,
      };

      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [
              {
                data: [optimisticMessage],
                next_cursor: null,
              },
            ],
          };
        }

        const newPages = [...old.pages];
        const lastPageIndex = newPages.length - 1;
        const lastPage = newPages[lastPageIndex];

        newPages[lastPageIndex] = {
          ...lastPage,
          data: [...(lastPage.data || []), optimisticMessage],
        };

        return {
          ...old,
          pages: newPages,
        };
      });

      return { previousMessages };
    },
    onError: (_err, _newBody, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendImage(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUri: string) => messagesApi.sendImage(conversationId, imageUri),
    onMutate: async (imageUri: string) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      const previousMessages = queryClient.getQueryData(['messages', conversationId]);
      const currentUser = queryClient.getQueryData<any>(['profile']);

      const optimisticMessage: Message = {
        id: -Date.now(),
        conversation_id: conversationId,
        sender_id: currentUser?.id ?? null,
        body: null,
        image_url: imageUri,
        message_type: 'image',
        card_resolved: false,
        created_at: new Date().toISOString(),
        sender: currentUser
          ? {
              id: currentUser.id,
              name: currentUser.name || 'You',
              avatar_url: currentUser.avatar_url,
            }
          : null,
      };

      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [
              {
                data: [optimisticMessage],
                next_cursor: null,
              },
            ],
          };
        }

        const newPages = [...old.pages];
        const lastPageIndex = newPages.length - 1;
        const lastPage = newPages[lastPageIndex];

        newPages[lastPageIndex] = {
          ...lastPage,
          data: [...(lastPage.data || []), optimisticMessage],
        };

        return {
          ...old,
          pages: newPages,
        };
      });

      return { previousMessages };
    },
    onError: (_err, _imageUri, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
    },
    onSettled: () => {
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
