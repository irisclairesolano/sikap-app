import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';
import { profileApi } from '../api/profile';
import { LoginRequest, RegisterRequest, User } from '../types';

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      // Store token
      await SecureStore.setItemAsync('auth_token', data.token);
      
      // Set user data in cache
      queryClient.setQueryData(['profile'], data.user);
      
      // Invalidate any cached data
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Login error:', error);
      throw error;
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      // Store token
      await SecureStore.setItemAsync('auth_token', data.token);
      
      // Set user data in cache
      queryClient.setQueryData(['profile'], data.user);
      
      // Invalidate any cached data
      queryClient.invalidateQueries();
    },
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
      // Remove token from SecureStore
      await SecureStore.deleteItemAsync('auth_token');
      
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
    
    // Actions
    logout,
    
    // Refresh profile
    refetchProfile: () => queryClient.refetchQueries({ queryKey: ['profile'] }),
  };
};
