import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';
import { useAuthCheck } from '../hooks/useAuthCheck';
import AuthNavigator from './AuthNavigator';
import EmployerNavigator from './EmployerNavigator';
import WorkerNavigator from './WorkerNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Worker: undefined;
  Employer: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { user, isLoading, isAuthenticated, isVerified } = useAuthCheck();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // If not authenticated, show auth flow
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // If authenticated but not verified, show pending verification
  if (!isVerified) {
    return <AuthNavigator />;
  }

  // If authenticated and verified, show appropriate navigator
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user?.role === 'worker' ? (
        <Stack.Screen name="Worker" component={WorkerNavigator} />
      ) : user?.role === 'employer' ? (
        <Stack.Screen name="Employer" component={EmployerNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
