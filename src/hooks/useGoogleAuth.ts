import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useState } from 'react';

// Required for web browser redirect handling in Expo
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client ID for SIKAP
export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '1053304945131-4qvvftoidfuo932i9088kjk7ja46hr86.apps.googleusercontent.com';

// Backward compatibility export
export const GOOGLE_WEB_CLIENT_ID = GOOGLE_CLIENT_ID;

export const useGoogleAuth = () => {
  const redirectUri = makeRedirectUri({
    scheme: 'sikap',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
  });

  const [isLoading, setIsLoading] = useState(false);

  return {
    request,
    response,
    promptAsync,
    isLoading,
    setIsLoading,
  };
};

export default useGoogleAuth;
