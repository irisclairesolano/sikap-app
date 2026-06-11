import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

export type WorkerStackParamList = {
  Home: undefined;
  HomeEmpty: undefined;
  AddSkills: undefined;
  AddWorkHistory: undefined;
  AddCharacterReferences: undefined;
  Search: undefined;
  Applications: undefined;
  Profile: undefined;
  JobDetails: { id: number };
  Apply: { id: number };
  ApplicationDetail: { applicationId: number; jobTitle: string; employerName: string; status: string; compensation?: string };
  AcceptHire: { id: number };
  HireReceipt: { id: number };
  RateEmployer: { id: number };
  Report: { id: number };
  EditProfile: undefined;
  Settings: undefined;
  Reviews: undefined;
  Notifications: undefined;
  WorkHistory: undefined;
  CharacterReferences: undefined;
};

export type WorkerTabParamList = {
  Find: undefined;
  Mine: undefined;
  Saved: undefined;
  Me: undefined;
};

const Tab = createBottomTabNavigator<WorkerTabParamList>();
const Stack = createNativeStackNavigator<WorkerStackParamList>();

import { JobFeedScreen } from '../screens/worker/JobFeedScreen';
import { JobDetailsScreen } from '../screens/worker/JobDetailsScreen';
import { ApplyScreen } from '../screens/worker/ApplyScreen';
import { MyApplicationsScreen } from '../screens/worker/MyApplicationsScreen';
import { HomeEmptyScreen } from '../screens/worker/HomeEmptyScreen';
import { AddSkillsScreen } from '../screens/worker/AddSkillsScreen';
import { AddWorkHistoryScreen } from '../screens/worker/AddWorkHistoryScreen';
import { AddCharacterReferencesScreen } from '../screens/worker/AddCharacterReferencesScreen';
import ApplicationDetailScreen from '../screens/worker/ApplicationDetailScreen';
import ProfileScreen from '../screens/worker/ProfileScreen';
import ReviewsScreen from '../screens/worker/ReviewsScreen';
import NotificationsScreen from '../screens/worker/NotificationsScreen';
import RateEmployerScreen from '../screens/worker/RateEmployerScreen';

// Home Stack
const FindStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={JobFeedScreen} />
    <Stack.Screen name="HomeEmpty" component={HomeEmptyScreen} />
    <Stack.Screen name="AddSkills" component={AddSkillsScreen} />
    <Stack.Screen name="AddWorkHistory" component={AddWorkHistoryScreen} />
    <Stack.Screen name="AddCharacterReferences" component={AddCharacterReferencesScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="Apply" component={ApplyScreen} />
    <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
    <Stack.Screen name="AcceptHire" component={AcceptHireScreen} />
    <Stack.Screen name="HireReceipt" component={HireReceiptScreen} />
    <Stack.Screen name="RateEmployer" component={RateEmployerScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

// Search Stack
const SearchStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Search" component={SearchScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="Apply" component={ApplyScreen} />
  </Stack.Navigator>
);

// Applications Stack
const ApplicationsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Applications" component={MyApplicationsScreen} />
    <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
    <Stack.Screen name="AcceptHire" component={AcceptHireScreen} />
    <Stack.Screen name="HireReceipt" component={HireReceiptScreen} />
    <Stack.Screen name="RateEmployer" component={RateEmployerScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
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
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="WorkHistory" component={WorkHistoryScreen} />
    <Stack.Screen name="AddWorkHistory" component={AddWorkHistoryScreen} />
    <Stack.Screen name="CharacterReferences" component={AddCharacterReferencesScreen} />
  </Stack.Navigator>
);

const WorkerNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Find') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Mine') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Me') {
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
      <Tab.Screen name="Find" component={FindStack} />
      <Tab.Screen name="Mine" component={ApplicationsStack} />
      <Tab.Screen name="Saved" component={SearchStack} />
      <Tab.Screen name="Me" component={ProfileStack} />
    </Tab.Navigator>
  );
};

// Placeholder screens

const SearchScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Job Search</Text>
  </View>
);

const AcceptHireScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Accept Hire</Text>
  </View>
);

const HireReceiptScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Hire Receipt</Text>
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

const WorkHistoryScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Work History</Text>
  </View>
);

export default WorkerNavigator;
