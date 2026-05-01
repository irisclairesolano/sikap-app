import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Debug: Check if BASE_URL is loaded
console.log('🔗 API Base URL:', BASE_URL);

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await SecureStore.getItemAsync('auth_token');
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    await SecureStore.deleteItemAsync('auth_token');
    // trigger navigation to Login — handled by RootNavigator auth state listener
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Something went wrong');
  }
  return res.json();
}
