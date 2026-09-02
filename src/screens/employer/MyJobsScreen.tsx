import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useEmployerJobs, useArchivedJobs, useRestoreJob } from '../../hooks/useEmployerJobs';
import { JobPost } from '../../types';
import { JobCardSkeleton } from '../../components/common/SkeletonLoader';
import { useAlert } from '../../contexts/AlertContext';

type MyJobsNavigationProp = NativeStackNavigationProp<EmployerStackParamList, 'MyJobs'>;

export const MyJobsScreen: React.FC = () => {
  const navigation = useNavigation<MyJobsNavigationProp>();
  const route = useRoute<any>();
  const [activeTab, setActiveTab] = useState<'Active' | 'Past' | 'Archived'>('Active');
  const [refreshing, setRefreshing] = useState(false);
  const { showAlert } = useAlert();

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

  const jobs = jobsResponse?.data || [];
  const archivedJobs = archivedResponse?.data || [];

  const isLoading = isJobsLoading || isArchivedLoading || isRestoring;
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
          'employer_requested',
          'pending_negotiation',
          'employer_confirmed',
          'accepted',
          'completed',
        ].includes(a.status),
      );

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

      return (
        <TouchableOpacity
          style={styles.jobCard}
          onPress={handleJobPress}
          disabled={!!item.deleted_at}
        >
          <View style={styles.jobHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.jobCategory}>
                {item.categories && item.categories.length > 0 ? item.categories[0] : 'General'}
              </Text>
              {!!(item.is_urgent || item.urgent) && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.peach,
                    paddingVertical: 2,
                    paddingHorizontal: 6,
                    borderRadius: 8,
                    gap: 2,
                  }}
                >
                  <Ionicons name="flame" size={10} color={colors.error} />
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 9, color: colors.error }}>
                    URGENT
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.jobTime}>{item.deleted_at ? 'Archived' : item.status}</Text>
          </View>
          <Text style={styles.jobTitle}>{item.title}</Text>

          <View style={styles.jobFooter}>
            {item.deleted_at ? (
              <View style={styles.applicantsBadge}>
                <Ionicons name="trash-outline" size={14} color={colors.inkSoft} />
                <Text style={[styles.applicantsText, { color: colors.inkSoft }]}>Archived</Text>
              </View>
            ) : (
              <View style={styles.applicantsBadge}>
                <Ionicons name="people" size={14} color={colors.primary} />
                <Text style={styles.applicantsText}>
                  {item.applications?.length || 0} applicants
                </Text>
              </View>
            )}

            {item.deleted_at ? (
              <TouchableOpacity
                style={[styles.manageBtn, { backgroundColor: colors.primaryDark }]}
                onPress={() => {
                  restoreJob(item.id, {
                    onSuccess: () => {
                      showAlert('Success', 'Job restored successfully.');
                    },
                    onError: (err: any) => {
                      showAlert('Error', err.message || 'Failed to restore job.');
                    },
                  });
                }}
              >
                <Text style={styles.manageBtnText}>Restore</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.manageBtn} onPress={handleJobPress}>
                <Text style={styles.manageBtnText}>{activeApp ? 'Active Stage' : 'Manage'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, restoreJob, showAlert],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
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
            You don't have any {activeTab.toLowerCase()} job postings right now.
          </Text>
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
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.sm,
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
  jobCard: { backgroundColor: colors.paperBright, borderRadius: 16, padding: 16, ...shadows.sm },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobCategory: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  jobTime: { fontFamily: fonts.body, fontSize: 11, color: colors.inkLight },
  jobTitle: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.ink, marginBottom: 16 },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  applicantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.peach,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  applicantsText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primaryDark },
  manageBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  manageBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.paperBright },
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default MyJobsScreen;
