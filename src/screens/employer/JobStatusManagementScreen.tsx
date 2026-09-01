import React, { useState } from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useDeleteJob } from '../../hooks/useJobs';
import { useJob } from '../../hooks/useJob';
import { useJobApplications } from '../../hooks/useJobApplications';
import { MediaViewerModal } from '../../components/common/MediaViewerModal';

type JobStatusScreenRouteProp = RouteProp<EmployerStackParamList, 'JobStatusManagement'>;
type JobStatusScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'JobStatusManagement'
>;

export const JobStatusManagementScreen: React.FC = () => {
  const route = useRoute<JobStatusScreenRouteProp>();
  const navigation = useNavigation<JobStatusScreenNavigationProp>();
  const { id } = route.params;

  const [viewerMedia, setViewerMedia] = useState<{ type: 'photo' | 'video'; url: string } | null>(
    null,
  );

  const { data: job, isLoading: isJobLoading, isError, error, refetch } = useJob(id);
  const { data: applications = [], isLoading: isAppsLoading } = useJobApplications(id);
  const { mutate: deleteJob } = useDeleteJob();
  const { showAlert } = useAlert();

  const isLoading = isJobLoading || isAppsLoading;

  const getStageLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Applied';
      case 'employer_requested':
        return 'Shortlisted';
      case 'employer_confirmed':
        return 'Offer';
      case 'accepted':
        return 'Hired';
      case 'completed':
        return 'Done';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.sky;
      case 'employer_requested':
        return colors.butter;
      case 'employer_confirmed':
        return colors.peach;
      case 'accepted':
        return colors.mint;
      case 'completed':
        return colors.mintDeep;
      case 'rejected':
        return colors.error;
      default:
        return colors.inkFaint;
    }
  };

  const handleEditJob = () => {
    if (!job) return;
    navigation.navigate('PostJob', { job } as any);
  };

  const handleMarkComplete = () => {
    navigation.navigate('MarkComplete', { id, jobTitle: job?.title || 'Job' });
  };

  const handleCancelJob = () => {
    showAlert(
      'Cancel Job',
      'Are you sure you want to cancel this job? This will notify any applied or hired workers.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            deleteJob(id, {
              onSuccess: () => {
                showAlert('Cancelled', 'Your job post has been cancelled.', [
                  { text: 'OK', onPress: () => navigation.navigate('MyJobs') },
                ]);
              },
              onError: (err: any) => {
                showAlert('Error', err.message || 'Could not cancel job.');
              },
            });
          },
        },
      ],
    );
  };

  const handleDeleteJob = () => {
    showAlert(
      'Archive Post',
      'Are you sure you want to archive this post? It will no longer show up in your post history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            deleteJob(id, {
              onSuccess: () => {
                navigation.navigate('MyJobs');
              },
              onError: (err: any) => {
                showAlert('Error', err.message || 'Could not archive job.');
              },
            });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Error</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.bodyBold, color: colors.error, marginBottom: 12 }}>
            {error?.message || 'Failed to load job details.'}
          </Text>
          <Button label="Retry" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  // Get dynamic status properties from colors.status
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return {
          label: 'Active / Open',
          bg: colors.status.accepted.bg,
          text: colors.status.accepted.text,
        };
      case 'closed_in_progress':
        return {
          label: 'In Progress',
          bg: colors.status.pending_negotiation.bg,
          text: colors.status.pending_negotiation.text,
        };
      case 'completed':
        return {
          label: 'Completed',
          bg: colors.status.completed.bg,
          text: colors.status.completed.text,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          bg: colors.status.rejected.bg,
          text: colors.status.rejected.text,
        };
      default:
        return { label: status, bg: colors.inkFaint, text: colors.inkSoft };
    }
  };

  const statusConfig = getStatusConfig(job.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Manage Job Status</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusBanner}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.refNumber}>{job.reference_number}</Text>
        </View>

        {/* 5-Stage Hiring Pipeline */}
        {job.status !== 'cancelled' && (job.status as string) !== 'suspended' && (
          <View style={styles.pipelineCard}>
            <Text style={styles.pipelineTitle}>Hiring Pipeline</Text>
            <View style={styles.pipeline}>
              {(() => {
                const countPending = applications.filter((a) => a.status === 'pending').length;
                const countShortlisted = applications.filter(
                  (a) => a.status === 'employer_requested' || a.status === 'pending_negotiation',
                ).length;
                const countOffer = applications.filter(
                  (a) => a.status === 'employer_confirmed',
                ).length;
                const countHired = applications.filter((a) => a.status === 'accepted').length;
                const countCompleted = applications.filter((a) => a.status === 'completed').length;

                return (
                  <>
                    <View style={styles.pipelineStep}>
                      <View
                        style={[
                          styles.pipelineCircle,
                          countPending > 0 && styles.pipelineCircleActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pipelineCircleText,
                            countPending > 0 && styles.pipelineCircleTextActive,
                          ]}
                        >
                          {countPending}
                        </Text>
                      </View>
                      <Text style={styles.pipelineLabel}>Applied</Text>
                    </View>

                    <View style={styles.pipelineDivider} />

                    <View style={styles.pipelineStep}>
                      <View
                        style={[
                          styles.pipelineCircle,
                          countShortlisted > 0 && styles.pipelineCircleActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pipelineCircleText,
                            countShortlisted > 0 && styles.pipelineCircleTextActive,
                          ]}
                        >
                          {countShortlisted}
                        </Text>
                      </View>
                      <Text style={styles.pipelineLabel}>Shortlist</Text>
                    </View>

                    <View style={styles.pipelineDivider} />

                    <View style={styles.pipelineStep}>
                      <View
                        style={[
                          styles.pipelineCircle,
                          countOffer > 0 && styles.pipelineCircleActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pipelineCircleText,
                            countOffer > 0 && styles.pipelineCircleTextActive,
                          ]}
                        >
                          {countOffer}
                        </Text>
                      </View>
                      <Text style={styles.pipelineLabel}>Offer</Text>
                    </View>

                    <View style={styles.pipelineDivider} />

                    <View style={styles.pipelineStep}>
                      <View
                        style={[
                          styles.pipelineCircle,
                          countHired > 0 && styles.pipelineCircleActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pipelineCircleText,
                            countHired > 0 && styles.pipelineCircleTextActive,
                          ]}
                        >
                          {countHired}
                        </Text>
                      </View>
                      <Text style={styles.pipelineLabel}>Hired</Text>
                    </View>

                    <View style={styles.pipelineDivider} />

                    <View style={styles.pipelineStep}>
                      <View
                        style={[
                          styles.pipelineCircle,
                          countCompleted > 0 && styles.pipelineCircleActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pipelineCircleText,
                            countCompleted > 0 && styles.pipelineCircleTextActive,
                          ]}
                        >
                          {countCompleted}
                        </Text>
                      </View>
                      <Text style={styles.pipelineLabel}>Done</Text>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text style={[styles.jobTitle, { flex: 1, marginBottom: 0 }]}>{job.title}</Text>
            {!!(job.is_urgent || job.urgent) && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.peach,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  gap: 4,
                  marginLeft: 8,
                }}
              >
                <Ionicons name="flame" size={14} color={colors.error} />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.error }}>
                  URGENT
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.categoryText}>
            {job.categories && job.categories.length > 0 ? job.categories.join(' · ') : 'General'}
          </Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.metaValue}>
                {job.barangay}, {job.municipality}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.metaValue}>
                ₱{job.compensation} / {job.duration_type === 'daily' ? 'day' : 'project'}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.metaValue}>
                Slots: {job.accepted_count} / {job.slots} hired
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{job.description}</Text>

          {job.tools_required ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Tools Required</Text>
              <Text style={styles.descriptionText}>{job.tools_required}</Text>
            </>
          ) : null}

          {(job.photos && job.photos.length > 0) || job.video_url ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Attachments & Media</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingTop: 6 }}
              >
                {job.photos?.map((photoUrl: string, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => setViewerMedia({ type: 'photo', url: photoUrl })}
                  >
                    <Image
                      cachePolicy="memory-disk"
                      source={{ uri: photoUrl }}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 12,
                        backgroundColor: colors.inkFaint,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 6,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons name="expand-outline" size={12} color={colors.white} />
                    </View>
                  </TouchableOpacity>
                ))}

                {job.video_url && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setViewerMedia({ type: 'video', url: job.video_url! })}
                    style={{
                      width: 140,
                      height: 100,
                      borderRadius: 12,
                      backgroundColor: '#1E1E1E',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="play-circle" size={36} color={colors.white} />
                    <Text
                      style={{
                        fontFamily: fonts.bodyBold,
                        fontSize: 11,
                        color: colors.white,
                        marginTop: 4,
                      }}
                    >
                      Play Video
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </>
          ) : null}
        </View>

        {/* Applicants List Section */}
        {job.status !== 'cancelled' && (job.status as string) !== 'suspended' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Applicants ({applications.length})</Text>
            {applications.length === 0 ? (
              <Text style={styles.noApplicantsText}>
                No workers have applied to this job post yet.
              </Text>
            ) : (
              <View style={styles.applicantsList}>
                {applications.map((app) => (
                  <TouchableOpacity
                    key={app.id}
                    style={styles.applicantRow}
                    onPress={() =>
                      navigation.navigate('ApplicantDetail', {
                        applicantId: app.id,
                        applicantName: app.worker?.name || 'Worker Applicant',
                        jobTitle: job?.title || '',
                        status: app.status,
                        barangay: app.worker?.barangay,
                        municipality: app.worker?.municipality,
                        reputationScore: app.worker?.reputation_score,
                        bio: app.worker?.workerProfile?.bio || (app.worker as any)?.bio,
                        skills: app.worker?.skills,
                        experiences: app.worker?.experiences,
                        characterReferences: app.worker?.character_references || undefined,
                        phone: app.worker?.phone || undefined,
                        emergencyContactName: (app.worker as any)?.emergency_contact_name,
                        emergencyContactPhone: (app.worker as any)?.emergency_contact_phone,
                      })
                    }
                  >
                    <View style={styles.applicantLeft}>
                      <View style={styles.applicantAvatar}>
                        <Text style={styles.avatarInitial}>
                          {app.worker?.name?.charAt(0) || 'W'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.applicantName}>
                          {app.worker?.name || 'Worker Applicant'}
                        </Text>
                        <Text style={styles.applicantSub} numberOfLines={1}>
                          {app.worker?.barangay
                            ? `${app.worker.barangay}, ${app.worker.municipality}`
                            : 'Worker'}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadgeSmall,
                        { backgroundColor: getStageColor(app.status) },
                      ]}
                    >
                      <Text style={styles.statusBadgeTextSmall}>{getStageLabel(app.status)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.actionsCard}>
          {job.status === 'open' && (
            <>
              <Button label="Edit Job Post" onPress={handleEditJob} style={styles.actionBtn} />
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelJob}>
                <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                <Text style={styles.cancelBtnText}>Cancel / Archive Job</Text>
              </TouchableOpacity>
            </>
          )}

          {job.status === 'closed_in_progress' && (
            <>
              <Button
                label="Mark as Completed"
                onPress={handleMarkComplete}
                style={styles.actionBtn}
              />
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelJob}>
                <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                <Text style={styles.cancelBtnText}>Cancel Job</Text>
              </TouchableOpacity>
            </>
          )}

          {(job.status === 'completed' || job.status === 'cancelled') && (
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.inkSoft }]}
              onPress={handleDeleteJob}
            >
              <Ionicons name="archive-outline" size={20} color={colors.inkSoft} />
              <Text style={[styles.cancelBtnText, { color: colors.inkSoft }]}>
                Archive Job History
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <MediaViewerModal
        visible={!!viewerMedia}
        media={viewerMedia}
        onClose={() => setViewerMedia(null)}
      />
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
  scrollContent: { padding: 20, gap: 16, paddingBottom: 60 },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  refNumber: { fontFamily: fonts.numericBlack, fontSize: 12, color: colors.inkMuted },
  card: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 20,
    ...shadows.sm,
  },
  jobTitle: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.ink, marginBottom: 4 },
  categoryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.primarySoft,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  metaGrid: { gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaValue: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
  divider: { height: 1, backgroundColor: colors.inkFaint, marginVertical: 16 },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, marginBottom: 8 },
  descriptionText: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  actionsCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    ...shadows.sm,
  },
  actionBtn: { width: '100%' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
  },
  cancelBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.error },
  pipelineCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
  },
  pipelineTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 12,
  },
  pipeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pipelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  pipelineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineCircleActive: {
    backgroundColor: colors.primary,
  },
  pipelineCircleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
  },
  pipelineCircleTextActive: {
    color: colors.paperBright,
  },
  pipelineLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.inkMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  pipelineDivider: {
    height: 2,
    flex: 0.5,
    backgroundColor: colors.inkFaint,
    marginBottom: 14,
  },
  noApplicantsText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    marginVertical: 12,
  },
  applicantsList: {
    marginTop: 10,
    gap: 12,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  applicantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  applicantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  applicantName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  applicantSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    width: '90%',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeTextSmall: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.ink,
  },
});

export default JobStatusManagementScreen;
