import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AlertProvider } from './src/contexts/AlertContext';
import { ToastProvider } from './src/contexts/ToastContext';
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
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  LogBox,
  AppState,
  AppStateStatus,
  Platform,
} from 'react-native';
import { focusManager } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { OfflineNotice } from './src/components/common/OfflineNotice';
import ErrorBoundary from './src/components/common/ErrorBoundary';

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

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
          MyJobs: {
            screens: {
              ApplicationDetail: 'applications/:applicationId',
            },
          },
          Messages: {
            screens: {
              ConversationsList: 'messages',
              Chat: 'chat/:conversationId',
            },
          },
          Notifications: {
            screens: {
              NotificationsList: 'notifications',
            },
          },
          Profile: {
            screens: {
              Profile: 'profile',
              SupportTickets: 'support',
            },
          },
        },
      },
      Employer: {
        screens: {
          Home: {
            screens: {
              JobDetails: 'employer/jobs/:id',
              ApplicantDetail: 'applicants/:applicantId',
              RateWorkerList: 'rate-worker/:jobId',
            },
          },
          Jobs: {
            screens: {
              MyJobs: 'employer/my-jobs',
              PostJob: 'employer/post-job',
              JobStatusManagement: 'employer/manage-job/:id',
            },
          },
          Messages: {
            screens: {
              ConversationsList: 'employer/messages',
              Chat: 'employer/chat/:conversationId',
            },
          },
          Notifications: {
            screens: {
              NotificationsList: 'employer/notifications',
            },
          },
          Profile: {
            screens: {
              EmployerProfile: 'employer/profile',
              SupportTickets: 'employer/support',
            },
          },
        },
      },
      Auth: {
        screens: {
          PendingVerify: 'verification',
          IDUpload: 'upload-id',
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

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

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
            <ToastProvider>
              <ErrorBoundary>
                <NavigationContainer ref={navigationRef} linking={linking}>
                  <RootNavigator />
                </NavigationContainer>
                <OfflineNotice />
              </ErrorBoundary>
              <StatusBar style="auto" />
            </ToastProvider>
          </AlertProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
