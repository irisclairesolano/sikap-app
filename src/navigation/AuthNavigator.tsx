import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import IDUploadScreen from '../screens/auth/IDUploadScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RegisterStep2Screen from '../screens/auth/RegisterStep2Screen';
import OTPVerifyScreen from '../screens/auth/OTPVerifyScreen';
import PendingVerifyScreen from '../screens/auth/PendingVerifyScreen';
import HomeScreen from '../screens/HomeScreen';
import { AuthStackParamList } from './authTypes';

export type { AuthStackParamList } from './authTypes';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  initialRouteName?: keyof AuthStackParamList;
  initialParams?: any;
};

const AuthNavigator: React.FC<AuthNavigatorProps> = ({
  initialRouteName = 'Splash',
  initialParams,
}) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2Screen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} initialParams={initialRouteName === 'OTPVerify' ? initialParams : undefined} />
      <Stack.Screen name="IDUpload" component={IDUploadScreen} initialParams={initialRouteName === 'IDUpload' ? initialParams : undefined} />
      <Stack.Screen name="PendingVerify" component={PendingVerifyScreen} initialParams={initialRouteName === 'PendingVerify' ? initialParams : undefined} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
