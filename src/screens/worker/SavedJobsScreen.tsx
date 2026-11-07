import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { useSavedJobs, useToggleSaveJob } from '../../hooks/useSavedJobs';
import { JobCard } from '../../components/jobs/JobCard';
import { JobCardSkeleton } from '../../components/common/SkeletonLoader';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { useLanguage } from '../../contexts/LanguageContext';

export const SavedJobsScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const { data, isLoading, isError, error, refetch, isFetching } = useSavedJobs();
  const { mutate: toggleSave } = useToggleSaveJob();
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleJobPress = useCallback(
    (id: number) => {
      navigation.navigate('JobDetails', { id });
    },
    [navigation],
  );

  const renderJobItem = useCallback(
    ({ item }: { item: any }) => (
      <JobCard
        job={item}
        onPress={() => handleJobPress(item.id)}
        isSaved={true}
        onSave={() => toggleSave(item.id)}
      />
    ),
    [handleJobPress, toggleSave],
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {navigation.canGoBack() && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
      )}
      <View style={styles.headerTopRow}>
        <Text style={styles.headline} numberOfLines={1} adjustsFontSizeToFit>
          {t('saved_jobs')}
        </Text>
        <TouchableOpacity
          style={styles.sortPill}
          onPress={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.sortPillText}>
            {sortOrder === 'desc' ? t('my_apps_sort_newest') : t('my_apps_sort_oldest')}
          </Text>
          <Ionicons
            name={sortOrder === 'desc' ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={16}
            color={colors.ink}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>{t('saved_jobs_subtitle')}</Text>
    </View>
  );

  const jobsList = [...(data?.data || [])].sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={{ paddingHorizontal: 20 }}>
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <ErrorBanner message={error?.message || t('saved_jobs_load_error')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={jobsList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderJobItem}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title={t('saved_jobs_empty_title')}
            subtitle={t('saved_jobs_empty_sub')}
            actionLabel={t('saved_jobs_browse_btn')}
            onAction={() => navigation.navigate('Home')}
          />
        }
        contentContainerStyle={styles.listContent}
        refreshing={isFetching && !isLoading}
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
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  headline: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.paperBright,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    flexShrink: 0,
  },
  sortPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
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
