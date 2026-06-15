import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import { useMyApplications } from '../../hooks/useMyApplications';
import { ApplicationCard } from '../../components/applications/ApplicationCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { Application } from '../../types';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';

const FILTERS = ['Active', 'Pending', 'Completed'];

export const MyApplicationsScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('Active');
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useMyApplications('All'); // Fetch all, we'll filter client-side for simplicity right now

  const applications = data?.pages.flatMap((page) => page.data) || [];

  const filteredApps = applications.filter((app) => {
    if (activeFilter === 'Active') return app.status === 'accepted';
    if (activeFilter === 'Pending') return app.status === 'pending' || app.status === 'employer_confirmed';
    if (activeFilter === 'Completed') return app.status === 'completed' || app.status === 'rejected' || app.status === 'withdrawn';
    return true;
  });

  const getCount = (filterName: string) => {
    return applications.filter((app) => {
      if (filterName === 'Active') return app.status === 'accepted';
      if (filterName === 'Pending') return app.status === 'pending' || app.status === 'employer_confirmed';
      if (filterName === 'Completed') return app.status === 'completed' || app.status === 'rejected' || app.status === 'withdrawn';
      return true;
    }).length;
  };

  const handlePressCard = (application: Application) => {
    navigation.navigate('ApplicationDetail', { 
      applicationId: application.id,
      jobTitle: application.job?.title || 'Unknown Job',
      employerName: application.job?.employer?.name || 'Unknown Employer',
      status: application.status,
      compensation: application.final_agreed_price?.toString()
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.appBar}>
        <View>
          <Text style={styles.greetingSmall}>Your jobs</Text>
          <Text style={styles.headline}>My Applications</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="filter-outline" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.chip, activeFilter === filter && styles.chipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.chipText, activeFilter === filter && styles.chipTextActive]}>
              {filter} · <Text style={styles.chipCount}>{getCount(filter)}</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {renderHeader()}

      {isError && (
        <View style={styles.errorContainer}>
          <ErrorBanner message={error?.message || 'Failed to load applications.'} />
        </View>
      )}

      {isLoading && !isRefetching ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ApplicationCard application={item} onPress={() => handlePressCard(item)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} applications.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingSmall: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.6,
    paddingBottom: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: colors.ink,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  chipTextActive: {
    color: colors.white,
  },
  chipCount: {
    fontFamily: fonts.numericBold,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  errorContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
  },
});
