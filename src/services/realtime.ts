/**
 * ============================================================================
 * MODULE: Real-Time WebSocket Service (src/services/realtime.ts)
 * ============================================================================
 *
 * (a) Screen / Module Role in the SIKAP Mobile App:
 *     Provides singleton Pusher WebSocket connection management and React hooks
 *     for real-time bidirectional event handling across chat conversations,
 *     hiring workflow action cards, live identity verification approvals, and
 *     in-app notifications.
 *
 * (b) Key State & Hooks Used:
 *     - `getPusherClient()`: Lazily initializes and memoizes a single Pusher
 *       client instance authenticated via Bearer JWT against Laravel's
 *       `/api/v1/broadcasting/auth` endpoint.
 *     - `useRealtimeChat({ conversationId, currentUserId, onTyping })`:
 *       Subscribes to `private-conversation.{conversationId}` while a user is
 *       actively viewing `ChatScreen`.
 *     - `useRealtimeUserEvents(userId)`: Subscribes to `private-user.{userId}`
 *       at the root navigator level for global background updates.
 *
 * (c) UI <-> React Query <-> Pusher WebSockets <-> Laravel REST API Data Flow:
 *     1. Channel Authorization: When subscribing to a `private-*` channel,
 *        Pusher invokes the custom `authorizer`, which reads `auth_token` from
 *        SecureStore and sends `POST /api/v1/broadcasting/auth` to Laravel.
 *     2. Direct Cache Hydration (`setQueryData`): Incoming `message.sent`
 *        events immediately merge the new message or ActionCard into React
 *        Query's paginated `['messages', conversationId]` cache—reconciling
 *        optimistic UI messages (`id < 0`) in-place without waiting for a
 *        full HTTP refetch.
 *     3. Cache Invalidation (`invalidateQueries`): Events that affect aggregate
 *        counts or status badges (`messages.read`, `conversation.updated`,
 *        `notification.sent`, `user.verification.updated`) invalidate their
 *        respective query keys and sync critical profile flags to SecureStore.
 * ============================================================================
 */
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

/**
 * Returns the singleton Pusher WebSocket client.
 * Configures private channel authorization using the user's Sanctum Bearer token
 * against the Laravel Broadcasting authentication endpoint (`/broadcasting/auth`).
 */
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

export function disconnectPusher(): void {
  if (pusherInstance) {
    try {
      pusherInstance.disconnect();
    } catch {
      // ignore
    }
    pusherInstance = null;
  }
}

export function getPusherSocketId(): string | undefined {
  return pusherInstance?.connection?.socket_id;
}

export interface UseRealtimeChatOptions {
  conversationId: number;
  currentUserId?: number;
  onTyping?: (userName: string) => void;
}

/**
 * Conversation-scoped real-time hook used inside `ChatScreen`.
 * Listens on `private-conversation.{conversationId}` for:
 *  - New chat messages and interactive hiring ActionCards (`message.sent`)
 *  - Read receipts (`messages.read`)
 *  - Partner typing indicators (`user.typing`)
 *  - Conversation lock/unlock state transitions (`conversation.updated`)
 */
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
    const handleIncomingMessage = (data: any) => {
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

      // Immediately write into query cache across pages
      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [{ data: [incomingMessage], next_cursor: null }],
          };
        }

        let found = false;
        const newPages = old.pages.map((page: any) => {
          const pageData: Message[] = page.data || [];
          if (pageData.some((m) => m.id === incomingMessage.id)) {
            found = true;
            return {
              ...page,
              data: pageData.map((m) => (m.id === incomingMessage.id ? incomingMessage : m)),
            };
          }
          return page;
        });

        if (found) {
          return { ...old, pages: newPages };
        }

        // Check if this replaces an optimistic message from current user on the last page
        const lastPageIndex = newPages.length - 1;
        const lastPage = newPages[lastPageIndex];
        const existingData: Message[] = lastPage.data || [];

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

        return { ...old, pages: newPages };
      });

      // Invalidate conversation details, list preview, and unread counts
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'unread-count'] });
    };

    channel.bind('message.sent', handleIncomingMessage);
    channel.bind('.message.sent', handleIncomingMessage);
    channel.bind('App\\Events\\MessageSent', handleIncomingMessage);

    // 2. Listen for read receipts
    const handleMessagesRead = (data: any) => {
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

      queryClient.invalidateQueries({ queryKey: ['conversations', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    channel.bind('messages.read', handleMessagesRead);
    channel.bind('.messages.read', handleMessagesRead);
    channel.bind('App\\Events\\MessagesRead', handleMessagesRead);

    // 3. Listen for typing events
    const handleUserTyping = (data: any) => {
      if (!data || data.user_id === currentUserId) return;
      if (onTyping) {
        onTyping(data.user_name || 'Someone');
      }
    };

    channel.bind('user.typing', handleUserTyping);
    channel.bind('.user.typing', handleUserTyping);
    channel.bind('App\\Events\\UserTyping', handleUserTyping);

    // 4. Listen for conversation updates (status changed: locked, open, unlock_requested)
    const handleConversationUpdate = (data: any) => {
      if (!data || data.id !== conversationId) return;

      queryClient.setQueryData(['conversation', conversationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: data.status ?? old.status,
          last_message_at: data.last_message_at ?? old.last_message_at,
          last_message_preview: data.last_message_preview ?? old.last_message_preview,
        };
      });

      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    channel.bind('conversation.updated', handleConversationUpdate);
    channel.bind('.conversation.updated', handleConversationUpdate);
    channel.bind('App\\Events\\ConversationUpdated', handleConversationUpdate);

    // 5. On socket reconnection, refresh active conversation messages
    const handleStateChange = (states: { previous: string; current: string }) => {
      if (states.current === 'connected' && states.previous !== 'connecting') {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      }
    };

    pusher.connection.bind('state_change', handleStateChange);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.connection.unbind('state_change', handleStateChange);
    };
  }, [conversationId, currentUserId, onTyping, queryClient]);
}

