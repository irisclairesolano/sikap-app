import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, shadows } from '../../theme';
import { useMyApplications } from '../../hooks/useMyApplications';
import { ApplicationCard } from '../../components/applications/ApplicationCard';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { JobCardSkeleton } from '../../components/common/SkeletonLoader';
import Button from '../../components/common/Button';
import { Application } from '../../types';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';

type FilterType = 'All' | 'Needs Action' | 'Active' | 'In Review' | 'History';
const FILTERS: FilterType[] = ['All', 'Needs Action', 'Active', 'In Review', 'History'];

export const MyApplicationsScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'pay'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();

  const { data, isLoading, isError, error, refetch, isRefetching } = useMyApplications('All');

  const applications = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  const matchesFilter = useCallback((app: Application, filterName: FilterType) => {
    switch (filterName) {
      case 'All':
        return true;
      case 'Needs Action':
        return app.status === 'employer_confirmed' || app.status === 'completed';
      case 'Active':
        return app.status === 'accepted' || app.status === 'hired';
      case 'In Review':
        return (
          app.status === 'pending' ||
          app.status === 'shortlisted' ||
          app.status === 'pending_negotiation' ||
          app.status === 'employer_requested'
        );
      case 'History':
        return (
          app.status === 'completed' || app.status === 'rejected' || app.status === 'withdrawn'
        );
      default:
        return true;
    }
  }, []);

  const counts = useMemo(() => {
    return {
      All: applications.length,
      'Needs Action': applications.filter(
        (a) => a.status === 'employer_confirmed' || a.status === 'completed',
      ).length,
      Active: applications.filter((a) => a.status === 'accepted' || a.status === 'hired').length,
      'In Review': applications.filter(
        (a) =>
          a.status === 'pending' ||
          a.status === 'shortlisted' ||
          a.status === 'pending_negotiation' ||
          a.status === 'employer_requested',
      ).length,
      History: applications.filter(
        (a) => a.status === 'completed' || a.status === 'rejected' || a.status === 'withdrawn',
      ).length,
    };
  }, [applications]);

  const offersWaitingCount = useMemo(() => {
    return applications.filter((a) => a.status === 'employer_confirmed').length;
  }, [applications]);

  const unratedCompletedCount = useMemo(() => {
    return applications.filter((a) => a.status === 'completed').length;
  }, [applications]);

  const filteredAndSortedApps = useMemo(() => {
    let result = applications.filter((app) => matchesFilter(app, activeFilter));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((app) => {
        const titleMatch = app.job?.title?.toLowerCase().includes(q);
        const employerMatch = app.job?.employer?.name?.toLowerCase().includes(q);
        const barangayMatch = app.job?.barangay?.toLowerCase().includes(q);
        const municipalityMatch = app.job?.municipality?.toLowerCase().includes(q);
        const categoryMatch =
          app.job?.categories?.some((c) => c.toLowerCase().includes(q)) ||
          app.job?.category?.toLowerCase().includes(q);
        return titleMatch || employerMatch || barangayMatch || municipalityMatch || categoryMatch;
      });
    }

    return result.sort((a, b) => {
      if (sortOrder === 'pay') {
        const payA = Number(a.final_agreed_price || a.job?.compensation || 0);
        const payB = Number(b.final_agreed_price || b.job?.compensation || 0);
        return payB - payA;
      }
      const timeA = new Date(a.created_at || a.applied_at || 0).getTime();
      const timeB = new Date(b.created_at || b.applied_at || 0).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [applications, activeFilter, searchQuery, sortOrder, matchesFilter]);

  const handlePressCard = useCallback(
    (application: Application) => {
      navigation.navigate('ApplicationDetail', {
        applicationId: application.id,
        jobTitle: application.job?.title || 'Job',
        employerName: application.job?.employer?.name || 'Employer',
        status: application.status,
        compensation: (application.final_agreed_price || application.job?.compensation)?.toString(),
      });
    },
    [navigation],
  );

  const handleReviewOffer = useCallback(
    (application: Application) => {
      navigation.navigate('AcceptHire', {
        id: application.id,
        jobTitle: application.job?.title || 'Job',
        employerName: application.job?.employer?.name || 'Employer',
        offeredPrice:
          application.final_agreed_price != null
            ? String(application.final_agreed_price)
            : application.job?.compensation != null
              ? String(application.job.compensation)
              : undefined,
        conversationId: application.conversation_id ?? undefined,
      });
    },
    [navigation],
  );

  const handleRateEmployer = useCallback(
    (application: Application) => {
      navigation.navigate('RateEmployer', {
        id: application.id,
        employerName: application.job?.employer?.name || 'Employer',
        jobTitle: application.job?.title || 'Job',
      });
    },
    [navigation],
  );

  const renderAppCard = useCallback(
    ({ item }: { item: Application }) => (
      <ApplicationCard
        application={item}
        onPress={() => handlePressCard(item)}
        onReviewOffer={() => handleReviewOffer(item)}
        onRateEmployer={() => handleRateEmployer(item)}
      />
    ),
    [handlePressCard, handleReviewOffer, handleRateEmployer],
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top Bar: Title + Subtitle */}
      <View style={styles.appBar}>
        <View>
          <Text style={styles.greetingSmall}>Your job journey</Text>
          <Text style={styles.headline}>My Applications</Text>
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            setSortOrder((prev) => {
              if (prev === 'desc') return 'pay';
              if (prev === 'pay') return 'asc';
              return 'desc';
            });
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              sortOrder === 'desc'
                ? 'arrow-down-outline'
                : sortOrder === 'pay'
                  ? 'cash-outline'
                  : 'arrow-up-outline'
            }
            size={16}
            color={colors.ink}
          />
          <Text style={styles.sortButtonText}>
            {sortOrder === 'desc' ? 'Newest' : sortOrder === 'pay' ? 'Highest Pay' : 'Oldest'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Urgent Action Banner (when offers are waiting or ratings pending) */}
      {offersWaitingCount > 0 ? (
        <TouchableOpacity
          style={styles.urgentBanner}
          activeOpacity={0.85}
          onPress={() => setActiveFilter('Needs Action')}
        >
          <View style={styles.urgentIconBox}>
            <Ionicons name="flash" size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.urgentTitle}>
              {offersWaitingCount === 1
                ? '1 Job Offer Waiting for You!'
                : `${offersWaitingCount} Job Offers Waiting for You!`}
            </Text>
            <Text style={styles.urgentSubtitle}>
              An employer sent you a price offer. Tap to review and accept.
            </Text>
          </View>
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>View</Text>
          </View>
        </TouchableOpacity>
      ) : unratedCompletedCount > 0 && activeFilter !== 'Needs Action' ? (
        <TouchableOpacity
          style={styles.completedNoticeBanner}
          activeOpacity={0.85}
          onPress={() => setActiveFilter('Needs Action')}
        >
          <View style={styles.completedNoticeIconBox}>
            <Ionicons name="ribbon-outline" size={18} color="#0369A1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.completedNoticeTitle}>Job Completed!</Text>
            <Text style={styles.completedNoticeSubtitle}>
              Please rate your employer to finalize the record.
            </Text>
          </View>
          <Text style={styles.completedNoticeLink}>Rate →</Text>
        </TouchableOpacity>
      ) : (
        /* Quick Summary Glance Bar */
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{counts.Active}</Text>
            <Text style={styles.summaryLabel}>Active Hired</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{counts['In Review']}</Text>
            <Text style={styles.summaryLabel}>In Review</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{counts.History}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.inkMuted}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search job title, employer, location..."
          placeholderTextColor={colors.inkLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs / Buckets */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {FILTERS.map((filter) => {
          const count = counts[filter];
          const isSelected = activeFilter === filter;
          const isNeedsAction = filter === 'Needs Action' && count > 0;

          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.chip,
                isSelected && styles.chipActive,
                isNeedsAction && !isSelected && styles.chipNeedsAction,
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              {isNeedsAction && <View style={styles.redDot} />}
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive,
                  isNeedsAction && !isSelected && styles.chipTextNeedsAction,
                ]}
              >
                {filter} · <Text style={styles.chipCount}>{count}</Text>
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => {
    let emptyTitle = `No ${activeFilter.toLowerCase()} applications.`;
    let emptySubtitle = 'Applications matching this filter will appear here.';
    let showBrowseButton = false;

    if (searchQuery.trim()) {
      emptyTitle = 'No matching applications';
      emptySubtitle = `No applications found matching "${searchQuery}".`;
    } else if (activeFilter === 'Needs Action') {
      emptyTitle = 'All caught up!';
      emptySubtitle = 'You have no pending job offers or reviews to complete right now.';
    } else if (activeFilter === 'Active') {
      emptyTitle = 'No active jobs right now';
      emptySubtitle = 'Once an employer confirms your hire, your active jobs will appear here.';
      showBrowseButton = true;
    } else if (activeFilter === 'In Review') {
      emptyTitle = 'No applications under review';
      emptySubtitle = 'Explore jobs and submit applications to local employers in Bulan.';
      showBrowseButton = true;
    } else if (activeFilter === 'All') {
      emptyTitle = "You haven't applied to any jobs yet";
      emptySubtitle = 'Explore local work opportunities and apply in just a few taps.';
      showBrowseButton = true;
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name={
              activeFilter === 'Needs Action'
                ? 'checkmark-done-outline'
                : activeFilter === 'Active'
                  ? 'briefcase-outline'
                  : 'document-text-outline'
            }
            size={36}
            color={colors.inkMuted}
          />
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>

        {showBrowseButton && (
          <Button
            label="Browse Available Jobs"
            variant="primary"
            size="base"
            onPress={() => (navigation as any).navigate('Find')}
            style={styles.emptyButton}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {renderHeader()}

      {isError && (
        <View style={styles.errorContainer}>
          <ErrorBanner message={error?.message || 'Failed to load applications.'} />
        </View>
      )}

      {isLoading && !isRefetching ? (
        <View style={{ paddingHorizontal: 20 }}>
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedApps}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAppCard}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
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
          ListEmptyComponent={renderEmptyState}
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
    paddingBottom: 10,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingSmall: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 100,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  sortButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 14,
    ...shadows.sm,
  },
  urgentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.white,
  },
  urgentSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    lineHeight: 16,
  },
  urgentBadge: {
    backgroundColor: colors.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  urgentBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#E11D48',
  },
  completedNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  completedNoticeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedNoticeTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#0369A1',
  },
  completedNoticeSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#0284C7',
    marginTop: 1,
  },
  completedNoticeLink: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#0369A1',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: fonts.numericBold,
    fontSize: 18,
    color: colors.ink,
    lineHeight: 22,
  },
  summaryLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.inkFaint,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    paddingVertical: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.paperBright,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipNeedsAction: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
    marginRight: 6,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  chipTextActive: {
    color: colors.white,
  },
  chipTextNeedsAction: {
    color: '#E11D48',
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
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.paperCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 20,
  },
});

export default MyApplicationsScreen;
