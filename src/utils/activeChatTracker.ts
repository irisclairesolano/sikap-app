/**
 * Tracks the conversation ID the user is currently viewing in ChatScreen.
 * Used by push notification and polling hooks to avoid displaying duplicate
 * in-app toast banners while the user is actively reading the conversation.
 */
let activeChatConversationId: number | null = null;

export const setActiveChatConversationId = (id: number | null): void => {
  activeChatConversationId = id;
};

export const getActiveChatConversationId = (): number | null => {
  return activeChatConversationId;
};
