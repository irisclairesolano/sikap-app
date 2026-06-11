import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../theme';

export type EmployerStackParamList = {
  Home: undefined;
  PostJob: undefined;
  JobDetails: { id: number };
  ViewApplicants: { id: number };
  ApplicantDetail: { applicantId: number; jobTitle: string; applicantName: string; status: string };
  SendRequest: { id: number };
  ConfirmHire: { applicantId: number; applicantName: string; jobTitle: string };
  CancelHire: { id: number };
  MarkComplete: { id: number };
  RateWorker: { id: number };
  Report: { id: number };
  EditProfile: undefined;
  Settings: undefined;
  Reviews: undefined;
  MyJobs: undefined;
  JobStatusManagement: { id: number };
  Notifications: undefined;
  Profile: undefined;
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
    <Stack.Screen name="RateWorker" component={RateWorkerScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
  </Stack.Navigator>
);

// My Jobs Stack
const MyJobsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyJobs" component={MyJobsScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="ViewApplicants" component={ViewApplicantsScreen} />
    <Stack.Screen name="ApplicantProfile" component={ApplicantProfileScreen} />
    <Stack.Screen name="SendRequest" component={SendRequestScreen} />
    <Stack.Screen name="ConfirmHire" component={ConfirmHireScreen} />
    <Stack.Screen name="CancelHire" component={CancelHireScreen} />
    <Stack.Screen name="MarkComplete" component={MarkCompleteScreen} />
    <Stack.Screen name="RateWorker" component={RateWorkerScreen} />
    <Stack.Screen name="JobStatusManagement" component={JobStatusManagementScreen} />
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
    <Stack.Screen name="Reviews" component={ReviewsScreen} />
  </Stack.Navigator>
);

const EmployerNavigator: React.FC = () => {
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
      <Tab.Screen name="Notifications" component={NotificationsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

import { EmployerDashboardScreen } from '../screens/employer/EmployerDashboardScreen';
import ProfileScreen from '../screens/employer/ProfileScreen';
import NotificationsScreen from '../screens/employer/NotificationsScreen';
import RateWorkerScreen from '../screens/employer/RateWorkerScreen';

const MyJobsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>My Posted Jobs</Text>
  </View>
);

import { PostJobScreen } from '../screens/employer/PostJobScreen';
import { ViewApplicantsScreen } from '../screens/employer/ViewApplicantsScreen';
import ApplicantDetailScreen from '../screens/employer/ApplicantDetailScreen';
import ConfirmHireScreen from '../screens/employer/ConfirmHireScreen';

const JobDetailsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Job Details</Text>
  </View>
);

const SendRequestScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Send Request</Text>
  </View>
);

const CancelHireScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Cancel Hire</Text>
  </View>
);

const MarkCompleteScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Mark Complete</Text>
  </View>
);

const ReportScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Report</Text>
  </View>
);

const EditProfileScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Edit Profile</Text>
  </View>
);

const SettingsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Settings</Text>
  </View>
);

const ReviewsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Reviews</Text>
  </View>
);

const JobStatusManagementScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Job Status Management</Text>
  </View>
);

export default EmployerNavigator;
