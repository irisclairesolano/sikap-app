/**
 * ============================================================================
 * SCREEN: Worker Home / Job Feed Screen (src/screens/worker/JobFeedScreen.tsx)
 *         (Mounted as the `Home` route inside `WorkerNavigator`)
 * ============================================================================
 *
 * (a) Screen / Module Role in the SIKAP Mobile App:
 *     Serves as the primary discovery hub ("Home" tab) for verified Workers in
 *     Sorsogon. Displays open blue-collar and informal-sector job opportunities
 *     with personalized skill-tag matching, debounced keyword search, bookmarking,
 *     and Barangay/Municipality geographic proximity filtering.
 *
 * (b) Key State & Hooks Used:
 *     - `searchInput` & `searchQuery`: Controlled input paired with a 300ms
 *       debounce timer to prevent excessive API queries while typing.
 *     - `activeCategory`: Tracks the selected horizontal skill/category chip
 *       (dynamically populated from the worker's own profile skills).
 *     - `locationFilter`: Controls hyper-local geographic scoping
 *       (`Anywhere`, `Same Barangay`, or `Same Municipality`).
 *     - `useJobs(filters)`: React Query hook fetching filtered job listings.
 *     - `useSavedJobs()` / `useToggleSaveJob()`: Manages optimistic bookmarking.
 *
 * (c) UI <-> React Query <-> Pusher WebSockets <-> Laravel REST API Data Flow:
 *     1. Filter Computation: Changes to `searchQuery`, `activeCategory`, or
 *        `locationFilter` recompute the memoized `filters` object.
 *     2. Query Cache & API Fetch: `useJobs(filters)` uses `['jobs', filters]`
 *        as its React Query key and sends `GET /api/v1/jobs` with query params
 *        (`search`, `category`, `skills[]`, `barangay`, `municipality`) to the
 *        Laravel REST API.
 *     3. Client-Side Chronological Guarantee: `jobsList` normalizes paginated
 *        or flat API payloads and sorts by `created_at` descending so newly
 *        published jobs always appear at the top of the feed.
 * ============================================================================
 */
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { useJobs } from '../../hooks/useJobs';
import { useSavedJobs, useToggleSaveJob } from '../../hooks/useSavedJobs';
import { JobCard } from '../../components/jobs/JobCard';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuthCheck } from '../../hooks/useAuthCheck';
import { JobCardSkeleton } from '../../components/common/SkeletonLoader';
import { useLanguage } from '../../contexts/LanguageContext';
import { TutorialTarget } from '../../components/tutorial/TutorialTarget';
import { useTriggerInitialTutorial } from '../../hooks/useTriggerInitialTutorial';

import { TranslationKey } from '../../locales/en';

const CATEGORIES = [
  'All',
  'Construction',
  'Domestic',
  'Agriculture',
  'Skilled Trade',
  'Transport',
  'Craft',
];

const LOCATIONS: { key: string; labelKey: TranslationKey }[] = [
  { key: 'Anywhere', labelKey: 'location_anywhere' },
  { key: 'Same Barangay', labelKey: 'location_same_barangay' },
  { key: 'Same Municipality', labelKey: 'location_same_municipality' },
];

