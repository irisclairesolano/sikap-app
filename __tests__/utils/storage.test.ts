import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { deleteItemAsync, getItemAsync, setItemAsync } from '../../src/utils/storage';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('storage utility', () => {
  const originalPlatformOS = Platform.OS;
  let localStorageStore: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: jest.fn((key: string) => localStorageStore[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      localStorageStore[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete localStorageStore[key];
    }),
    clear: jest.fn(() => {
      localStorageStore = {};
    }),
  };

  beforeAll(() => {
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageStore = {};
  });

  afterAll(() => {
    Platform.OS = originalPlatformOS;
  });

  describe('when Platform.OS is web', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('setItemAsync delegates to localStorage.setItem and does not call SecureStore', async () => {
      await setItemAsync('test_key', 'test_value');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test_key', 'test_value');
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('getItemAsync delegates to localStorage.getItem and returns stored value', async () => {
      localStorageStore['test_key'] = 'stored_val';
      const result = await getItemAsync('test_key');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test_key');
      expect(result).toBe('stored_val');
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    });

    it('getItemAsync returns null when key does not exist on web', async () => {
      const result = await getItemAsync('non_existent');
      expect(result).toBeNull();
    });

    it('deleteItemAsync delegates to localStorage.removeItem and does not call SecureStore', async () => {
      localStorageStore['test_key'] = 'stored_val';
      await deleteItemAsync('test_key');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_key');
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('handles localStorage errors gracefully without throwing', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage disabled');
      });

      const result = await getItemAsync('key');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Local storage error', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('when Platform.OS is ios or android', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('setItemAsync delegates to SecureStore.setItemAsync and does not call localStorage', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
      await setItemAsync('secure_key', 'secure_val');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('secure_key', 'secure_val');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('getItemAsync delegates to SecureStore.getItemAsync and returns value', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('secure_retrieved_val');
      const result = await getItemAsync('secure_key');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('secure_key');
      expect(result).toBe('secure_retrieved_val');
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('deleteItemAsync delegates to SecureStore.deleteItemAsync and does not call localStorage', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
      await deleteItemAsync('secure_key');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('secure_key');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});
