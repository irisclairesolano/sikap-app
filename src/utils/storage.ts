import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In-memory mirror so auth_token and user_profile are immediately readable
// without a 1-frame async gap between loginMutation and RootNavigator re-render.
const memoryStore = new Map<string, string>();

// Android Keystore / expo-secure-store has a strict 2048-byte limit.
// Dual-account profiles with skills, experiences, and reviews exceed 2048 bytes.
const SECURE_STORE_MAX_BYTES = 1800;

export const getItemSync = (key: string): string | null => {
  return memoryStore.get(key) ?? null;
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  memoryStore.set(key, value);

  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Local storage error', e);
    }
    return;
  }

  // Always use AsyncStorage for user_profile or payloads approaching SecureStore's 2048B limit
  if (key === 'user_profile' || value.length > SECURE_STORE_MAX_BYTES) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('AsyncStorage set error:', e);
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.warn('SecureStore set error, falling back to AsyncStorage:', e);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (_) {}
  }
};

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) memoryStore.set(key, val);
      return val;
    } catch (e) {
      console.error('Local storage error', e);
      return null;
    }
  }

  if (key === 'user_profile') {
    try {
      const asyncVal = await AsyncStorage.getItem(key);
      if (asyncVal !== null) {
        memoryStore.set(key, asyncVal);
        return asyncVal;
      }
    } catch (_) {}
  }

  try {
    const val = await SecureStore.getItemAsync(key);
    if (val !== null) {
      memoryStore.set(key, val);
      return val;
    }
  } catch (e) {
    console.warn('SecureStore get error:', e);
  }

  try {
    const fallbackVal = await AsyncStorage.getItem(key);
    if (fallbackVal !== null) {
      memoryStore.set(key, fallbackVal);
      return fallbackVal;
    }
  } catch (_) {}

  return null;
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  memoryStore.delete(key);

  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Local storage error', e);
    }
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.warn('SecureStore delete error:', e);
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch (_) {}
};
