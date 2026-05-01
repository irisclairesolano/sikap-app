import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

export type WorkerStackParamList = {
  Home: undefined;
  JobDetails: { id: number };
  Apply: { id: number };
  ApplicationDetail: { id: number };
  AcceptHire: { id: number };
  HireReceipt: { id: number };
  RateEmployer: { id: number };
  Report: { id: number };
  EditProfile: undefined;
  Settings: undefined;
  Reviews: undefined;
  WorkHistory: undefined;
  AddWorkHistory: undefined;
  CharacterReferences: undefined;
};

export type WorkerTabParamList = {
  Home: undefined;
  Search: undefined;
  Applications: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<WorkerTabParamList>();
const Stack = createNativeStackNavigator<WorkerStackParamList>();

// Home Stack
const HomeStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    <Stack.Screen name="Apply" component={ApplyScreen} />
    <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
    <Stack.Screen name="AcceptHire" component={AcceptHireScreen} />
    <Stack.Screen name="HireReceipt" component={HireReceiptScreen} />
    <Stack.Screen name="RateEmployer" component={RateEmployerScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
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
    <Stack.Screen name="Applications" component={ApplicationsScreen} />
    <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
    <Stack.Screen name="AcceptHire" component={AcceptHireScreen} />
    <Stack.Screen name="HireReceipt" component={HireReceiptScreen} />
    <Stack.Screen name="RateEmployer" component={RateEmployerScreen} />
    <Stack.Screen name="Report" component={ReportScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Reviews" component={ReviewsScreen} />
    <Stack.Screen name="WorkHistory" component={WorkHistoryScreen} />
    <Stack.Screen name="AddWorkHistory" component={AddWorkHistoryScreen} />
    <Stack.Screen name="CharacterReferences" component={CharacterReferencesScreen} />
  </Stack.Navigator>
);

const WorkerNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Applications') {
            iconName = focused ? 'document-text' : 'document-text-outline';
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
      <Tab.Screen name="Search" component={SearchStack} />
      <Tab.Screen name="Applications" component={ApplicationsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

// Placeholder screens
const HomeScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Home Feed</Text>
  </View>
);

const SearchScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Job Search</Text>
  </View>
);

const ApplicationsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>My Applications</Text>
  </View>
);

const ProfileScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Worker Profile</Text>
  </View>
);

const JobDetailsScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Job Details</Text>
  </View>
);

const ApplyScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Apply for Job</Text>
  </View>
);

const ApplicationDetailScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Application Detail</Text>
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

const RateEmployerScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Rate Employer</Text>
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

const WorkHistoryScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Work History</Text>
  </View>
);

const AddWorkHistoryScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Add Work History</Text>
  </View>
);

const CharacterReferencesScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Character References</Text>
  </View>
);

export default WorkerNavigator;
