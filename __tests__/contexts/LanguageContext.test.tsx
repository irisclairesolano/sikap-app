import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { render, act } from '@testing-library/react-native';
import {
  LanguageProvider,
  useLanguage,
  getLanguageStorageKey,
  STORAGE_KEY,
} from '../../src/contexts/LanguageContext';
import { notifyAuthChanged } from '../../src/store/authEvents';
import * as storage from '../../src/utils/storage';

const mockStore = new Map<string, string>();

jest.mock('../../src/utils/storage', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  getItemSync: jest.fn((key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

const TestConsumer: React.FC<{ onReady?: (api: ReturnType<typeof useLanguage>) => void }> = ({
  onReady,
}) => {
  const api = useLanguage();
  useEffect(() => {
    onReady?.(api);
  }, [api, onReady]);

  return (
    <View>
      <Text testID="active-lang">{api.language}</Text>
      <Text testID="sample-translation">{api.t('my_profile')}</Text>
    </View>
  );
};

describe('LanguageContext cross-account isolation and persistence', () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it('persists app-wide language preference under STORAGE_KEY across auth changes', async () => {
    // 1. Account A (id: 101) is logged in
    mockStore.set('auth_token', 'token-101');
    mockStore.set('user_profile', JSON.stringify({ id: 101, name: 'Juan Worker' }));

    let latestApi: ReturnType<typeof useLanguage> | null = null;
    const { getByTestId } = await render(
      <LanguageProvider>
        <TestConsumer
          onReady={(api) => {
            latestApi = api;
          }}
        />
      </LanguageProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByTestId('active-lang').props.children).toBe('en');

    // 2. User switches to Filipino ('tl')
    await act(async () => {
      await latestApi!.setLanguage('tl');
    });

    expect(getByTestId('active-lang').props.children).toBe('tl');
    expect(getByTestId('sample-translation').props.children).toBe('Profile Ko');
    expect(mockStore.get(STORAGE_KEY)).toBe('tl');
    expect(getLanguageStorageKey(101)).toBe(STORAGE_KEY);

    // 3. Language preference persists across logout and login
    await act(async () => {
      await storage.deleteItemAsync('auth_token');
      await storage.deleteItemAsync('user_profile');
      notifyAuthChanged();
      await Promise.resolve();
    });

    expect(getByTestId('active-lang').props.children).toBe('tl');
    expect(getByTestId('sample-translation').props.children).toBe('Profile Ko');

    // 4. Switching back to English updates STORAGE_KEY
    await act(async () => {
      await latestApi!.setLanguage('en');
    });

    expect(getByTestId('active-lang').props.children).toBe('en');
    expect(getByTestId('sample-translation').props.children).toBe('My Profile');
    expect(mockStore.get(STORAGE_KEY)).toBe('en');
  });
});
