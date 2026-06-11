import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';
import { useAuthCheck } from '../hooks/useAuthCheck';
import AuthNavigator from './AuthNavigator';
import { AuthStackParamList } from './authTypes';
import EmployerNavigator from './EmployerNavigator';
import WorkerNavigator from './WorkerNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Worker: undefined;
  Employer: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { user, isLoading, isVerified } = useAuthCheck();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator key="guest" />;
  }

  if (!isVerified) {
    let gateStart: keyof AuthStackParamList = 'PendingVerify';
    let params: any = undefined;

    const status = user.registration_status;
    if (status === 'pending_email_verification') {
      gateStart = 'OTPVerify';
      params = { userId: user.id, email: user.email, role: user.role || 'worker' };
    } else if (status === 'pending_id_upload' || (!status && !user.document_url)) {
      gateStart = 'IDUpload';
      params = { userId: user.id, role: user.role || 'worker' };
    } else if (status === 'pending_review' || (!status && user.document_url)) {
      gateStart = 'PendingVerify';
    } else if (status === 'rejected') {
      gateStart = 'Login';
    }

    return (
      <AuthNavigator key={`pending-${user.id}`} initialRouteName={gateStart} initialParams={params} />
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user.role === 'worker' ? (
        <Stack.Screen name="Worker" component={WorkerNavigator} />
      ) : user.role === 'employer' ? (
        <Stack.Screen name="Employer" component={EmployerNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
