import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from '../utils/storage';
import { authApi } from '../api/auth';
import { profileApi } from '../api/profile';
import { notifyAuthChanged } from '../store/authEvents';
import { LoginRequest, RegisterRequest, User } from '../types';

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      if (data.user && data.user.role !== 'worker' && data.user.role !== 'employer') {
        throw new Error('FUTURE_ROLE');
      }
      await SecureStore.setItemAsync('auth_token', data.token);
      await SecureStore.setItemAsync('user_profile', JSON.stringify(data.user));
      queryClient.setQueryData(['profile'], data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      notifyAuthChanged();
    },
    onError: (error) => {
      console.error('Login error:', error);
      throw error;
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onError: (error) => {
      console.error('Register error:', error);
      throw error;
    },
  });

  // Get profile query
  const {
    data: user,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    enabled: false, // Don't auto-fetch - only when explicitly called
    retry: false,
  });

  // Logout function
  const logout = async () => {
    try {
      // Remove token and profile from SecureStore
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_profile');

      // Clear all cached data
      queryClient.clear();

      // Reset user data
      queryClient.setQueryData(['profile'], null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Get user role
  const userRole = user?.role;

  // Check if user is verified
  const isVerified = user?.verification_status === 'approved';

  // Switch Role mutation
  const switchRoleMutation = useMutation({
    mutationFn: authApi.switchRole,
    onSuccess: async (data) => {
      if (data?.user) {
        await SecureStore.setItemAsync('user_profile', JSON.stringify(data.user));
      }
      queryClient.setQueryData(['profile'], data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      notifyAuthChanged();
    },
    onError: (error) => {
      console.error('Switch Role error:', error);
    },
  });

  // Onboard Role mutation
  const onboardRoleMutation = useMutation({
    mutationFn: (params: { targetRole: 'worker' | 'employer'; data: any }) =>
      profileApi.onboardRole(params.targetRole, params.data),
    onSuccess: async (data) => {
      if (data?.user) {
        await SecureStore.setItemAsync('user_profile', JSON.stringify(data.user));
      }
      queryClient.setQueryData(['profile'], data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      notifyAuthChanged();
    },
    onError: (error) => {
      console.error('Onboard Role error:', error);
    },
  });

  return {
    // User data
    user,
    isLoadingProfile,
    profileError,
    isAuthenticated,
    userRole,
    isVerified,

    // Mutations
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    loginMutation,
    registerMutation,
    switchRole: switchRoleMutation.mutateAsync,
    isSwitchingRole: switchRoleMutation.isPending,
    onboardRole: onboardRoleMutation.mutateAsync,
    isOnboardingRole: onboardRoleMutation.isPending,

    // Actions
    logout,

    // Refresh profile
    refetchProfile: () => queryClient.refetchQueries({ queryKey: ['profile'] }),
  };
};
