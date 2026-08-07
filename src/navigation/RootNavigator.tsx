import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthCheck } from '../hooks/useAuthCheck';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { profileApi } from '../api/profile';
import AuthNavigator from './AuthNavigator';
import { AuthStackParamList } from './authTypes';
import EmployerNavigator from './EmployerNavigator';
import WorkerNavigator from './WorkerNavigator';
import RoleOnboardingScreen from '../screens/common/RoleOnboardingScreen';
import { colors, fonts } from '../theme';

export type RootStackParamList = {
  Auth: undefined;
  Worker: undefined;
  Employer: undefined;
  RoleOnboarding: { targetRole: 'worker' | 'employer' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AdminFallback: React.FC = () => {
  const { logout } = useAuth();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.paper,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 24,
          color: colors.ink,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        Admin Access
      </Text>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.inkSoft,
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        Administrators must use the desktop web dashboard.
      </Text>
      <TouchableOpacity
        onPress={logout}
        style={{
          backgroundColor: colors.ink,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 100,
        }}
      >
        <Text style={{ color: colors.white, fontFamily: fonts.bodyBold }}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const RootNavigator: React.FC = () => {
  const { user, isLoading, isVerified } = useAuthCheck();
  const { expoPushToken } = usePushNotifications();

  React.useEffect(() => {
    if (user && expoPushToken) {
      profileApi.updateProfile({ expo_push_token: expoPushToken.data }).catch((err) => {
        console.error('Failed to update push token:', err);
      });
    }
  }, [user?.id, expoPushToken?.data]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.paper,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            marginTop: 16,
            fontFamily: fonts.bodySemiBold,
            fontSize: 14,
            color: colors.inkMuted,
            letterSpacing: 0.5,
          }}
        >
          Loading SIKAP...
        </Text>
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator key="guest" />;
  }

  if (user.role === 'admin') {
    return <AdminFallback />;
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
      <AuthNavigator
        key={`pending-${user.id}`}
        initialRouteName={gateStart}
        initialParams={params}
      />
    );
  }

  const needsOnboarding =
    (user.role === 'worker' &&
      (!user.has_worker_profile ||
        !user.worker_profile ||
        (user.worker_profile.skills || []).length === 0)) ||
    (user.role === 'employer' && (!user.has_employer_profile || !user.employer_profile));

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {needsOnboarding ? (
        <Stack.Screen
          name="RoleOnboarding"
          component={RoleOnboardingScreen}
          initialParams={{ targetRole: user.role }}
        />
      ) : user.role === 'worker' ? (
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
