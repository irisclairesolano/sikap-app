import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';

// Required for web browser redirect handling in Expo
WebBrowser.maybeCompleteAuthSession();

// User's Google Client ID
export const GOOGLE_WEB_CLIENT_ID =
  '390883768070-7j54cfip77r61gajq37bmaff8nmg5isf.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
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
