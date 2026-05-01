import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';

export type EmployerStackParamList = {
  Home: undefined;
  PostJob: undefined;
  JobDetails: { id: number };
  ViewApplicants: { id: number };
  ApplicantProfile: { id: number };
  SendRequest: { id: number };
  ConfirmHire: { id: number };
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
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="PostJob" component={PostJobScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="ViewApplicants" component={ViewApplicantsScreen} />
    <Stack.Screen name="ApplicantProfile" component={ApplicantProfileScreen} />
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
        tabBarActiveTintColor: '#0D9488',
        tabBarInactiveTintColor: '#78716C',
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

// Placeholder screens
const HomeScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Employer Home</Text>
  </View>
);

const MyJobsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>My Posted Jobs</Text>
  </View>
);

const NotificationsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Notifications</Text>
  </View>
);

const ProfileScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Employer Profile</Text>
  </View>
);

const PostJobScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Post a Job</Text>
  </View>
);

const JobDetailsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Job Details</Text>
  </View>
);

const ViewApplicantsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>View Applicants</Text>
  </View>
);

const ApplicantProfileScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Applicant Profile</Text>
  </View>
);

const SendRequestScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Send Request</Text>
  </View>
);

const ConfirmHireScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Confirm Hire</Text>
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

const RateWorkerScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Rate Worker</Text>
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