export const JobFeedScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('All');
  const [locationFilter, setLocationFilter] = useState('Anywhere');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  // Debounce search input to avoid spamming the backend API
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ==========================================================================
  // PERSONALIZED SKILL CHIPS & BARANGAY / MUNICIPALITY PROXIMITY FILTERING
  // ==========================================================================
  // 1. Dynamic Skill Chips: Extracts the worker's registered skills from their
  //    profile (`user.worker_profile.skills`). If present, the horizontal filter
  //    bar prioritizes their actual trade skills; otherwise falls back to
  //    standard blue-collar `CATEGORIES`.
  // 2. Geographic Proximity Scoping: Maps the selected `locationFilter` option
  //    directly to the worker's verified residence (`user.barangay` or
  //    `user.municipality`), enabling hyper-local job matching that minimizes
  //    commute costs for daily-wage workers.
  // ==========================================================================
  const { user } = useAuthCheck();
  const workerProfile = user?.worker_profile;
  const userSkills: string[] = useMemo(() => {
    const skills = workerProfile?.skills || [];
    return Array.from(new Set(skills.map((s: any) => s.name)));
  }, [workerProfile]);

  const feedCategories: string[] = useMemo(() => {
    if (userSkills.length > 0) {
      return ['All', ...userSkills];
    }
    return CATEGORIES;
  }, [userSkills]);

  const filters = useMemo(() => {
    const isSearching = !!searchQuery;
    let skillsParam: string[] | undefined = undefined;
    let categoryParam: string | undefined = undefined;

    if (activeCategory !== 'All') {
      if (userSkills.length > 0 && !isSearching) {
        skillsParam = [activeCategory];
      } else {
        categoryParam = activeCategory;
      }
    }

    return {
      search: searchQuery || undefined,
      category: categoryParam,
      skills: skillsParam,
      barangay: locationFilter === 'Same Barangay' ? user?.barangay : undefined,
      municipality: locationFilter === 'Same Municipality' ? user?.municipality : undefined,
    };
  }, [searchQuery, activeCategory, locationFilter, user, userSkills]);

  const { data, isLoading, isError, error, refetch, isFetching } = useJobs(filters);
  const { data: savedJobsData } = useSavedJobs();
  const { mutate: toggleSave } = useToggleSaveJob();

  useTriggerInitialTutorial({
    user,
    role: 'worker',
    isScreenReady: !isLoading,
  });

  // Normalize paginated or flat API responses and enforce newest-first ordering
  const jobsList = useMemo(() => {
    if (!data) return [];
    let list: any[] = [];
    if (Array.isArray((data as any).pages)) {
      list = (data as any).pages.flatMap((page: any) => page?.data || []);
    } else if (Array.isArray((data as any).data)) {
      list = (data as any).data;
    } else if (Array.isArray(data)) {
      list = data as any[];
    }
    // Strictly guarantee newest jobs (latest created_at / highest ID) appear first
    return [...list].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.id || 0) - (a.id || 0);
    });
  }, [data]);

  const isSaved = useCallback(
    (id: number) => {
      return savedJobsData?.data?.some((job) => job.id === id) || false;
    },
    [savedJobsData],
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
        isSaved={isSaved(item.id)}
        onSave={() => toggleSave(item.id)}
      />
    ),
    [handleJobPress, isSaved, toggleSave, language],
  );

  const getInitial = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : 'M';
  };

  const headerComponent = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            {user?.avatar_url ? (
              <Image
                cachePolicy="memory-disk"
                priority="high"
                transition={150}
                source={{
                  uri: user.avatar_url.startsWith('http')
                    ? user.avatar_url
                    : `${process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '')}${user.avatar_url}`,
                }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitial(user?.name || 'Worker')}</Text>
              </View>
            )}
            <View>
              <Text style={styles.greetingSmall}>Hi,</Text>
              <Text style={styles.greetingName}>
                {user?.name ? user.name.split(' ')[0] : 'Worker'}
              </Text>
            </View>
          </View>
          <View style={styles.appBarRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => (navigation as any).navigate('SavedJobs')}
            >
              <Ionicons name="bookmark-outline" size={24} color={colors.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => (navigation as any).navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        <TutorialTarget id="worker_search_filter">
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={[styles.searchIcon, { marginRight: 8 }]}
                />
              ) : (
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.inkMuted}
                  style={styles.searchIcon}
                />
              )}
              <TextInput
                style={styles.searchInput}
                placeholder={t('search_jobs_placeholder')}
                placeholderTextColor={colors.inkMuted}
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={() => setSearchQuery(searchInput)}
                returnKeyType="search"
              />
              {searchInput.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchInput('');
                    setSearchQuery('');
                  }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
              <Ionicons name="options-outline" size={24} color={colors.ink} />
              {locationFilter !== 'Anywhere' && <View style={styles.filterActiveDot} />}
            </TouchableOpacity>
          </View>

          <Text style={styles.headline}>
            <Text style={styles.count}>{jobsList.length}</Text> {t('jobs_nearby')}
          </Text>
        </TutorialTarget>

        <TutorialTarget id="worker_skill_chips" style={{ marginTop: 12 }}>
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {feedCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.chip, activeCategory === category && styles.chipActive]}
                  onPress={() => setActiveCategory(category)}
                >
                  <Text
                    style={[styles.chipText, activeCategory === category && styles.chipTextActive]}
                  >
                    {category === 'All' ? t('all') : category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TutorialTarget>
      </View>
    ),
    [
      user,
      isLoading,
      searchInput,
      locationFilter,
      jobsList.length,
      feedCategories,
      activeCategory,
      navigation,
      t,
    ],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={isLoading ? [1, 2, 3] : isError ? [] : jobsList}
        extraData={language}
        keyExtractor={(item, index) =>
          isLoading ? `skeleton_${index}` : isError ? 'error' : item.id.toString()
        }
        renderItem={({ item }) => {
          if (isLoading) {
            return (
              <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                <JobCardSkeleton />
              </View>
            );
          }
          return renderJobItem({ item });
        }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={
          isError ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
              <ErrorBanner message={error?.message || 'Failed to load jobs.'} />
            </View>
          ) : (
            <EmptyState
              icon="briefcase-outline"
              title={t('no_jobs_found')}
              subtitle={
                activeCategory !== 'All'
                  ? searchQuery
                    ? `No jobs found for "${searchQuery}" in ${activeCategory}.`
                    : `No jobs found for "${activeCategory}".`
                  : searchQuery || locationFilter !== 'Anywhere'
                    ? `No jobs found for "${searchQuery}". Try resetting your filters.`
                    : 'No available jobs at the moment. Pull down to refresh or check back later.'
              }
              actionLabel={
                activeCategory === 'All' && (searchQuery || locationFilter !== 'Anywhere')
                  ? t('reset_filters')
                  : undefined
              }
              onAction={
                activeCategory === 'All' && (searchQuery || locationFilter !== 'Anywhere')
                  ? () => {
                      setLocationFilter('Anywhere');
                      setSearchInput('');
                      setSearchQuery('');
                    }
                  : undefined
              }
            />
          )
        }
        contentContainerStyle={styles.listContent}
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <Pressable
            style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {t('filter')} - {t('location')}
              </Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.modalHeaderCloseBtn}
                accessibilityLabel="Close filter"
              >
                <Ionicons name="close" size={20} color={colors.inkSoft} />
              </TouchableOpacity>
            </View>
            {LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.key}
                style={styles.modalOption}
                onPress={() => {
                  setLocationFilter(loc.key);
                  setFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    locationFilter === loc.key && styles.modalOptionActive,
                  ]}
                >
                  {t(loc.labelKey)}
                </Text>
                {locationFilter === loc.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              activeOpacity={0.8}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t('close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inkFaint,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  filterActiveDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 8,
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
    paddingRight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.60)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inkFaint,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalHeaderCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  modalOptionText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.inkSoft,
  },
  modalOptionActive: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  modalCloseBtn: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCloseText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
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
