import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import { JobCardSkeleton } from '../../components/common/SkeletonLoader';
import { formatRateUnit, getCategoryStyles, getRelativeTime } from '../../components/jobs/JobCard';
import { useAlert } from '../../contexts/AlertContext';
import {
  useArchivedJobs,
  useDeleteJob,
  useEmployerJobs,
  useRestoreJob,
} from '../../hooks/useEmployerJobs';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts } from '../../theme';
import { JobPost } from '../../types';

type MyJobsNavigationProp = NativeStackNavigationProp<EmployerStackParamList, 'MyJobs'>;

const formatCompensation = (amount: number | string | undefined | null): string => {
  if (amount == null) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return String(amount);
  return num.toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const MyJobsScreen: React.FC = () => {
  const navigation = useNavigation<MyJobsNavigationProp>();
  const route = useRoute<any>();
  const [activeTab, setActiveTab] = useState<'Active' | 'Past' | 'Archived'>('Active');
  const [refreshing, setRefreshing] = useState(false);
  const { showAlert } = useAlert();

  const [menuJob, setMenuJob] = useState<JobPost | null>(null);

  const {
    data: jobsResponse,
    isLoading: isJobsLoading,
    isError: isJobsError,
    refetch: refetchJobs,
  } = useEmployerJobs();
  const {
    data: archivedResponse,
    isLoading: isArchivedLoading,
    isError: isArchivedError,
    refetch: refetchArchived,
  } = useArchivedJobs();
  const { mutate: restoreJob, isPending: isRestoring } = useRestoreJob();
  const { mutate: deleteJob, isPending: isDeleting } = useDeleteJob();

  const handleArchiveJob = useCallback(
    (job: JobPost) => {
      showAlert(
        'Archive Job Post',
        `Are you sure you want to archive "${job.title}"? You can restore it later from the Archived tab.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive',
            style: 'destructive',
            onPress: () => {
              deleteJob(job.id, {
                onSuccess: () => {
                  showAlert('Archived', 'Job post moved to archive.');
                },
                onError: (err: any) => {
                  showAlert('Error', err.message || 'Could not archive job.');
                },
              });
            },
          },
        ],
      );
    },
    [deleteJob, showAlert],
  );

  const handleRestoreJob = useCallback(
    (jobId: number) => {
      restoreJob(jobId, {
        onSuccess: () => {
          showAlert('Success', 'Job post restored successfully.');
        },
        onError: (err: any) => {
          showAlert('Error', err.message || 'Failed to restore job.');
        },
      });
    },
    [restoreJob, showAlert],
  );

  const jobs = jobsResponse?.data || [];
  const archivedJobs = archivedResponse?.data || [];

  const isLoading = isJobsLoading || isArchivedLoading || isRestoring || isDeleting;
  const isError = isJobsError || isArchivedError;

  const filteredJobs =
    activeTab === 'Active'
      ? jobs.filter((job) => job.status === 'open')
      : activeTab === 'Past'
        ? jobs.filter((job) => job.status !== 'open')
        : archivedJobs;

  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params?.tab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'Archived') {
      await refetchArchived().catch(console.error);
    } else {
      await refetchJobs().catch(console.error);
    }
    setRefreshing(false);
  };

  const renderJobCard = useCallback(
    ({ item }: { item: JobPost }) => {
      const activeApp = (item.applications || []).find((a: any) =>
        [
          'shortlisted',
          'employer_requested',
          'pending_negotiation',
          'employer_confirmed',
          'accepted',
          'completed',
        ].includes(a.status),
      );

      const isUrgent = !!(item.is_urgent || item.urgent);
      const primaryCategory = item.categories?.[0] || item.category || 'Other';
      const catStyles = getCategoryStyles(primaryCategory);

      const totalSlots = item.slots || 1;
      const filledSlots = item.filled_slots ?? (item.accepted_count || 0);
      const remainingSlots = item.remaining_slots ?? Math.max(0, totalSlots - filledSlots);
      const isFilled =
        remainingSlots === 0 || item.status === 'completed' || item.status === 'closed_in_progress';

      const bannerImage =
        (Array.isArray(item.photos) &&
        item.photos.length > 0 &&
        typeof item.photos[0] === 'string' &&
        item.photos[0].trim().length > 0
          ? item.photos[0]
          : null) ||
        (item as any).photo_url ||
        (item as any).imageUrl ||
        (item as any).image_url ||
        null;

      const handleJobPress = () => {
        if (item.deleted_at) return;

        if (activeApp) {
          navigation.navigate('ApplicantDetail', {
            applicantId: activeApp.id,
            applicantName: activeApp.worker?.name || 'Worker Applicant',
            jobTitle: item.title,
            status: activeApp.status,
            barangay: activeApp.worker?.barangay,
            municipality: activeApp.worker?.municipality,
            reputationScore: activeApp.worker?.reputation_score,
            bio: activeApp.worker?.workerProfile?.bio || (activeApp.worker as any)?.bio,
            skills: activeApp.worker?.skills,
            experiences: activeApp.worker?.experiences,
            characterReferences: activeApp.worker?.character_references || undefined,
            phone: activeApp.worker?.phone || undefined,
            emergencyContactName: (activeApp.worker as any)?.emergency_contact_name,
            emergencyContactPhone: (activeApp.worker as any)?.emergency_contact_phone,
          });
        } else {
          navigation.navigate('JobStatusManagement', { id: item.id, job: item });
        }
      };

      const getStatusBadge = () => {
        if (item.deleted_at) {
          return { label: 'ARCHIVED', bg: '#F1F5F9', color: '#64748B' };
        }
        if (item.status === 'completed') {
          return { label: 'COMPLETED', bg: '#DCFCE7', color: '#15803D' };
        }
        if (item.status === 'in_progress' || item.status === 'closed_in_progress') {
          return { label: 'IN PROGRESS', bg: '#E0F2FE', color: '#0369A1' };
        }
        if (item.status === 'cancelled') {
          return { label: 'CANCELLED', bg: '#FEE2E2', color: '#DC2626' };
        }
        return { label: 'OPEN', bg: colors.status.accepted.bg, color: colors.status.accepted.text };
      };

      const statusBadge = getStatusBadge();

      return (
        <View style={styles.modernCard}>
          {/* Card Pressable Content */}
          <TouchableOpacity
            onPress={handleJobPress}
            activeOpacity={0.75}
            disabled={!!item.deleted_at}
            style={styles.cardPressable}
          >
            {/* Zone 1: Media Banner (Top - Conditional) */}
            {bannerImage ? (
              <View style={styles.mediaContainer}>
                <Image
                  source={{ uri: bannerImage }}
                  style={styles.bannerImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
                {Array.isArray(item.photos) && item.photos.length > 1 && (
                  <View style={styles.photoCountBadge}>
                    <Ionicons name="images" size={11} color="#FFFFFF" />
                    <Text style={styles.photoCountText}>+{item.photos.length - 1}</Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Zone 2: Content Area */}
            <View style={styles.contentArea}>
              {/* Header Row: Category Icon + Title (Left) / Status & Urgent (Right) */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={[styles.categoryIconCircle, { backgroundColor: catStyles.bg }]}>
                    <Ionicons name={catStyles.icon as any} size={18} color={catStyles.color} />
                  </View>
                  <View style={styles.titleContainer}>
                    <Text style={styles.modernJobTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                </View>

                <View style={styles.headerRight}>
                  {isUrgent && (
                    <View style={[styles.badge, styles.badgeUrgent]}>
                      <Ionicons name="flame" size={10} color={colors.error} />
                      <Text style={[styles.badgeText, { color: colors.error }]}>URGENT</Text>
                    </View>
                  )}
                  <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
                    <Text style={[styles.badgeText, { color: statusBadge.color }]}>
                      {statusBadge.label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Meta Info Row: Location, Slots, Duration, Time */}
              <View style={styles.metaRow}>
                <Ionicons name="location-sharp" size={12} color={colors.inkMuted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.barangay ? `${item.barangay}, ` : ''}
                  {item.municipality}
                </Text>
                <View style={styles.dot} />
                {isFilled ? (
                  <Text style={[styles.metaText, styles.slotFilledText]}>
                    Filled ({totalSlots}/{totalSlots})
                  </Text>
                ) : totalSlots > 1 ? (
                  filledSlots > 0 ? (
                    <Text style={[styles.metaText, styles.slotLeftText]}>
                      {remainingSlots} of {totalSlots} slots left
                    </Text>
                  ) : (
                    <Text style={styles.metaText}>{totalSlots} slots</Text>
                  )
                ) : (
                  <Text style={styles.metaText}>1 slot</Text>
                )}
                {item.duration ? (
                  <>
                    <View style={styles.dot} />
                    <Text style={styles.metaText}>
                      {item.duration} {item.duration_unit || 'days'}
                    </Text>
                  </>
                ) : null}
                <View style={styles.dot} />
                <Text style={styles.metaText}>{getRelativeTime(item.created_at)}</Text>
              </View>

              {/* Truncated Description Snippet */}
              {item.description ? (
                <Text style={styles.descriptionSnippet} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              {/* Pricing & Category Row */}
              <View style={styles.pricingRow}>
                <View style={styles.rateContainer}>
                  <Text style={styles.currencySymbol}>₱</Text>
                  <Text style={styles.rateAmount}>{formatCompensation(item.compensation)}</Text>
                  <Text style={styles.rateUnit}>
                    {' '}
                    / {formatRateUnit(item.rate_unit, item.duration_type)}
                  </Text>
                </View>

                <View style={[styles.categoryPill, { backgroundColor: catStyles.bg }]}>
                  <Text style={[styles.categoryPillText, { color: catStyles.color }]}>
                    {primaryCategory}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Zone 3: Bottom Action Bar */}
          <View style={styles.actionBar}>
            {item.deleted_at ? (
              <View
                style={[styles.actionPill, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
              >
                <Ionicons name="trash-outline" size={14} color={colors.inkSoft} />
                <Text style={[styles.actionCountText, { color: colors.inkSoft }]}>Archived</Text>
              </View>
            ) : (
              <View style={styles.actionPillsGroup}>
                <View
                  style={[
                    styles.actionPill,
                    { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
                  ]}
                >
                  <Ionicons name="people" size={14} color="#15803D" />
                  <Text style={[styles.actionCountText, { color: '#15803D' }]}>
                    {item.applications?.length || 0}
                  </Text>
                </View>

                {(item.reactions_count || 0) > 0 && (
                  <View
                    style={[
                      styles.actionPill,
                      { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' },
                    ]}
                  >
                    <Ionicons name="heart" size={14} color="#E11D48" />
                    <Text style={[styles.actionCountText, { color: '#E11D48' }]}>
                      {item.reactions_count}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {item.deleted_at ? (
              <View style={styles.actionBtnsGroup}>
                <TouchableOpacity
                  style={styles.iconActionBtn}
                  activeOpacity={0.75}
                  accessibilityLabel="Preview Job"
                  onPress={() => navigation.navigate('JobDetails', { id: item.id })}
                >
                  <Ionicons name="eye-outline" size={17} color={colors.ink} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cardBtn, { backgroundColor: colors.primaryDark }]}
                  activeOpacity={0.75}
                  onPress={() => handleRestoreJob(item.id)}
                >
                  <Ionicons name="refresh-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.cardBtnText}>Restore</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconActionBtn}
                  activeOpacity={0.75}
                  accessibilityLabel="More Options"
                  onPress={() => setMenuJob(item)}
                >
                  <Ionicons name="ellipsis-vertical" size={17} color={colors.ink} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionBtnsGroup}>
                <TouchableOpacity
                  style={styles.iconActionBtn}
                  activeOpacity={0.75}
                  accessibilityLabel="Preview Job"
                  onPress={() => navigation.navigate('JobDetails', { id: item.id })}
                >
                  <Ionicons name="eye-outline" size={17} color={colors.ink} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardBtn}
                  activeOpacity={0.75}
                  onPress={handleJobPress}
                >
                  <Text style={styles.cardBtnText}>{activeApp ? 'Active Stage' : 'Manage'}</Text>
                  <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconActionBtn}
                  activeOpacity={0.75}
                  accessibilityLabel="More Options"
                  onPress={() => setMenuJob(item)}
                >
                  <Ionicons name="ellipsis-vertical" size={17} color={colors.ink} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    },
    [handleRestoreJob, navigation],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.iconBtn} />
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>My Job Posts</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('PostJob')}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Active' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[styles.tabText, activeTab === 'Active' && styles.tabTextActive]}>
            Active ({jobs.filter((j) => j.status === 'open').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Past' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Past')}
        >
          <Text style={[styles.tabText, activeTab === 'Past' && styles.tabTextActive]}>
            Past ({jobs.filter((j) => j.status !== 'open').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Archived' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Archived')}
        >
          <Text style={[styles.tabText, activeTab === 'Archived' && styles.tabTextActive]}>
            Archived ({archivedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ padding: 20 }}>
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Error loading jobs</Text>
        </View>
      ) : filteredJobs.length === 0 ? (
        <ScrollView
          contentContainerStyle={[styles.emptyState, { flex: 1, justifyContent: 'center' }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <Ionicons name="briefcase-outline" size={48} color={colors.inkFaint} />
          <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} jobs</Text>
          <Text style={styles.emptyBody}>
            {activeTab === 'Active'
              ? "You haven't posted any active jobs yet. Post a job to start finding skilled workers nearby!"
              : `You don't have any ${activeTab.toLowerCase()} job postings right now.`}
          </Text>
          <Button
            title="Post a Job"
            onPress={() => navigation.navigate('PostJob')}
            style={{ marginTop: 16, minWidth: 160 }}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderJobCard}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* 3-DOT ACTION MODAL */}
      <Modal
        visible={Boolean(menuJob)}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuJob(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuJob(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalRefRow}>
                <Text style={styles.modalRefText}>
                  {menuJob?.reference_number || `JOB-${menuJob?.id || '000'}`}
                </Text>
                <View
                  style={[
                    styles.modalStatusBadge,
                    {
                      backgroundColor: menuJob?.deleted_at
                        ? '#F1F5F9'
                        : menuJob?.status === 'completed'
                          ? '#DCFCE7'
                          : colors.status.accepted.bg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalStatusText,
                      {
                        color: menuJob?.deleted_at
                          ? '#64748B'
                          : menuJob?.status === 'completed'
                            ? '#15803D'
                            : colors.status.accepted.text,
                      },
                    ]}
                  >
                    {menuJob?.deleted_at ? 'ARCHIVED' : (menuJob?.status || 'OPEN').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.modalJobTitle} numberOfLines={2}>
                {menuJob?.title}
              </Text>
            </View>

            <View style={styles.modalDivider} />

            {/* Menu Options */}
            <View style={styles.modalMenuOptions}>
              {/* Option 1: Manage Applicants & Pipeline */}
              {!menuJob?.deleted_at && (
                <TouchableOpacity
                  style={styles.modalMenuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    const jobToOpen = menuJob;
                    setMenuJob(null);
                    if (jobToOpen) {
                      navigation.navigate('JobStatusManagement', {
                        id: jobToOpen.id,
                        job: jobToOpen,
                      });
                    }
                  }}
                >
                  <View style={[styles.modalMenuIconBox, { backgroundColor: colors.sky + '25' }]}>
                    <Ionicons name="people-outline" size={18} color={colors.skyDeep} />
                  </View>
                  <View style={styles.modalMenuTextBox}>
                    <Text style={styles.modalMenuTitle}>Manage Applicants & Pipeline</Text>
                    <Text style={styles.modalMenuSub}>
                      Review candidates, negotiation, and stage progress
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkLight} />
                </TouchableOpacity>
              )}

              {/* Option 2: View Job Post */}
              <TouchableOpacity
                style={styles.modalMenuItem}
                activeOpacity={0.7}
                onPress={() => {
                  const jobId = menuJob?.id;
                  setMenuJob(null);
                  if (jobId) {
                    navigation.navigate('JobDetails', { id: jobId });
                  }
                }}
              >
                <View style={[styles.modalMenuIconBox, { backgroundColor: colors.mint + '30' }]}>
                  <Ionicons name="eye-outline" size={18} color={colors.mintDeep} />
                </View>
                <View style={styles.modalMenuTextBox}>
                  <Text style={styles.modalMenuTitle}>View Job Post</Text>
                  <Text style={styles.modalMenuSub}>
                    Inspect the public job post with all details
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.inkLight} />
              </TouchableOpacity>

              {/* Option 3: Edit Job Post (only if open) */}
              {!menuJob?.deleted_at && menuJob?.status === 'open' && (
                <TouchableOpacity
                  style={styles.modalMenuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    const jobToEdit = menuJob;
                    setMenuJob(null);
                    if (jobToEdit) {
                      navigation.navigate('PostJob', { job: jobToEdit });
                    }
                  }}
                >
                  <View
                    style={[styles.modalMenuIconBox, { backgroundColor: colors.butter + '50' }]}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.gold} />
                  </View>
                  <View style={styles.modalMenuTextBox}>
                    <Text style={styles.modalMenuTitle}>Edit Job Post</Text>
                    <Text style={styles.modalMenuSub}>
                      Update requirements, compensation, or schedule
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkLight} />
                </TouchableOpacity>
              )}

              {/* Option 4: Archive or Restore */}
              {menuJob?.deleted_at ? (
                <TouchableOpacity
                  style={styles.modalMenuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    const jobId = menuJob?.id;
                    setMenuJob(null);
                    if (jobId) {
                      handleRestoreJob(jobId);
                    }
                  }}
                >
                  <View style={[styles.modalMenuIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="refresh-outline" size={18} color="#15803D" />
                  </View>
                  <View style={styles.modalMenuTextBox}>
                    <Text style={[styles.modalMenuTitle, { color: '#15803D' }]}>
                      Restore Job Post
                    </Text>
                    <Text style={styles.modalMenuSub}>
                      Reactivate this job and return it to your active posts
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkLight} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.modalMenuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    const jobToArchive = menuJob;
                    setMenuJob(null);
                    if (jobToArchive) {
                      handleArchiveJob(jobToArchive);
                    }
                  }}
                >
                  <View style={[styles.modalMenuIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="archive-outline" size={18} color={colors.error} />
                  </View>
                  <View style={styles.modalMenuTextBox}>
                    <Text style={[styles.modalMenuTitle, { color: colors.error }]}>
                      Archive Job Post
                    </Text>
                    <Text style={styles.modalMenuSub}>Move this listing to the archive</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkLight} />
                </TouchableOpacity>
              )}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              activeOpacity={0.8}
              onPress={() => setMenuJob(null)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.inkFaint,
  },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  tabTextActive: { color: colors.primary },
  listContent: { padding: 20, paddingBottom: 40, gap: 14 },
  modernCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.75)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardPressable: {
    width: '100%',
  },
  mediaContainer: {
    width: '100%',
    height: 150,
    backgroundColor: colors.inkFaint,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  photoCountText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    color: '#FFFFFF',
  },
  contentArea: {
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
  },
  modernJobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    paddingTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  badgeUrgent: {
    backgroundColor: colors.status.rejected.bg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.inkMuted,
  },
  slotFilledText: {
    color: colors.error,
    fontFamily: fonts.bodyBold,
  },
  slotLeftText: {
    color: '#D97706',
    fontFamily: fonts.bodyBold,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.inkFaint,
    marginHorizontal: 2,
  },
  descriptionSnippet: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontFamily: fonts.numericBold,
    fontSize: 14,
    color: colors.ink,
    marginRight: 1,
  },
  rateAmount: {
    fontFamily: fonts.numericBold,
    fontSize: 16.5,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  rateUnit: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionCountText: {
    fontFamily: fonts.numericBold,
    fontSize: 11.5,
  },
  actionBtnsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 8,
  },
  previewBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
  },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.paperBright,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inkFaint,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    gap: 6,
  },
  modalRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalRefText: {
    fontFamily: fonts.numericBold,
    fontSize: 12,
    color: colors.inkSoft,
  },
  modalStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modalStatusText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  modalJobTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    lineHeight: 24,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.inkFaint,
    marginVertical: 14,
  },
  modalMenuOptions: {
    gap: 10,
  },
  modalMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  modalMenuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMenuTextBox: {
    flex: 1,
  },
  modalMenuTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  modalMenuSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.inkSoft,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MyJobsScreen;
