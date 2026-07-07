import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { useSavedJobs, useToggleSaveJob } from '../../hooks/useSavedJobs';
import { JobCard } from '../../components/jobs/JobCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';

export const SavedJobsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const { data, isLoading, isError, error, refetch } = useSavedJobs();
  const { mutate: toggleSave } = useToggleSaveJob();

  const handleJobPress = (id: number) => {
    navigation.navigate('JobDetails', { id });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headline}>Saved Jobs</Text>
      <Text style={styles.subtitle}>Jobs you've bookmarked for later.</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <ErrorBanner message={error?.message || 'Failed to load saved jobs.'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={data?.data || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => handleJobPress(item.id)}
            isSaved={true}
            onSave={() => toggleSave(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState message="You haven't saved any jobs yet." />}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.5,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
    marginTop: 4,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
