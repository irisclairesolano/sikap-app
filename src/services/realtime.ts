import Pusher from 'pusher-js';
import { useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '../api/client';
import { Message } from '../types';
import { triggerHaptic } from '../utils/haptics';
import * as SecureStore from '../utils/storage';

const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY || 'sikap-pusher-key';
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'ap1';
const PUSHER_HOST = process.env.EXPO_PUBLIC_PUSHER_HOST;
const PUSHER_PORT = process.env.EXPO_PUBLIC_PUSHER_PORT
  ? parseInt(process.env.EXPO_PUBLIC_PUSHER_PORT, 10)
  : undefined;

let pusherInstance: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (!PUSHER_KEY) return null;
  if (!pusherInstance) {
    try {
      pusherInstance = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        wsHost: PUSHER_HOST,
        wsPort: PUSHER_PORT,
        wssPort: PUSHER_PORT,
        forceTLS: !PUSHER_PORT || PUSHER_PORT === 443,
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel) => ({
          authorize: async (socketId, callback) => {
            try {
              const token = await SecureStore.getItemAsync('auth_token');
              const res = await fetch(`${BASE_URL}/broadcasting/auth`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              });
              if (!res.ok) {
                callback(new Error(`Auth failed with status ${res.status}`), null);
                return;
              }
              const data = await res.json();
              callback(null, data);
            } catch (err: any) {
              callback(err, null);
            }
          },
        }),
      });
    } catch {
      pusherInstance = null;
    }
  }
  return pusherInstance;
}

export interface UseRealtimeChatOptions {
  conversationId: number;
  currentUserId?: number;
  onTyping?: (userName: string) => void;
}

export function useRealtimeChat({
  conversationId,
  currentUserId,
  onTyping,
}: UseRealtimeChatOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId || conversationId <= 0) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `private-conversation.${conversationId}`;
    const channel = pusher.subscribe(channelName);

    // 1. Listen for new incoming messages / cards
    channel.bind('message.sent', (data: any) => {
      if (!data || !data.id) return;

      const incomingMessage: Message = {
        id: data.id,
        conversation_id: data.conversation_id,
        sender_id: data.sender_id,
        body: data.body,
        image_url: data.image_url,
        message_type: data.message_type,
        card_type: data.card_type,
        card_data: data.card_data,
        card_resolved: Boolean(data.card_resolved),
        created_at: data.created_at || new Date().toISOString(),
        read_at: data.read_at || null,
        sender: data.sender || null,
      };

      // Vibrate if incoming from other user
      if (incomingMessage.sender_id && incomingMessage.sender_id !== currentUserId) {
        triggerHaptic('light');
      }

      // Immediately write into query cache
      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [{ data: [incomingMessage], next_cursor: null }],
          };
        }

        const newPages = [...old.pages];
        const lastPageIndex = newPages.length - 1;
        const lastPage = newPages[lastPageIndex];
        const existingData: Message[] = lastPage.data || [];

        // Check if message is already in cache (either exact ID or replacing an optimistic pending message)
        const alreadyExists = existingData.some((m) => m.id === incomingMessage.id);
        if (alreadyExists) {
          newPages[lastPageIndex] = {
            ...lastPage,
            data: existingData.map((m) => (m.id === incomingMessage.id ? incomingMessage : m)),
          };
        } else {
          // Check if this replaces an optimistic message from current user
          const pendingIdx = existingData.findIndex(
            (m) =>
              m.id < 0 &&
              m.sender_id === incomingMessage.sender_id &&
              (m.body === incomingMessage.body || m.message_type === incomingMessage.message_type),
          );

          if (pendingIdx !== -1) {
            const updated = [...existingData];
            updated[pendingIdx] = incomingMessage;
            newPages[lastPageIndex] = { ...lastPage, data: updated };
          } else {
            newPages[lastPageIndex] = {
              ...lastPage,
              data: [...existingData, incomingMessage],
            };
          }
        }

        return { ...old, pages: newPages };
      });

      // Invalidate conversation details (for locked status) and list preview
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    // 2. Listen for read receipts
    channel.bind('messages.read', (data: any) => {
      if (!data) return;

      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old || !old.pages) return old;

        const newPages = old.pages.map((page: any) => ({
          ...page,
          data: (page.data || []).map((m: Message) =>
            m.sender_id === currentUserId && !m.read_at
              ? { ...m, read_at: data.read_at || new Date().toISOString() }
              : m,
          ),
        }));

        return { ...old, pages: newPages };
      });
    });

    // 3. Listen for typing events
    channel.bind('user.typing', (data: any) => {
      if (!data || data.user_id === currentUserId) return;
      if (onTyping) {
        onTyping(data.user_name || 'Someone');
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [conversationId, currentUserId, onTyping, queryClient]);
}

export function useRealtimeUserEvents(userId?: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || userId <= 0) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `private-user.${userId}`;
    const channel = pusher.subscribe(channelName);

    // 1. Handle Real-Time User Stats Update
    const handleStatsUpdate = async (data: any) => {
      if (data?.stats) {
        queryClient.setQueryData(['employer-stats'], (old: any) => ({
          ...(old || {}),
          ...data.stats,
        }));
        queryClient.setQueryData(['profile'], (old: any) => {
          if (!old) return old;
          const updated = {
            ...old,
            reputation_score:
              data.stats.reputation_score !== undefined
                ? data.stats.reputation_score
                : old.reputation_score,
            ratings_count:
              data.stats.ratings_count !== undefined ? data.stats.ratings_count : old.ratings_count,
            employer_stats: {
              ...(old.employer_stats || {}),
              ...data.stats,
            },
          };
          SecureStore.setItemAsync('user_profile', JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['employer-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['reviews'] }),
      ]);
    };

    channel.bind('user.stats.updated', handleStatsUpdate);
    channel.bind('.user.stats.updated', handleStatsUpdate);
    channel.bind('App\\Events\\UserStatsUpdated', handleStatsUpdate);

    // 2. Handle Real-Time Verification Status Update (e.g., Admin Approval)
    const handleVerificationUpdate = async (data: any) => {
      if (!data) return;
      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) return old;
        const updated = {
          ...old,
          registration_status: data.registration_status ?? old.registration_status,
          verification_status: data.verification_status ?? old.verification_status,
          verification_badge:
            data.verification_badge !== undefined
              ? Boolean(data.verification_badge)
              : old.verification_badge,
          rejection_reason:
            data.rejection_reason !== undefined ? data.rejection_reason : old.rejection_reason,
        };
        SecureStore.setItemAsync('user_profile', JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      const { notifyAuthChanged } = await import('../store/authEvents');
      notifyAuthChanged();
    };

    channel.bind('user.verification.updated', handleVerificationUpdate);
    channel.bind('.user.verification.updated', handleVerificationUpdate);
    channel.bind('App\\Events\\UserVerificationUpdated', handleVerificationUpdate);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [userId, queryClient]);
}
