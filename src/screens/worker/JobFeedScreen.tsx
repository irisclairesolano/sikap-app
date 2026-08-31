import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuthCheck } from '../../hooks/useAuthCheck';
import { JobCardSkeleton } from '../../components/common/SkeletonLoader';

const CATEGORIES = [
  'All',
  'Construction',
  'Domestic',
  'Agriculture',
  'Skilled Trade',
  'Transport',
  'Craft',
];

const LOCATIONS = ['Anywhere', 'Same Barangay', 'Same Municipality'];

export const JobFeedScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const [activeCategory, setActiveCategory] = useState('All');
  const [locationFilter, setLocationFilter] = useState('Anywhere');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const { user } = useAuthCheck();
  const workerProfile = user?.worker_profile || user?.workerProfile;
  const userSkills = useMemo(() => {
    const skills = workerProfile?.skills || [];
    return Array.from(new Set(skills.map((s) => s.name)));
  }, [workerProfile]);

  const feedCategories = useMemo(() => {
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

  const jobsList = data?.data || [];

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
    [handleJobPress, isSaved, toggleSave],
  );

  const getInitial = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : 'M';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          {user?.avatar_url ? (
            <Image
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
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={[styles.searchIcon, { marginRight: 8 }]}
            />
          ) : (
            <Ionicons name="search" size={20} color={colors.inkMuted} style={styles.searchIcon} />
          )}
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
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
        <Text style={styles.count}>{jobsList.length}</Text> jobs{' '}
        <Text style={styles.accent}>nearby.</Text>
      </Text>

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
              <Text style={[styles.chipText, activeCategory === category && styles.chipTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={isLoading ? [1, 2, 3] : isError ? [] : jobsList}
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
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          isError ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
              <ErrorBanner message={error?.message || 'Failed to load jobs.'} />
            </View>
          ) : (
            <EmptyState message={`No jobs found for ${activeCategory}.`} />
          )
        }
        contentContainerStyle={styles.listContent}
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={isFilterModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Location</Text>
            {LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={styles.modalOption}
                onPress={() => {
                  setLocationFilter(loc);
                  setFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    locationFilter === loc && styles.modalOptionActive,
                  ]}
                >
                  {loc}
                </Text>
                {locationFilter === loc && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    height: 52, // Made taller to prevent overlapping
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
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
    height: 52, // Made taller to match
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.inkFaint,
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
    paddingRight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: fonts.h3,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 16,
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
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.paperCream,
    borderRadius: 12,
  },
  modalCloseText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
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
