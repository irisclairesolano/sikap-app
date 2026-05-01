import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';
import { User } from '../types';

export const useAuthCheck = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthToken();
  }, []);

  const checkAuthToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        // Validate token and get user data
        const response = await apiClient<{ data: User }>('/profile');
        const userData = response.data;
        
        // Check verification status
        if (userData.verification_status !== 'approved') {
          setUser(null); // Will route to AuthNavigator -> PendingVerify
        } else {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error checking auth token:', error);
      // If token is invalid/expired, clear it
      await SecureStore.deleteItemAsync('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isVerified: user?.verification_status === 'approved',
  };
};
