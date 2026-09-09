import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { colors, fonts } from '../theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import { useNotifications } from '../hooks/useNotifications';

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
import EditProfileScreen from '../screens/common/EditProfileScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import ReportScreen from '../screens/common/ReportScreen';
import RoleOnboardingScreen from '../screens/common/RoleOnboardingScreen';
import { SavedJobsScreen } from '../screens/worker/SavedJobsScreen';
import AcceptHireScreen from '../screens/worker/AcceptHireScreen';
import EmployerPublicProfileScreen from '../screens/worker/EmployerPublicProfileScreen';

import { useUnreadMessageCount } from '../hooks/useConversations';
import ConversationsListScreen from '../screens/messages/ConversationsListScreen';
import ChatScreen from '../screens/messages/ChatScreen';

export type WorkerStackParamList = {
  Home: undefined;
  HomeEmpty: undefined;
  AddSkills: undefined;
  AddWorkHistory: undefined;
  AddCharacterReferences: undefined;
  SavedJobs: undefined;
  Applications: undefined;
  ProfileMain: undefined;
  JobDetails: { id: number };
  Apply: { id: number };
  EmployerPublicProfile: {
    employerId?: number;
    employerName?: string;
    avatarUrl?: string;
    verificationBadge?: boolean;
    reputationScore?: number;
    barangay?: string;
    municipality?: string;
    businessDocuments?: string[];
  };
  ApplicationDetail: {
    applicationId: number;
    jobTitle?: string;
    employerName?: string;
    status?: string;
    compensation?: string;
  };
  AcceptHire: { id: number; jobTitle: string; employerName: string; offeredPrice?: string };
  HireReceipt: { id: number };
  RateEmployer: { id: number; employerName: string; jobTitle: string };
  Report: { id: number };
  EditProfile: undefined;
  Settings: undefined;
  NotificationsList: undefined;
  Notifications?: undefined;
  RoleOnboarding: { targetRole: 'worker' | 'employer' };
  WorkHistory: undefined;
  CharacterReferences: undefined;
  Reviews: undefined;
  Messages: undefined;
  ConversationsList: undefined;
  Chat: { conversationId: number; jobTitle?: string; otherUserName?: string };
};

export type WorkerTabParamList = {
  Find: undefined;
  Mine: undefined;
  Messages: undefined;
  Saved: undefined;
  Notifications: undefined;
  Me: undefined;
};

const Tab = createBottomTabNavigator<WorkerTabParamList>();
const Stack = createNativeStackNavigator<WorkerStackParamList>();

// Messages Stack
const MessagesStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

// Home Stack
const FindStack: React.FC = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

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
          Loading your profile...
        </Text>
      </View>
    );
  }

  const hasSkills = (profile?.worker_profile?.skills?.length || 0) > 0;
  const hasHistory = (profile?.worker_profile?.experiences?.length || 0) > 0;
  const hasRefs = (profile?.worker_profile?.references?.length || 0) > 0;
  const isProfileComplete = hasSkills && hasHistory && hasRefs;

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isProfileComplete ? 'Home' : 'HomeEmpty'}
    >
      <Stack.Screen name="HomeEmpty" component={HomeEmptyScreen} />
      <Stack.Screen name="Home" component={JobFeedScreen} />
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
      <Stack.Screen name="EmployerPublicProfile" component={EmployerPublicProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
};

// Saved Stack
const SavedStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SavedJobs" component={SavedJobsScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="Apply" component={ApplyScreen} />
    <Stack.Screen name="EmployerPublicProfile" component={EmployerPublicProfileScreen} />
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
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="Apply" component={ApplyScreen} />
    <Stack.Screen name="EmployerPublicProfile" component={EmployerPublicProfileScreen} />
  </Stack.Navigator>
);

// Notifications Stack
const NotificationsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotificationsList" component={NotificationsScreen} />
    <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="Apply" component={ApplyScreen} />
    <Stack.Screen name="AcceptHire" component={AcceptHireScreen} />
    <Stack.Screen name="HireReceipt" component={HireReceiptScreen} />
    <Stack.Screen name="RateEmployer" component={RateEmployerScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
    <Stack.Screen name="EmployerPublicProfile" component={EmployerPublicProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Reviews" component={ReviewsScreen} />
    <Stack.Screen name="WorkHistory" component={WorkHistoryScreen} />
    <Stack.Screen name="AddWorkHistory" component={AddWorkHistoryScreen} />
    <Stack.Screen name="CharacterReferences" component={AddCharacterReferencesScreen} />
    <Stack.Screen name="RoleOnboarding" component={RoleOnboardingScreen} />
  </Stack.Navigator>
);

const WorkerNavigator: React.FC = () => {
  const { data } = useNotifications();
  const unreadCount = data?.unread_count || 0;
  const { data: unreadMessages } = useUnreadMessageCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Find') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Mine') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
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
      <Tab.Screen
        name="Find"
        component={FindStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            (navigation as any).navigate('Find', { screen: 'Home' });
          },
        })}
      />
      <Tab.Screen
        name="Mine"
        component={ApplicationsStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            (navigation as any).navigate('Mine', { screen: 'Applications' });
          },
        })}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarBadge: (unreadMessages ?? 0) > 0 ? unreadMessages : undefined,
          tabBarBadgeStyle: { backgroundColor: '#DC2626', color: colors.white },
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            (navigation as any).navigate('Messages', { screen: 'ConversationsList' });
          },
        })}
      />
      <Tab.Screen
        name="Saved"
        component={SavedStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            (navigation as any).navigate('Saved', { screen: 'SavedJobs' });
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
            (navigation as any).navigate('Notifications', { screen: 'NotificationsList' });
          },
        })}
      />
      <Tab.Screen
        name="Me"
        component={ProfileStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            (navigation as any).navigate('Me', { screen: 'ProfileMain' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

const WorkHistoryScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Work History</Text>
  </View>
);

const HireReceiptScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Hire Receipt</Text>
  </View>
);

export default WorkerNavigator;