/**
 * Global user-scoped real-time hook mounted in `RootNavigator`.
 * Subscribes to `private-user.{userId}` so the mobile client receives live
 * events regardless of which screen is currently active:
 *  - Reputation & employer stat recalculations (`user.stats.updated`)
 *  - Admin KYC / Government ID verification approvals (`user.verification.updated`)
 *  - Background chat message alerts & unread badge increments (`message.sent`)
 *  - System / hiring stage notifications (`notification.sent`)
 */
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
      // An admin decision (approve / reject / correction) supersedes the
      // post-upload stale-response guard.
      if (data.registration_status && data.registration_status !== 'pending_review') {
        const { clearIdSubmitted } = await import('../store/authEvents');
        clearIdSubmitted();
      }
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

    // 3. Handle Real-Time Incoming Message for any conversation
    const handleUserMessage = (data: any) => {
      if (!data) return;

      // Invalidate conversations list and unread count
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'unread-count'] });
      if (data.conversation_id) {
        queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
      }

      // If incoming from another user, provide a light haptic pulse + system/in-app notification
      if (data.sender_id && data.sender_id !== userId) {
        triggerHaptic('light');
        try {
          const { triggerSystemNotification } = require('../hooks/usePushNotifications');
          const {
            getActiveLanguage,
            translateForLanguage,
          } = require('../contexts/LanguageContext');
          const lang = getActiveLanguage();
          const senderName = data.sender_name || data.sender?.name || 'SIKAP';
          const imageFallback = translateForLanguage(lang, 'notif_new_message_image_preview');
          const preview =
            data.message || data.body || (data.image_url ? imageFallback : imageFallback);
          const localizedTitle = translateForLanguage(lang, 'notif_new_message_title', {
            senderName,
          });
          const localizedBody = translateForLanguage(lang, 'notif_new_message_msg', {
            preview: String(preview),
          });
          triggerSystemNotification(
            localizedTitle,
            localizedBody,
            { conversation_id: data.conversation_id, type: 'chat_message' },
            `msg:${data.id || `${data.conversation_id}:${data.created_at}`}`,
          );
        } catch (_) {}
      }
    };

    channel.bind('message.sent', handleUserMessage);
    channel.bind('.message.sent', handleUserMessage);
    channel.bind('App\\Events\\MessageSent', handleUserMessage);

    // 4. Handle Read Receipts
    const handleUserMessagesRead = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    channel.bind('messages.read', handleUserMessagesRead);
    channel.bind('.messages.read', handleUserMessagesRead);
    channel.bind('App\\Events\\MessagesRead', handleUserMessagesRead);

    // 5. Handle Conversation Updates (Status Changes)
    const handleUserConversationUpdate = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
      }
    };

    channel.bind('conversation.updated', handleUserConversationUpdate);
    channel.bind('.conversation.updated', handleUserConversationUpdate);
    channel.bind('App\\Events\\ConversationUpdated', handleUserConversationUpdate);

    // 6. Handle Real-Time In-App Notifications
    const handleNotificationSent = (data: any) => {
      if (!data) return;
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      triggerHaptic('light');

      try {
        const { triggerSystemNotification } = require('../hooks/usePushNotifications');
        const { formatLocalizedNotification } = require('../utils/notificationFormatter');
        const notif = data.notification || data;
        const { title, message, parsedData } = formatLocalizedNotification(notif);
        const notifId = notif?.id || `${title}:${message}:${Date.now()}`;
        triggerSystemNotification(title, message, parsedData || {}, `notif:${notifId}`);
      } catch (_) {}
    };

    channel.bind('notification.sent', handleNotificationSent);
    channel.bind('.notification.sent', handleNotificationSent);
    channel.bind('App\\Events\\NotificationSent', handleNotificationSent);

    // 7. Handle Notification Read Receipts
    const handleNotificationRead = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };

    channel.bind('notification.read', handleNotificationRead);
    channel.bind('.notification.read', handleNotificationRead);
    channel.bind('App\\Events\\NotificationRead', handleNotificationRead);

    // 8. On socket reconnection, refresh conversations, unread count, and notifications
    const handleUserStateChange = (states: { previous: string; current: string }) => {
      if (states.current === 'connected' && states.previous !== 'connecting') {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['conversations', 'unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      }
    };

    pusher.connection.bind('state_change', handleUserStateChange);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.connection.unbind('state_change', handleUserStateChange);
    };
  }, [userId, queryClient]);
}
