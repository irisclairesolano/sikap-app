import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AlertProvider } from './src/contexts/AlertContext';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  Manrope_500Medium,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { View, Text, TouchableOpacity, ActivityIndicator, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { OfflineNotice } from './src/components/common/OfflineNotice';
import ErrorBoundary from './src/components/common/ErrorBoundary';

// Suppress upstream @react-navigation/bottom-tabs v7 internal warning:
// CommonActions.navigate(route) in BottomTabBar.js triggers this routers warning
LogBox.ignoreLogs([/Passing an object as the argument to 'navigate' is deprecated/]);

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (keep in garbage collector so it persists)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

try {
  persistQueryClient({
    queryClient: queryClient as any,
    persister: asyncStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  });
} catch (e) {
  console.warn('Failed to initialize query persister:', e);
}

const linking = {
  prefixes: [Linking.createURL('/'), 'sikap://'],
  config: {
    screens: {
      Worker: {
        screens: {
          Find: {
            screens: {
              JobDetails: 'jobs/:id',
            },
          },
        },
      },
      Employer: {
        screens: {
          Home: {
            screens: {
              JobDetails: 'jobs/:id',
            },
          },
        },
      },
    },
  },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold: require('./assets/raleway/Raleway-Bold.ttf'),
    Raleway_900Black: require('./assets/raleway/Raleway-Heavy.ttf'),
    Raleway_700Bold_Italic: require('./assets/raleway/Raleway-Bold.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Manrope_500Medium,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FCE4D2',
        }}
      >
        <ActivityIndicator size="large" color="#E8744A" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AlertProvider>
            <ErrorBoundary>
              <NavigationContainer ref={navigationRef} linking={linking}>
                <RootNavigator />
              </NavigationContainer>
              <OfflineNotice />
            </ErrorBoundary>
            <StatusBar style="auto" />
          </AlertProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
