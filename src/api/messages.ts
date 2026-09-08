import { apiClient } from './client';
import { Conversation, Message, PaginatedMessages } from '../types';

export const messagesApi = {
  /**
   * Get all conversations for the current user.
   */
  getConversations: () => apiClient<{ data: Conversation[] }>('/conversations'),

  /**
   * Get a single conversation details.
   */
  getConversation: (conversationId: number) =>
    apiClient<Conversation>(`/conversations/${conversationId}`),

  /**
   * Get messages in a conversation (cursor-paginated).
   */
  getMessages: (conversationId: number, cursor?: string) =>
    apiClient<PaginatedMessages>(
      `/conversations/${conversationId}/messages${cursor ? `?cursor=${cursor}` : ''}`,
    ),

  /**
   * Send a text message.
   */
  sendMessage: (conversationId: number, body: string) =>
    apiClient<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    }),

  /**
   * Send an image message (multipart form).
   */
  sendImage: async (conversationId: number, imageUri: string): Promise<Message> => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() ?? 'image.jpg';
    const match = /\.([a-zA-Z]+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
    // @ts-expect-error – React Native FormData accepts this object shape
    formData.append('image', { uri: imageUri, name: filename, type });
    return apiClient<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Mark all messages in a conversation as read.
   */
  markRead: (conversationId: number) =>
    apiClient<{ message: string }>(`/conversations/${conversationId}/read`, {
      method: 'PATCH',
    }),

  /**
   * Get total unread message count across all conversations.
   */
  getUnreadCount: () => apiClient<{ unread_count: number }>('/conversations/unread-count'),

  /**
   * Employer unlocks a locked conversation.
   */
  unlockConversation: (conversationId: number) =>
    apiClient<{ message: string }>(`/conversations/${conversationId}/unlock`, {
      method: 'PATCH',
    }),

  /**
   * Worker requests to reopen a locked conversation.
   */
  requestUnlock: (conversationId: number) =>
    apiClient<{ message: string }>(`/conversations/${conversationId}/request-unlock`, {
      method: 'PATCH',
    }),
};
