import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const DRAFTS_STORAGE_KEY = 'chat_message_drafts_v1';

// In-memory cache for instant synchronous access across screens
const draftsCache = new Map<number, string>();
let isInitialized = false;
let initPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (_) {}
  });
};

/**
 * Initializes and hydrates the in-memory draft cache from AsyncStorage.
 */
export const initDrafts = async (): Promise<void> => {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const stored = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
      if (stored) {
        const parsed: Record<string, string> = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([convIdStr, draftText]) => {
            const id = Number(convIdStr);
            if (!isNaN(id) && typeof draftText === 'string' && draftText.trim().length > 0) {
              draftsCache.set(id, draftText);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load chat drafts from AsyncStorage:', e);
    } finally {
      isInitialized = true;
      notifyListeners();
    }
  })();

  return initPromise;
};

// Start background hydration immediately
initDrafts().catch(() => {});

/**
 * Persists the current in-memory cache to AsyncStorage.
 */
const persistDrafts = async (): Promise<void> => {
  try {
    const obj: Record<string, string> = {};
    draftsCache.forEach((text, id) => {
      if (text && text.trim().length > 0) {
        obj[String(id)] = text;
      }
    });
    await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn('Failed to persist chat drafts:', e);
  }
};

/**
 * Synchronously retrieves a draft from the in-memory cache.
 */
export const getDraft = (conversationId: number): string => {
  return draftsCache.get(conversationId) || '';
};

/**
 * Asynchronously loads a draft, ensuring storage has been hydrated first.
 */
export const loadDraft = async (conversationId: number): Promise<string> => {
  if (!isInitialized) {
    await initDrafts();
  }
  return draftsCache.get(conversationId) || '';
};

/**
 * Saves a draft for a specific conversation.
 * If text is empty or only whitespace, the draft is cleared.
 */
export const saveDraft = async (conversationId: number, text: string): Promise<void> => {
  if (!conversationId) return;
  const trimmed = (text || '').trim();
  if (trimmed.length === 0) {
    await clearDraft(conversationId);
    return;
  }

  draftsCache.set(conversationId, text);
  notifyListeners();
  await persistDrafts();
};

/**
 * Clears/removes the draft for a specific conversation.
 */
export const clearDraft = async (conversationId: number): Promise<void> => {
  if (!conversationId) return;
  if (draftsCache.has(conversationId)) {
    draftsCache.delete(conversationId);
    notifyListeners();
    await persistDrafts();
  }
};

/**
 * Subscribes a listener to draft cache changes. Returns an unsubscribe function.
 */
export const subscribeToDrafts = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * React hook to observe and update a draft for a conversation.
 */
export const useConversationDraft = (conversationId: number) => {
  const [draft, setDraftState] = useState<string>(() => getDraft(conversationId));

  useEffect(() => {
    // If not initialized yet, ensure storage loads
    if (!isInitialized) {
      loadDraft(conversationId).then((loaded) => {
        setDraftState(loaded);
      });
    }

    const unsubscribe = subscribeToDrafts(() => {
      setDraftState(getDraft(conversationId));
    });

    return unsubscribe;
  }, [conversationId]);

  return {
    draft,
    saveDraft: (text: string) => saveDraft(conversationId, text),
    clearDraft: () => clearDraft(conversationId),
  };
};
