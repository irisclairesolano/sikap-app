import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { Message } from '../types';

export function useMessages(conversationId: number, options?: { pollingInterval?: number }) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      messagesApi.getMessages(conversationId, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: Boolean(conversationId && conversationId > 0),
    staleTime: 1000 * 30,
    refetchInterval: options?.pollingInterval ?? 3000,
    refetchIntervalInBackground: false,
    select: (data) => {
      const allMessages = data.pages.flatMap((p) => p.data);
      const uniqueMap = new Map<number, Message>();
      for (const m of allMessages) {
        if (m && m.id != null) {
          uniqueMap.set(m.id, m);
        }
      }
      const sorted = Array.from(uniqueMap.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      return {
        pages: data.pages,
        pageParams: data.pageParams,
        messages: sorted,
      };
    },
  });
}

export function useSendMessage(conversationId: number, onErrorCallback?: (error: Error) => void) {
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

      const tempId = -Date.now();
      const optimisticMessage: Message = {
        id: tempId,
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

      return { previousMessages, tempId };
    },
    onSuccess: (savedMessage: Message, _newBody, context) => {
      // Reconcile optimistic message directly with the server response
      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old || !old.pages) return old;
        const newPages = old.pages.map((page: any) => {
          const pageData: Message[] = page.data || [];
          return {
            ...page,
            data: pageData.map((m) =>
              m.id === context?.tempId || (m.id < 0 && m.body === savedMessage.body)
                ? savedMessage
                : m,
            ),
          };
        });
        return { ...old, pages: newPages };
      });

      // Update conversations list preview seamlessly
      queryClient.setQueryData(['conversations'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                last_message_at: savedMessage.created_at,
                last_message_preview: savedMessage.body?.slice(0, 100) || '',
              }
            : c,
        );
      });
    },
    onError: (err: any, _newBody, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
      onErrorCallback?.(err);
    },
  });
}

export function useSendImage(conversationId: number, onErrorCallback?: (error: Error) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUri: string) => messagesApi.sendImage(conversationId, imageUri),
    onMutate: async (imageUri: string) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      const previousMessages = queryClient.getQueryData(['messages', conversationId]);
      const currentUser = queryClient.getQueryData<any>(['profile']);

      const tempId = -Date.now();
      const optimisticMessage: Message = {
        id: tempId,
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

      return { previousMessages, tempId };
    },
    onSuccess: (savedMessage: Message, _imageUri, context) => {
      // Reconcile optimistic image message directly with the server response
      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old || !old.pages) return old;
        const newPages = old.pages.map((page: any) => {
          const pageData: Message[] = page.data || [];
          return {
            ...page,
            data: pageData.map((m) =>
              m.id === context?.tempId || (m.id < 0 && m.message_type === 'image')
                ? savedMessage
                : m,
            ),
          };
        });
        return { ...old, pages: newPages };
      });

      queryClient.setQueryData(['conversations'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                last_message_at: savedMessage.created_at,
                last_message_preview: '📷 Image',
              }
            : c,
        );
      });
    },
    onError: (err: any, _imageUri, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
      onErrorCallback?.(err);
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
