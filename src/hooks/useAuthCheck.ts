import { useEffect, useState } from 'react';
import * as SecureStore from '../utils/storage';
import { subscribeAuthChanged } from '../store/authEvents';
import { User } from '../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile';

export const useAuthCheck = () => {
  const queryClient = useQueryClient();
  const initialSyncToken =
    typeof SecureStore.getItemSync === 'function' ? SecureStore.getItemSync('auth_token') : null;
  const [token, setToken] = useState<string | null>(initialSyncToken);
  const [isLoadingToken, setIsLoadingToken] = useState(!initialSyncToken);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const checkToken = async () => {
      const syncToken =
        typeof SecureStore.getItemSync === 'function'
          ? SecureStore.getItemSync('auth_token')
          : null;
      if (syncToken) {
        setToken(syncToken);
        setIsLoadingToken(false);
        return;
      }
      if (reloadToken === 0) {
        setIsLoadingToken(true);
      }
      const authToken = await SecureStore.getItemAsync('auth_token');
      setToken(authToken);
      setIsLoadingToken(false);
    };
    checkToken();
  }, [reloadToken]);

  const {
    data: user,
    isLoading: isLoadingProfile,
    refetch,
  } = useQuery<User | null>({
    queryKey: ['profile'],
    queryFn: async () => {
      const authToken =
        (typeof SecureStore.getItemSync === 'function'
          ? SecureStore.getItemSync('auth_token')
          : null) || (await SecureStore.getItemAsync('auth_token'));
      if (!authToken) return null;
      try {
        const response = await profileApi.getProfile();
        await SecureStore.setItemAsync('user_profile', JSON.stringify(response));
        return response;
      } catch (err) {
        const existingInCache = queryClient.getQueryData<User | null>(['profile']);
        if (existingInCache) {
          return existingInCache;
        }
        const cachedUserStr = await SecureStore.getItemAsync('user_profile');
        if (cachedUserStr) {
          try {
            return JSON.parse(cachedUserStr);
          } catch (e) {}
        }
        return null;
      }
    },
    enabled: !isLoadingToken && !!token,
  });

  useEffect(
    () =>
      subscribeAuthChanged(() => {
        const syncToken =
          typeof SecureStore.getItemSync === 'function'
            ? SecureStore.getItemSync('auth_token')
            : null;
        setToken(syncToken);
        setIsLoadingToken(false);
        setReloadToken((t) => t + 1);
        if (syncToken) {
          refetch();
        }
      }),
    [refetch],
  );

  // Restore cached user on mount
  useEffect(() => {
    const restoreCachedUser = async () => {
      const cachedUserStr = await SecureStore.getItemAsync('user_profile');
      if (cachedUserStr) {
        try {
          const cachedUser = JSON.parse(cachedUserStr);
          if (!queryClient.getQueryData(['profile'])) {
            queryClient.setQueryData(['profile'], cachedUser);
          }
        } catch (e) {}
      }
    };
    restoreCachedUser();
  }, [queryClient, token]);

  const effectiveToken =
    token ||
    (typeof SecureStore.getItemSync === 'function' ? SecureStore.getItemSync('auth_token') : null);
  const isVerified = user?.verification_status === 'approved';

  return {
    user: effectiveToken ? user : null,
    isLoading: isLoadingToken || (!!effectiveToken && !user && isLoadingProfile),
    isVerified,
  };
};
