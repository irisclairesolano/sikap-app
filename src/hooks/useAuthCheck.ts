import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';
import { subscribeAuthChanged } from '../store/authEvents';
import { User } from '../types';

export const useAuthCheck = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => subscribeAuthChanged(() => setReloadToken((t) => t + 1)), []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const authToken = await SecureStore.getItemAsync('auth_token');
        if (!authToken) {
          if (!cancelled) setUser(null);
          return;
        }

        const response = await apiClient<{ data: User }>('/profile');
        if (!cancelled) setUser(response.data);
      } catch {
        if (!cancelled) {
          await SecureStore.deleteItemAsync('auth_token').catch(() => {});
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const isVerified = user?.verification_status === 'approved';

  return {
    user,
    isLoading,
    isVerified,
  };
};
