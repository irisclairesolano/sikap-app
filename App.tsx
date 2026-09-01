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
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

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

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});

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

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            backgroundColor: '#FFF7F2',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 22,
              color: '#1E293B',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: '#64748B',
              textAlign: 'center',
              marginBottom: 20,
              lineHeight: 20,
            }}
          >
            An unexpected error occurred in the application. Please reload the app to continue.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: '#E8744A',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>
              Reload App
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
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

  if (!fontsLoaded) {
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
            </ErrorBoundary>
            <StatusBar style="auto" />
          </AlertProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
