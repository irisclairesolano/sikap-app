import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { useJobs } from '../../hooks/useJobs';
import { JobCard } from '../../components/jobs/JobCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';

const CATEGORIES = ['All', 'Construction', 'Domestic', 'Agriculture', 'Skilled Trade', 'Transport', 'Craft'];

export const JobFeedScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const [activeCategory, setActiveCategory] = useState('All');
  const { user } = useAuth();
  
  const { data, isLoading, isError, error, refetch } = useJobs();

  const filteredJobs = useMemo(() => {
    if (!data?.data) return [];
    if (activeCategory === 'All') return data.data;
    return data.data.filter(job => job.category === activeCategory);
  }, [data, activeCategory]);

  const handleJobPress = (id: number) => {
    navigation.navigate('JobDetails', { id });
  };

  const getInitial = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : 'M';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(user?.name || 'Worker')}</Text>
          </View>
          <View>
            <Text style={styles.greetingSmall}>Hi,</Text>
            <Text style={styles.greetingName}>{user?.name ? user.name.split(' ')[0] : 'Worker'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <Text style={styles.headline}>
        <Text style={styles.count}>{filteredJobs.length}</Text> jobs <Text style={styles.accent}>nearby.</Text>
      </Text>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map(category => (
            <TouchableOpacity 
              key={category}
              style={[styles.chip, activeCategory === category && styles.chipActive]}
              onPress={() => setActiveCategory(category)}
            >
              <Text style={[styles.chipText, activeCategory === category && styles.chipTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
        <ErrorBanner message={error?.message || 'Failed to load jobs.'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredJobs}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => handleJobPress(item.id)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState message={`No jobs found for ${activeCategory}.`} />}
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
    paddingTop: 12,
    paddingBottom: 16,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  greetingSmall: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  greetingName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -0.8,
    paddingBottom: 4,
  },
  count: {
    fontFamily: fonts.numericBold,
    color: colors.ink,
  },
  accent: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  filterContainer: {
    marginHorizontal: -20, // bleed out to edges
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.white,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
