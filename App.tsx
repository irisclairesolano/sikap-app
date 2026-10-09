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
import { getItemAsync } from './src/utils/storage';

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

async function resolveUrlFromNotificationData(data: any): Promise<string | null> {
  if (!data) return null;

  let role = data.role;
  if (!role) {
    try {
      const stored = await getItemAsync('user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        role = parsed?.role;
      }
    } catch {}
  }

  const conversationId = data.conversation_id || data.conversationId;
  if (conversationId && !isNaN(Number(conversationId))) {
    return role === 'employer'
      ? `sikap://employer/chat/${conversationId}`
      : `sikap://chat/${conversationId}`;
  }

  const jobId = data.job_id || data.jobId;
  if (jobId && !isNaN(Number(jobId))) {
    return role === 'employer' ? `sikap://employer/jobs/${jobId}` : `sikap://jobs/${jobId}`;
  }

  const applicationId = data.application_id || data.applicationId;
  if (applicationId && !isNaN(Number(applicationId))) {
    return role === 'employer'
      ? `sikap://applicants/${applicationId}`
      : `sikap://applications/${applicationId}`;
  }

  const applicantId = data.applicant_id || data.applicantId;
  if (applicantId && !isNaN(Number(applicantId))) {
    return `sikap://applicants/${applicantId}`;
  }

  if (
    data.type === 'verification_rejected' ||
    data.type === 'id_rejected' ||
    (data.type === 'id_verification' && data.status === 'rejected')
  ) {
    return 'sikap://verification';
  }

  if (data.type === 'pending_id_upload' || data.type === 'upload_id') {
    return 'sikap://upload-id';
  }

  return null;
}

const linking = {
  prefixes: [Linking.createURL('/'), 'sikap://'],
  async getInitialURL() {
    // 1. Check if the app was launched from an explicit deep link URL
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }

    // 2. Check if the app was launched from a notification in killed state
    try {
      const Notifications = require('expo-notifications');
      const response = await Notifications.getLastNotificationResponseAsync();
      const data = response?.notification?.request?.content?.data;
      if (data) {
        const notifUrl = await resolveUrlFromNotificationData(data);
        if (notifUrl) return notifUrl;
      }
    } catch {
      // Ignored for environments where native expo-notifications is not loaded
    }

    return null;
  },
  subscribe(listener: (url: string) => void) {
    const onReceiveURL = ({ url }: { url: string }) => listener(url);
    const eventListenerSubscription = Linking.addEventListener('url', onReceiveURL);

    // 3. Listen to notification response while app is running in background or foreground
    let notifSubscription: { remove: () => void } | undefined;
    try {
      const Notifications = require('expo-notifications');
      notifSubscription = Notifications.addNotificationResponseReceivedListener(
        async (response: any) => {
          const data = response?.notification?.request?.content?.data;
          if (data) {
            const notifUrl = await resolveUrlFromNotificationData(data);
            if (notifUrl) {
              listener(notifUrl);
            }
          }
        },
      );
    } catch {
      // Ignored for environments where native expo-notifications is not loaded
    }

    return () => {
      eventListenerSubscription.remove();
      notifSubscription?.remove();
    };
  },
  config: {
    screens: {
      Worker: {
        screens: {
          Find: {
            screens: {
              Home: 'jobs',
              JobDetails: 'jobs/:id',
              Apply: 'jobs/:id/apply',
            },
          },
          Mine: {
            screens: {
              Applications: 'applications',
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
          Me: {
            screens: {
              ProfileMain: 'profile',
              SupportTickets: 'support',
            },
          },
        },
      },
      Employer: {
        screens: {
          Home: {
            screens: {
              EmployerDashboard: 'employer',
              JobDetails: 'employer/jobs/:id',
              ApplicantDetail: 'applicants/:applicantId',
              RateWorkerList: 'rate-worker/:jobId',
            },
          },
          MyJobs: {
            screens: {
              MyJobsList: 'employer/my-jobs',
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
              ProfileMain: 'employer/profile',
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
