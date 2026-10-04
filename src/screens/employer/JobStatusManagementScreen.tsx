import React, { useState, useCallback } from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useDeleteJob } from '../../hooks/useJobs';
import { useJob } from '../../hooks/useJob';
import { useJobApplications } from '../../hooks/useJobApplications';
import { useReviews } from '../../hooks/useReviews';
import { Avatar } from '../../components/common/Avatar';
import { MediaViewerModal } from '../../components/common/MediaViewerModal';

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

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

  const {
    data: job,
    isLoading: isJobLoading,
    isError,
    error,
    refetch: refetchJob,
    isFetching: isJobFetching,
  } = useJob(id);

  const parsedPhotos: string[] = React.useMemo(() => {
    if (!job) return [];
    const raw = job.photos || (job as any).worksite_photos || (job as any).images || [];
    if (Array.isArray(raw)) {
      return raw
        .map((p: any) => (typeof p === 'string' ? p : p?.url || p?.uri || ''))
        .filter((url: string) => typeof url === 'string' && url.trim().length > 0);
    }
    if (typeof raw === 'string' && raw.trim() !== '') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .map((p: any) => (typeof p === 'string' ? p : p?.url || p?.uri || ''))
            .filter((url: string) => typeof url === 'string' && url.trim().length > 0);
        }
        if (typeof parsed === 'string' && parsed.trim().length > 0) return [parsed.trim()];
      } catch {
        return [raw.trim()];
      }
    }
    if (
      (job as any).image_url &&
      typeof (job as any).image_url === 'string' &&
      (job as any).image_url.trim().length > 0
    ) {
      return [(job as any).image_url.trim()];
    }
    return [];
  }, [job]);
  const {
    data: applications = [],
    isLoading: isAppsLoading,
    refetch: refetchApps,
    isFetching: isAppsFetching,
  } = useJobApplications(id);
  const { data: reviewsData } = useReviews(undefined, 'employer');
  const { mutate: deleteJob } = useDeleteJob();
  const { showAlert } = useAlert();

  const reviewByAppId = React.useMemo(() => {
    const map = new Map<number, any>();
    if (!reviewsData?.reviews) return map;
    reviewsData.reviews.forEach((r) => {
      if (r.reviewer_role === 'employer' && r.application_id) {
        map.set(r.application_id, r);
      }
    });
    return map;
  }, [reviewsData]);

  const completedApps = React.useMemo(() => {
    return applications.filter((a) => a.status === 'completed');
  }, [applications]);

  const completedCount =
    completedApps.length > 0
      ? completedApps.length
      : job?.filled_slots || job?.accepted_count || job?.slots || 1;
  const totalPaid =
    completedApps.reduce(
      (acc, a) => acc + Number(a.final_agreed_price || job?.compensation || 0),
      0,
    ) || Number(job?.compensation || 0) * completedCount;
  const unreviewedCount = completedApps.filter(
    (a) => !reviewByAppId.has(a.id) && !a.has_reviewed && !a.user_review,
  ).length;

  useFocusEffect(
    useCallback(() => {
      refetchJob();
      refetchApps();
    }, [refetchJob, refetchApps]),
  );

  const isFetching = isJobFetching || isAppsFetching;
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
      <SafeAreaView
        style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}
        edges={['top', 'left', 'right']}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !job) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Job Status</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons
            name="folder-open-outline"
            size={54}
            color={colors.inkLight}
            style={{ marginBottom: 12 }}
          />
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 18,
              color: colors.ink,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Job Record Unavailable
          </Text>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 13,
              color: colors.inkSoft,
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            {error?.message || 'This job could not be found or may have been removed.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              label="Back to My Jobs"
              variant="ghost"
              size="base"
              onPress={() => navigation.goBack()}
            />
            <Button label="Retry" variant="primary" size="base" onPress={() => refetchJob()} />
          </View>
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>
            {job.status === 'completed' ? 'Completed Job' : 'Manage Job Status'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={async () => {
              await Promise.all([refetchJob(), refetchApps()]);
            }}
            colors={[colors.primary, colors.primaryDark]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.paperBright}
          />
        }
      >
        {/* ============================================================ */}
        {/* COMPLETED JOB VIEW */}
        {/* ============================================================ */}
        {job.status === 'completed' ? (
          <>
            {/* 1. Celebratory Hero Banner */}
            <View style={styles.completedHeroCard}>
              <View style={styles.completedHeroGlow} />
              <View style={styles.completedHeroTop}>
                <View style={styles.refBadge}>
                  <Ionicons name="document-text-outline" size={13} color={colors.inkSoft} />
                  <Text style={styles.refText}>{job.reference_number}</Text>
                </View>
                <View style={styles.completedStatusBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                  <Text style={styles.completedStatusBadgeText}>Completed</Text>
                </View>
              </View>

              <View style={styles.celebrationRow}>
                <Text style={styles.celebrationEmoji}>🎉</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.celebrationTitle}>Job Completed Successfully</Text>
                  <Text style={styles.celebrationSubtitle}>
                    {job.completed_at || job.updated_at
                      ? `Finished on ${formatDate(job.completed_at || job.updated_at)}`
                      : 'All hired workers have finished this task.'}
                  </Text>
                </View>
              </View>

              <Text style={styles.completedJobTitle}>{job.title}</Text>
            </View>

            {/* 2. Three-Metric Stats Grid */}
            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="cash" size={18} color="#15803D" />
                </View>
                <Text style={styles.metricLabel}>Total Payout</Text>
                <Text style={styles.metricValue}>₱{Number(totalPaid).toLocaleString()}</Text>
                <Text style={styles.metricSub}>Paid to Workers</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: colors.sky + '25' }]}>
                  <Ionicons name="people" size={18} color={colors.skyDeep} />
                </View>
                <Text style={styles.metricLabel}>Workers</Text>
                <Text style={styles.metricValue}>{completedCount} Hired</Text>
                <Text style={styles.metricSub}>All Finished</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: colors.butter + '60' }]}>
                  <Ionicons name="time" size={18} color={colors.gold} />
                </View>
                <Text style={styles.metricLabel}>Duration</Text>
                <Text style={styles.metricValue} numberOfLines={1}>
                  {job.duration ? `${job.duration} ${job.duration_unit || 'Days'}` : 'Flexible'}
                </Text>
                <Text style={styles.metricSub}>
                  {job.duration_type === 'daily' ? 'Daily' : 'Project'}
                </Text>
              </View>
            </View>

            {/* 3. Completed Workers & Ratings Section */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  Hired Workers ({completedApps.length > 0 ? completedApps.length : completedCount})
                </Text>
                {unreviewedCount > 0 && (
                  <View style={styles.pendingReviewsBadge}>
                    <Text style={styles.pendingReviewsBadgeText}>{unreviewedCount} To Rate</Text>
                  </View>
                )}
              </View>

              {completedApps.length === 0 ? (
                <View style={styles.noWorkersBox}>
                  <Ionicons
                    name="checkmark-done-circle-outline"
                    size={36}
                    color={colors.mintDeep}
                  />
                  <Text style={styles.noWorkersText}>
                    All contract tasks have been marked complete.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 14 }}>
                  {completedApps.map((app) => {
                    const worker = app.worker;
                    const review = reviewByAppId.get(app.id) || app.user_review;
                    const isReviewed = Boolean(review || app.has_reviewed);
                    const workerAgreedPrice = app.final_agreed_price || job.compensation;

                    return (
                      <View key={app.id} style={styles.completedWorkerCard}>
                        <View style={styles.completedWorkerHeader}>
                          <Avatar
                            url={worker?.is_deleted ? undefined : worker?.avatar_url}
                            name={worker?.name || 'Worker'}
                            size={44}
                          />
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.workerNameText}>{worker?.name || 'Worker'}</Text>
                              {worker?.verification_badge && (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={16}
                                  color={colors.mintDeep}
                                />
                              )}
                            </View>
                            <Text style={styles.workerLocationText}>
                              {worker?.barangay
                                ? `${worker.barangay}, ${worker.municipality || 'Bulan'}`
                                : 'Worker'}
                            </Text>
                          </View>
                          <View style={styles.agreedPayBadge}>
                            <Text style={styles.agreedPayText}>
                              ₱{Number(workerAgreedPrice).toLocaleString()}
                            </Text>
                          </View>
                        </View>

                        {/* Review / Rating Status Box */}
                        <View style={styles.workerRatingBox}>
                          {isReviewed ? (
                            <View style={{ gap: 4 }}>
                              <View style={styles.ratingStatusRow}>
                                <View style={styles.starScoreBadge}>
                                  <Ionicons name="star" size={13} color={colors.gold} />
                                  <Text style={styles.starScoreText}>
                                    {review?.overall_rating
                                      ? Number(review.overall_rating).toFixed(1)
                                      : '5.0'}
                                  </Text>
                                </View>
                                <Text style={styles.ratingSubmittedText}>Rating Submitted</Text>
                              </View>
                              {review?.comment ? (
                                <Text style={styles.reviewCommentQuote}>"{review.comment}"</Text>
                              ) : null}
                            </View>
                          ) : (
                            <View style={{ gap: 10 }}>
                              <View style={styles.ratingPendingRow}>
                                <Ionicons name="time-outline" size={16} color={colors.gold} />
                                <Text style={styles.ratingPendingText}>
                                  Rating window open (7 days to review)
                                </Text>
                              </View>
                              <Button
                                label="★ Rate Worker"
                                variant="primary"
                                size="base"
                                fullWidth
                                onPress={() =>
                                  navigation.navigate('RateWorker', {
                                    id: app.id,
                                    workerName: worker?.name || 'Worker',
                                    jobTitle: job.title,
                                    jobId: job.id,
                                  })
                                }
                              />
                            </View>
                          )}
                        </View>

                        {/* Worker Action Links */}
                        <View style={styles.workerActionsRow}>
                          <TouchableOpacity
                            style={styles.workerActionBtn}
                            onPress={() => {
                              if (app.conversation_id) {
                                (navigation as any).navigate('Chat', {
                                  conversationId: app.conversation_id,
                                  jobTitle: job.title,
                                  otherUserName: worker?.name || 'Worker',
                                });
                              } else {
                                navigation.navigate('ApplicantDetail', {
                                  applicantId: app.id,
                                  applicantName: worker?.name || 'Worker',
                                  jobTitle: job.title,
                                  status: app.status,
                                  barangay: worker?.barangay,
                                  municipality: worker?.municipality,
                                });
                              }
                            }}
                          >
                            <Ionicons name="chatbubbles-outline" size={15} color={colors.primary} />
                            <Text style={styles.workerActionBtnText}>Chat History</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.workerActionBtn}
                            onPress={() =>
                              navigation.navigate('ApplicantDetail', {
                                applicantId: app.id,
                                applicantName: worker?.name || 'Worker',
                                jobTitle: job.title,
                                status: app.status,
                                barangay: worker?.barangay,
                                municipality: worker?.municipality,
                                reputationScore: worker?.reputation_score,
                                skills: worker?.skills,
                                experiences: worker?.experiences,
                                characterReferences: worker?.character_references || undefined,
                                phone: worker?.phone || undefined,
                              })
                            }
                          >
                            <Ionicons name="person-outline" size={15} color={colors.inkSoft} />
                            <Text style={[styles.workerActionBtnText, { color: colors.inkSoft }]}>
                              View Profile
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 4. Job Specifications & Attachments */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Job Specifications</Text>

              {job.categories && job.categories.length > 0 && (
                <View style={styles.categoriesRow}>
                  {job.categories.map((cat: string, idx: number) => (
                    <View key={idx} style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color={colors.inkSoft} />
                  <Text style={styles.metaValue}>
                    {job.barangay}, {job.municipality}
                  </Text>
                </View>

                {job.exact_location ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="navigate-outline" size={16} color={colors.inkSoft} />
                    <Text style={styles.metaValue}>{job.exact_location}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.divider} />

              <Text style={styles.subsectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{job.description}</Text>

              {job.tools_required ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.subsectionTitle}>Tools Required</Text>
                  <Text style={styles.descriptionText}>{job.tools_required}</Text>
                </>
              ) : null}

              {(parsedPhotos.length > 0 || job.video_url) && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.subsectionTitle}>
                    Attachments & Media ({parsedPhotos.length + (job.video_url ? 1 : 0)})
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingTop: 6 }}
                  >
                    {parsedPhotos.map((photoUrl: string, idx: number) => (
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
              )}
            </View>

            {/* 5. Bottom Actions */}
            <View style={styles.actionsCard}>
              {unreviewedCount > 0 && (
                <Button
                  label={`Rate Remaining Workers (${unreviewedCount})`}
                  variant="primary"
                  onPress={() =>
                    navigation.navigate('RateWorkerList', {
                      jobId: job.id,
                      jobTitle: job.title,
                    })
                  }
                  style={styles.actionBtn}
                />
              )}
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.inkFaint }]}
                onPress={handleDeleteJob}
              >
                <Ionicons name="archive-outline" size={18} color={colors.inkSoft} />
                <Text style={[styles.cancelBtnText, { color: colors.inkSoft }]}>
                  Archive Job Post
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ============================================================ */
          /* OPEN / IN-PROGRESS / CANCELLED PIPELINE VIEW */
          /* ============================================================ */
          <>
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
                      (a) =>
                        a.status === 'employer_requested' || a.status === 'pending_negotiation',
                    ).length;
                    const countOffer = applications.filter(
                      (a) => a.status === 'employer_confirmed',
                    ).length;
                    const countHired = applications.filter((a) => a.status === 'accepted').length;
                    const countDone = applications.filter((a) => a.status === 'completed').length;

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
                              countDone > 0 && styles.pipelineCircleActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.pipelineCircleText,
                                countDone > 0 && styles.pipelineCircleTextActive,
                              ]}
                            >
                              {countDone}
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

            {(() => {
              const activeApps = applications.filter((a) =>
                [
                  'employer_requested',
                  'pending_negotiation',
                  'employer_confirmed',
                  'accepted',
                ].includes(a.status),
              );
              if (activeApps.length === 0) return null;

              const getStageTitle = (st: string) => {
                if (st === 'employer_requested' || st === 'pending_negotiation')
                  return 'Stage 2: Shortlisted & Negotiation';
                if (st === 'employer_confirmed') return 'Stage 3: Offer Sent';
                if (st === 'accepted') return 'Stage 4: Worker Hired';
                return 'Active Stage';
              };

              const getActionLabel = (st: string) => {
                if (st === 'employer_requested' || st === 'pending_negotiation')
                  return 'Proceed to Confirm Hire →';
                if (st === 'employer_confirmed') return 'View Offer Details →';
                if (st === 'accepted') return 'Manage Active Job →';
                return 'View Details →';
              };

              return (
                <View style={{ marginBottom: 8 }}>
                  {activeApps.length > 1 && (
                    <Text
                      style={{
                        fontFamily: fonts.bodyBold,
                        fontSize: 12,
                        color: colors.inkSoft,
                        marginBottom: 8,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Active Candidates ({activeApps.length})
                    </Text>
                  )}
                  {activeApps.map((activeApp) => (
                    <View
                      key={activeApp.id}
                      style={{
                        backgroundColor: colors.paperBright,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                        ...shadows.sm,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: fonts.bodyBold,
                            fontSize: 13,
                            color: colors.primaryDark,
                          }}
                          numberOfLines={1}
                        >
                          {getStageTitle(activeApp.status)}
                        </Text>
                        <View
                          style={{
                            flexShrink: 0,
                            backgroundColor: colors.primaryTint,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: fonts.bodyBold,
                              fontSize: 10,
                              color: colors.primary,
                            }}
                          >
                            CURRENT STAGE
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          fontFamily: fonts.display,
                          fontSize: 16,
                          color: colors.ink,
                          marginBottom: 4,
                        }}
                      >
                        {activeApp.worker?.name || 'Worker'}
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.body,
                          fontSize: 12,
                          color: colors.inkSoft,
                          marginBottom: 12,
                        }}
                      >
                        {activeApp.worker?.barangay
                          ? `${activeApp.worker.barangay}, ${activeApp.worker.municipality}`
                          : 'Worker Applicant'}
                      </Text>

                      <Button
                        label={getActionLabel(activeApp.status)}
                        variant="primary"
                        size="base"
                        fullWidth
                        onPress={() =>
                          navigation.navigate('ApplicantDetail', {
                            applicantId: activeApp.id,
                            applicantName: activeApp.worker?.name || 'Worker Applicant',
                            jobTitle: job?.title || '',
                            status: activeApp.status,
                            barangay: activeApp.worker?.barangay,
                            municipality: activeApp.worker?.municipality,
                            reputationScore: activeApp.worker?.reputation_score,
                            bio:
                              activeApp.worker?.workerProfile?.bio ||
                              (activeApp.worker as any)?.bio,
                            skills: activeApp.worker?.skills,
                            experiences: activeApp.worker?.experiences,
                            characterReferences:
                              activeApp.worker?.character_references || undefined,
                            phone: activeApp.worker?.phone || undefined,
                            emergencyContactName: (activeApp.worker as any)?.emergency_contact_name,
                            emergencyContactPhone: (activeApp.worker as any)
                              ?.emergency_contact_phone,
                            coverNote: activeApp.cover_note || undefined,
                          })
                        }
                      />
                    </View>
                  ))}
                </View>
              );
            })()}

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
                {job.categories && job.categories.length > 0
                  ? job.categories.join(' · ')
                  : 'General'}
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
                    Slots: {job.filled_slots ?? job.accepted_count ?? 0} / {job.slots} hired
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons name="heart-outline" size={16} color={colors.error} />
                  <Text style={styles.metaValue}>{job.reactions_count || 0} interested</Text>
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

              {(parsedPhotos.length > 0 || job.video_url) && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>
                    Attachments & Media ({parsedPhotos.length + (job.video_url ? 1 : 0)})
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingTop: 6 }}
                  >
                    {parsedPhotos.map((photoUrl: string, idx: number) => (
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
              )}
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
                          <Text style={styles.statusBadgeTextSmall}>
                            {getStageLabel(app.status)}
                          </Text>
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
                    <Text style={styles.cancelBtnText}>Cancel Job</Text>
                  </TouchableOpacity>
                </>
              )}

              {job.status === 'cancelled' && (
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.inkSoft }]}
                  onPress={handleDeleteJob}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.inkSoft }]}>
                    Delete Job Post
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
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
  scrollContent: { padding: 20, gap: 16, paddingBottom: 20 },
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
  completedHeroCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.base,
  },
  completedHeroGlow: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(187, 247, 208, 0.4)',
  },
  completedHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.paperCream,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  refText: {
    fontFamily: fonts.numericBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  completedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedStatusBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#15803D',
  },
  celebrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  celebrationEmoji: {
    fontSize: 26,
  },
  celebrationTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: '#15803D',
  },
  celebrationSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  completedJobTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 28,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
    alignItems: 'center',
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: fonts.numericBold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },
  metricSub: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pendingReviewsBadge: {
    backgroundColor: colors.butter + '80',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pendingReviewsBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.gold,
  },
  noWorkersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  noWorkersText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  completedWorkerCard: {
    backgroundColor: colors.paperCream,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  completedWorkerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workerNameText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  workerLocationText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  agreedPayBadge: {
    backgroundColor: colors.paperBright,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  agreedPayText: {
    fontFamily: fonts.numericBold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  workerRatingBox: {
    backgroundColor: colors.paperBright,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  ratingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.butter + '70',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  starScoreText: {
    fontFamily: fonts.numericBold,
    fontSize: 12,
    color: colors.ink,
  },
  ratingSubmittedText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#15803D',
  },
  reviewCommentQuote: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 17,
  },
  ratingPendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingPendingText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  workerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  workerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.paperBright,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  workerActionBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: colors.paperCream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
  },
  subsectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 6,
  },
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
