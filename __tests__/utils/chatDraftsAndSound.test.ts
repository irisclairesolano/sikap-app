import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveDraft,
  getDraft,
  loadDraft,
  clearDraft,
  initDrafts,
  subscribeToDrafts,
  _resetDraftsForTesting,
} from '../../src/utils/chatDrafts';
import {
  playMessageSentSound,
  playMessageReceivedSound,
  playMessageFeedback,
} from '../../src/utils/sound';

const mockStorageMap = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(
    async (key: string) => (mockStorageMap ? mockStorageMap.get(key) : null) ?? null,
  ),
  setItem: jest.fn(async (key: string, value: string) => {
    mockStorageMap?.set(key, value);
  }),
  removeItem: jest.fn(async (key: string) => {
    mockStorageMap?.delete(key);
  }),
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    seekTo: jest.fn(async () => {}),
  })),
}));

describe('Chat Drafts and Sound Utilities', () => {
  beforeEach(async () => {
    mockStorageMap.clear();
    _resetDraftsForTesting();
    jest.clearAllMocks();
  });

  describe('Chat Drafts Utility', () => {
    it('saves a draft for a conversation and retrieves it synchronously and asynchronously', async () => {
      await saveDraft(42, 'Hello, I will be there at 2pm.');

      expect(getDraft(42)).toBe('Hello, I will be there at 2pm.');
      const loaded = await loadDraft(42);
      expect(loaded).toBe('Hello, I will be there at 2pm.');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'chat_message_drafts_v1',
        expect.stringContaining('Hello, I will be there at 2pm.'),
      );
    });

    it('clears a draft when empty text or whitespace is saved', async () => {
      await saveDraft(42, 'Temporary draft');
      expect(getDraft(42)).toBe('Temporary draft');

      await saveDraft(42, '   ');
      expect(getDraft(42)).toBe('');
    });

    it('clears draft explicitly using clearDraft', async () => {
      await saveDraft(105, 'Working on the offer');
      expect(getDraft(105)).toBe('Working on the offer');

      await clearDraft(105);
      expect(getDraft(105)).toBe('');
    });

    it('notifies subscribers when a draft is saved or cleared', async () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToDrafts(listener);

      await saveDraft(201, 'Testing subscriber notification');
      expect(listener).toHaveBeenCalled();

      await clearDraft(201);
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
      await saveDraft(201, 'After unsubscribe');
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('hydrates initial drafts from AsyncStorage', async () => {
      mockStorageMap.set(
        'chat_message_drafts_v1',
        JSON.stringify({
          '999': 'Restored from storage',
        }),
      );

      await initDrafts();
      expect(getDraft(999)).toBe('Restored from storage');
    });
  });

  describe('Sound Utility', () => {
    it('executes playMessageSentSound without throwing', async () => {
      await expect(playMessageSentSound()).resolves.not.toThrow();
    });

    it('executes playMessageReceivedSound without throwing', async () => {
      await expect(playMessageReceivedSound()).resolves.not.toThrow();
    });

    it('executes playMessageFeedback for both sent and received without throwing', async () => {
      await expect(playMessageFeedback('sent')).resolves.not.toThrow();
      await expect(playMessageFeedback('received')).resolves.not.toThrow();
    });
  });
});
