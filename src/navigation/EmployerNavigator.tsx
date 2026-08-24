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
import SettingsScreen from '../screens/common/SettingsScreen';
import ReportScreen from '../screens/common/ReportScreen';
import RoleOnboardingScreen from '../screens/common/RoleOnboardingScreen';

import { PostJobScreen } from '../screens/employer/PostJobScreen';
import { ViewApplicantsScreen } from '../screens/employer/ViewApplicantsScreen';
import ApplicantDetailScreen from '../screens/employer/ApplicantDetailScreen';
import ConfirmHireScreen from '../screens/employer/ConfirmHireScreen';
import SendRequestScreen from '../screens/employer/SendRequestScreen';
import CancelHireScreen from '../screens/employer/CancelHireScreen';
import MarkCompleteScreen from '../screens/employer/MarkCompleteScreen';

export type EmployerStackParamList = {
  Home: undefined;
  PostJob: undefined;
  JobDetails: { id: number };
  ViewApplicants: { id: number };
  ApplicantDetail: {
    applicantId: number;
    jobTitle: string;
    applicantName: string;
    status: string;
    barangay?: string;
    municipality?: string;
    reputationScore?: number;
    bio?: string;
    skills?: string[];
    experiences?: any[];
    characterReferences?: any[];
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
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={EmployerDashboardScreen} />
    <Stack.Screen name="PostJob" component={PostJobScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="ViewApplicants" component={ViewApplicantsScreen} />
    <Stack.Screen name="ApplicantDetail" component={ApplicantDetailScreen} />
    <Stack.Screen name="SendRequest" component={SendRequestScreen} />
    <Stack.Screen name="ConfirmHire" component={ConfirmHireScreen} />
    <Stack.Screen name="CancelHire" component={CancelHireScreen} />
    <Stack.Screen name="MarkComplete" component={MarkCompleteScreen} />
    <Stack.Screen name="RateWorkerList" component={RateWorkerListScreen} />
    <Stack.Screen name="RateWorker" component={RateWorkerScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
  </Stack.Navigator>
);

// My Jobs Stack
const MyJobsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyJobs" component={MyJobsScreen} />
    <Stack.Screen name="PostJob" component={PostJobScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="JobStatusManagement" component={JobStatusManagementScreen} />
    <Stack.Screen name="ViewApplicants" component={ViewApplicantsScreen} />
    <Stack.Screen name="ApplicantDetail" component={ApplicantDetailScreen} />
    <Stack.Screen name="ConfirmHire" component={ConfirmHireScreen} />
    <Stack.Screen name="RateWorkerList" component={RateWorkerListScreen} />
    <Stack.Screen name="RateWorker" component={RateWorkerScreen} />
    <Stack.Screen name="SendRequest" component={SendRequestScreen} />
    <Stack.Screen name="CancelHire" component={CancelHireScreen} />
    <Stack.Screen name="MarkComplete" component={MarkCompleteScreen} />
  </Stack.Navigator>
);

// Notifications Stack
const NotificationsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="RoleOnboarding" component={RoleOnboardingScreen} />
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
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="MyJobs" component={MyJobsStack} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.peach, color: colors.white },
        }}
      />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

const JobDetailsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Job Details</Text>
  </View>
);

export default EmployerNavigator;
