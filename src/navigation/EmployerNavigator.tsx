import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../theme';
import { useNotifications } from '../hooks/useNotifications';

import { EmployerDashboardScreen } from '../screens/employer/EmployerDashboardScreen';
import ProfileScreen from '../screens/employer/ProfileScreen';
import NotificationsScreen from '../screens/employer/NotificationsScreen';
import RateWorkerScreen from '../screens/employer/RateWorkerScreen';
import RateWorkerListScreen from '../screens/employer/RateWorkerListScreen';
import MyJobsScreen from '../screens/employer/MyJobsScreen';
import JobStatusManagementScreen from '../screens/employer/JobStatusManagementScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import ManageContactPlatformsScreen from '../screens/common/ManageContactPlatformsScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import ReportScreen from '../screens/common/ReportScreen';
import RoleOnboardingScreen from '../screens/common/RoleOnboardingScreen';
import ReviewsScreen from '../screens/worker/ReviewsScreen';

import { PostJobScreen } from '../screens/employer/PostJobScreen';
import ApplicantDetailScreen from '../screens/employer/ApplicantDetailScreen';
import ConfirmHireScreen from '../screens/employer/ConfirmHireScreen';
import SendRequestScreen from '../screens/employer/SendRequestScreen';
import CancelHireScreen from '../screens/employer/CancelHireScreen';
import MarkCompleteScreen from '../screens/employer/MarkCompleteScreen';

export type EmployerStackParamList = {
  Home: undefined;
  EmployerDashboard: undefined;
  PostJob?: { job?: any } | undefined;
  JobDetails: { id: number };
  ApplicantDetail: {
    applicantId: number;
    jobTitle?: string;
    applicantName?: string;
    status?: string;
    barangay?: string;
    municipality?: string;
    reputationScore?: number;
    bio?: string;
    skills?: string[];
    experiences?: any[];
    characterReferences?: any[];
    reviews?: any[];
    phone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };
  SendRequest: { id: number; applicantName: string; jobTitle: string };
  ConfirmHire: { applicantId: number; applicantName: string; jobTitle: string };
  CancelHire: { id: number; applicantName: string; jobTitle: string };
  MarkComplete: { id: number; jobTitle: string };
  RateWorkerList: { jobId: number; jobTitle: string };
  RateWorker: { id: number; workerName: string; jobTitle: string };
  Report: { id: number };
  EditProfile: undefined;
  ManageContactPlatforms: undefined;
  Settings: undefined;
  Reviews: undefined;
  MyJobs: undefined;
  JobStatusManagement: { id: number; job?: any };
  Notifications: undefined;
  Profile: undefined;
  RoleOnboarding: { targetRole: 'worker' | 'employer' };
};

export type EmployerTabParamList = {
  Home: undefined;
  MyJobs: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<EmployerTabParamList>();
const Stack = createNativeStackNavigator<EmployerStackParamList>();

// Home Stack
const HomeStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="EmployerDashboard">
    <Stack.Screen name="EmployerDashboard" component={EmployerDashboardScreen} />
    <Stack.Screen name="PostJob" component={PostJobScreen} />
    <Stack.Screen name="JobDetails" component={JobStatusManagementScreen} />
    <Stack.Screen name="JobStatusManagement" component={JobStatusManagementScreen} />
    <Stack.Screen name="ApplicantDetail" component={ApplicantDetailScreen} />
    <Stack.Screen name="SendRequest" component={SendRequestScreen} />
    <Stack.Screen name="ConfirmHire" component={ConfirmHireScreen} />
    <Stack.Screen name="CancelHire" component={CancelHireScreen} />
    <Stack.Screen name="MarkComplete" component={MarkCompleteScreen} />
    <Stack.Screen name="RateWorkerList" component={RateWorkerListScreen} />
    <Stack.Screen name="RateWorker" component={RateWorkerScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="ManageContactPlatforms" component={ManageContactPlatformsScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Reviews" component={ReviewsScreen} />
    <Stack.Screen name="RoleOnboarding" component={RoleOnboardingScreen} />
  </Stack.Navigator>
);

// My Jobs Stack
const MyJobsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyJobs" component={MyJobsScreen} />
    <Stack.Screen name="PostJob" component={PostJobScreen} />
    <Stack.Screen name="JobDetails" component={JobStatusManagementScreen} />
    <Stack.Screen name="JobStatusManagement" component={JobStatusManagementScreen} />
    <Stack.Screen name="ApplicantDetail" component={ApplicantDetailScreen} />
    <Stack.Screen name="ConfirmHire" component={ConfirmHireScreen} />
    <Stack.Screen name="RateWorkerList" component={RateWorkerListScreen} />
    <Stack.Screen name="RateWorker" component={RateWorkerScreen} />
    <Stack.Screen name="SendRequest" component={SendRequestScreen} />
    <Stack.Screen name="CancelHire" component={CancelHireScreen} />
    <Stack.Screen name="MarkComplete" component={MarkCompleteScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="ManageContactPlatforms" component={ManageContactPlatformsScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Reviews" component={ReviewsScreen} />
    <Stack.Screen name="RoleOnboarding" component={RoleOnboardingScreen} />
  </Stack.Navigator>
);

// Notifications Stack
const NotificationsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="ApplicantDetail" component={ApplicantDetailScreen} />
    <Stack.Screen name="JobDetails" component={JobStatusManagementScreen} />
    <Stack.Screen name="JobStatusManagement" component={JobStatusManagementScreen} />
    <Stack.Screen name="PostJob" component={PostJobScreen} />
    <Stack.Screen name="ConfirmHire" component={ConfirmHireScreen} />
    <Stack.Screen name="SendRequest" component={SendRequestScreen} />
    <Stack.Screen name="CancelHire" component={CancelHireScreen} />
    <Stack.Screen name="MarkComplete" component={MarkCompleteScreen} />
    <Stack.Screen name="RateWorkerList" component={RateWorkerListScreen} />
    <Stack.Screen name="RateWorker" component={RateWorkerScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="ManageContactPlatforms" component={ManageContactPlatformsScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Reviews" component={ReviewsScreen} />
    <Stack.Screen name="RoleOnboarding" component={RoleOnboardingScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="ManageContactPlatforms" component={ManageContactPlatformsScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Reviews" component={ReviewsScreen} />
    <Stack.Screen name="RoleOnboarding" component={RoleOnboardingScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
    <Stack.Screen name="JobStatusManagement" component={JobStatusManagementScreen} />
    <Stack.Screen name="ApplicantDetail" component={ApplicantDetailScreen} />
  </Stack.Navigator>
);

const EmployerNavigator: React.FC = () => {
  const { data } = useNotifications();
  const unreadCount = data?.unread_count || 0;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyJobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            (navigation as any).navigate('Home', { screen: 'EmployerDashboard' });
          },
        })}
      />
      <Tab.Screen
        name="MyJobs"
        component={MyJobsStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            (navigation as any).navigate('MyJobs', { screen: 'MyJobs' });
          },
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#DC2626', color: colors.white },
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            (navigation as any).navigate('Notifications', { screen: 'Notifications' });
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            (navigation as any).navigate('Profile', { screen: 'Profile' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default EmployerNavigator;
