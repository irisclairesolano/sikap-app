import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { triggerSystemNotification } from './usePushNotifications';
import { getActiveLanguage, translateForLanguage } from '../contexts/LanguageContext';
import { getActiveChatConversationId } from '../utils/activeChatTracker';
import { triggerHaptic } from '../utils/haptics';
import { subscribeAuthChanged } from '../store/authEvents';

const seenMessageIds = new Set<number>();
let initialLoadComplete = false;

subscribeAuthChanged(() => {
  seenMessageIds.clear();
  initialLoadComplete = false;
});

export function useConversations(role?: 'worker' | 'employer' | 'all' | string) {
  return useQuery({
    queryKey: ['conversations', role ?? 'default'],
    queryFn: () => messagesApi.getConversations(role).then((res) => res.data),
    staleTime: 1000 * 10, // 10 seconds
  });
}

export function useUnreadMessageCount(role?: 'worker' | 'employer' | 'all' | string) {
  const query = useQuery({
    queryKey: ['conversations', 'unread-count', role ?? 'default'],
    queryFn: () => messagesApi.getUnreadCount(role),
    staleTime: 3000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const latest = query.data?.latest_message;
    if (!latest || !latest.id) return;

    if (!initialLoadComplete) {
      seenMessageIds.add(latest.id);
      initialLoadComplete = true;
      return;
    }

    if (seenMessageIds.has(latest.id)) return;
    seenMessageIds.add(latest.id);

    // If user is currently looking at this exact chat in ChatScreen, don't show toast
    if (getActiveChatConversationId() === latest.conversation_id) return;

    triggerHaptic('light');

    const lang = getActiveLanguage();
    const senderName = latest.sender_name || 'SIKAP';
    const imageFallback = translateForLanguage(lang, 'notif_new_message_image_preview');
    let preview = latest.body;
    if (!preview) {
      preview = latest.image_url ? imageFallback : 'New message';
    }

    const localizedTitle = translateForLanguage(lang, 'notif_new_message_title', { senderName });
    const localizedBody = translateForLanguage(lang, 'notif_new_message_msg', {
      preview: String(preview),
    });

    triggerSystemNotification(
      localizedTitle,
      localizedBody,
      { conversation_id: latest.conversation_id, type: 'chat_message' },
      `msg:${latest.id || `${latest.conversation_id}:${latest.created_at}`}`,
    );
  }, [query.data]);

  return {
    ...query,
    data: query.data?.unread_count ?? 0,
  };
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
