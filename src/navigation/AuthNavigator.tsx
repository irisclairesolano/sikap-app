import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import Onboarding1Screen from '../screens/auth/Onboarding1Screen';
import Onboarding2Screen from '../screens/auth/Onboarding2Screen';
import Onboarding3Screen from '../screens/auth/Onboarding3Screen';
import SplashScreen from '../screens/auth/SplashScreen';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  RoleSelect: undefined;
  Register: undefined;
  Login: undefined;
  OTPVerify: undefined;
  IDUpload: undefined;
  PendingVerify: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding1" component={Onboarding1Screen} />
      <Stack.Screen name="Onboarding2" component={Onboarding2Screen} />
      <Stack.Screen name="Onboarding3" component={Onboarding3Screen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
      <Stack.Screen name="IDUpload" component={IDUploadScreen} />
      <Stack.Screen name="PendingVerify" component={PendingVerifyScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

// Placeholder screens (keeping all except built screens)
const RoleSelectScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Role Select</Text>
  </View>
);

const RegisterScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Register</Text>
  </View>
);

const OTPVerifyScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>OTP Verify</Text>
  </View>
);

const IDUploadScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>ID Upload</Text>
  </View>
);

const PendingVerifyScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Pending Verification</Text>
  </View>
);

const ForgotPasswordScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Forgot Password</Text>
  </View>
);

export default AuthNavigator;
