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

  it('scopes language preference per user account and resets to English when switching to an account without saved preference', async () => {
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

    // 2. Account A switches to Filipino ('tl')
    await act(async () => {
      await latestApi!.setLanguage('tl');
    });

    expect(getByTestId('active-lang').props.children).toBe('tl');
    expect(getByTestId('sample-translation').props.children).toBe('Profile Ko');
    expect(mockStore.get(getLanguageStorageKey(101))).toBe('tl');
    expect(mockStore.has(STORAGE_KEY)).toBe(false);

    // 3. Account A logs out
    await act(async () => {
      await storage.deleteItemAsync('auth_token');
      await storage.deleteItemAsync('user_profile');
      notifyAuthChanged();
      await Promise.resolve();
    });

    expect(getByTestId('active-lang').props.children).toBe('en');
    expect(getByTestId('sample-translation').props.children).toBe('My Profile');

    // 4. Account B (id: 202) logs in for the first time (no language preference set)
    await act(async () => {
      await storage.setItemAsync('auth_token', 'token-202');
      await storage.setItemAsync(
        'user_profile',
        JSON.stringify({ id: 202, name: 'Maria Employer' }),
      );
      notifyAuthChanged();
      await Promise.resolve();
    });

    expect(getByTestId('active-lang').props.children).toBe('en');
    expect(getByTestId('sample-translation').props.children).toBe('My Profile');

    // 5. Account B logs out and Account A (id: 101) logs back in -> Filipino ('tl') is restored automatically
    await act(async () => {
      await storage.setItemAsync('auth_token', 'token-101');
      await storage.setItemAsync('user_profile', JSON.stringify({ id: 101, name: 'Juan Worker' }));
      notifyAuthChanged();
      await Promise.resolve();
    });

    expect(getByTestId('active-lang').props.children).toBe('tl');
    expect(getByTestId('sample-translation').props.children).toBe('Profile Ko');
  });
});
