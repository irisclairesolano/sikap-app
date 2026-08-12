import { useEffect, useState } from 'react';
import * as SecureStore from '../utils/storage';
import { subscribeAuthChanged } from '../store/authEvents';
import { User } from '../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile';

export const useAuthCheck = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeAuthChanged(() => {
        setReloadToken((t) => t + 1);
      }),
    [],
  );

  useEffect(() => {
    const checkToken = async () => {
      setIsLoadingToken(true);
      const authToken = await SecureStore.getItemAsync('auth_token');
      setToken(authToken);
      setIsLoadingToken(false);
    };
    checkToken();
  }, [reloadToken]);

  const { data: user, isLoading: isLoadingProfile } = useQuery<User | null>({
    queryKey: ['profile'],
    queryFn: async () => {
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (!authToken) return null;
      try {
        const response = await profileApi.getProfile();
        await SecureStore.setItemAsync('user_profile', JSON.stringify(response));
        return response;
      } catch (err) {
        return null;
      }
    },
    enabled: !isLoadingToken && !!token,
    initialData: () => {
      return queryClient.getQueryData(['profile']);
    },
  });

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

  const isVerified = user?.verification_status === 'approved';

  return {
    user: token ? user : null,
    isLoading: isLoadingToken || (!!token && isLoadingProfile),
    isVerified,
  };
};
