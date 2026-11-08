import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { colors, fonts, shadows } from '../../theme';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { Avatar } from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { useReviews } from '../../hooks/useReviews';
import { useApplication } from '../../hooks/useJobApplications';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAlert } from '../../contexts/AlertContext';
import { messagesApi } from '../../api/messages';

type WorkerPublicProfileRouteProp = RouteProp<EmployerStackParamList, 'WorkerPublicProfile'>;

export const WorkerPublicProfileScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const route = useRoute<WorkerPublicProfileRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  const { showAlert } = useAlert();

  const {
    workerId,
    applicationId,
    workerName: passedWorkerName,
    avatarUrl: passedAvatarUrl,
    verificationBadge: passedVerificationBadge,
    reputationScore: passedReputationScore,
    completedJobsCount: passedCompletedJobsCount,
    barangay: passedBarangay,
    municipality: passedMunicipality,
    bio: passedBio,
    skills: passedSkills,
    experiences: passedExperiences,
    characterReferences: passedCharacterReferences,
    phone: passedPhone,
    status: passedStatus,
  } = route.params;

  // 1. Fetch live application data if applicationId is passed
  const {
    data: rawAppData,
    isLoading: isLoadingApp,
    refetch: refetchApp,
  } = useApplication(applicationId || 0);
  const appData = ((rawAppData as any)?.data ?? rawAppData) as any;

  // 2. Fetch live worker public profile from backend
  const targetWorkerId = workerId || appData?.worker?.id;
  const {
    data: publicProfile,
    isLoading: isLoadingPublicProfile,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['workerPublicProfile', targetWorkerId],
    queryFn: () => apiClient<any>(`/workers/${targetWorkerId}/public-profile`),
    enabled: !!targetWorkerId,
  });

  // 3. Fetch reviews for this worker
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
  } = useReviews(targetWorkerId, 'worker');

  const isRefreshing = isLoadingApp || isLoadingPublicProfile || isLoadingReviews;

  const handleRefresh = () => {
    if (applicationId) refetchApp();
    if (targetWorkerId) {
      refetchProfile();
      refetchReviews();
    }
  };

  // Resolved Worker Attributes
  const workerName = publicProfile?.name || appData?.worker?.name || passedWorkerName || 'Worker';
  const avatarUrl = publicProfile?.avatar_url || appData?.worker?.avatar_url || passedAvatarUrl;
  const barangay = publicProfile?.barangay || appData?.worker?.barangay || passedBarangay;
  const municipality =
    publicProfile?.municipality || appData?.worker?.municipality || passedMunicipality;
  const isVerified =
    publicProfile?.verification_badge !== undefined
      ? Boolean(publicProfile.verification_badge)
      : appData?.worker?.verification_badge !== undefined
        ? Boolean(appData.worker.verification_badge)
        : Boolean(passedVerificationBadge);

  const reputationScore =
    publicProfile?.reputation_score !== undefined && publicProfile?.reputation_score !== null
      ? publicProfile.reputation_score
      : appData?.worker?.reputation_score !== undefined &&
          appData?.worker?.reputation_score !== null
        ? appData.worker.reputation_score
        : reviewsData?.reputation_score !== undefined && reviewsData.reputation_score > 0
          ? reviewsData.reputation_score
          : passedReputationScore;

  const reviews = reviewsData?.reviews || appData?.worker?.reviews || [];
  const reviewsCount = reviewsData?.reviews_count ?? publicProfile?.ratings_count ?? reviews.length;

  const completedJobsCount =
    publicProfile?.completed_jobs_count ??
    appData?.worker?.completed_jobs_count ??
    passedCompletedJobsCount ??
    0;

  const bio =
    publicProfile?.bio || appData?.worker?.workerProfile?.bio || appData?.worker?.bio || passedBio;

  const skills: string[] =
    publicProfile?.skills ||
    appData?.worker?.skills ||
    appData?.worker?.workerProfile?.skills?.map((s: any) => (typeof s === 'string' ? s : s.name)) ||
    passedSkills ||
    [];

  const experiences: any[] =
    publicProfile?.experiences ||
    appData?.worker?.experiences ||
    appData?.worker?.workerProfile?.experiences ||
    passedExperiences ||
    [];

  const status = appData?.status || passedStatus || 'pending';

  // SIKAP Progressive Disclosure Privacy Rules
  const isReferencesUnlocked =
    [
      'shortlisted',
      'pending_negotiation',
      'employer_requested',
      'employer_confirmed',
      'accepted',
      'completed',
    ].includes(status) || Boolean(appData?.references_revealed);

  const isPhoneUnlocked =
    ['accepted', 'completed', 'hired'].includes(status) || Boolean(appData?.contact_revealed);

  const characterReferences: any[] =
    appData?.worker?.character_references || passedCharacterReferences || [];
  const phone = appData?.worker?.phone || passedPhone;

  const handleReportWorker = () => {
    if (!targetWorkerId) return;
    navigation.navigate('Report', {
      id: Number(targetWorkerId),
      type: 'user',
      reportable_id: Number(targetWorkerId),
      reportable_type: 'user',
    });
  };

  const handleOpenChat = async () => {
    try {
      if (appData?.conversation_id) {
        navigation.navigate('Chat', {
          conversationId: appData.conversation_id,
          jobTitle: appData?.job?.title || 'Job',
          otherUserName: workerName,
        });
        return;
      }
      const res = await messagesApi.getConversations('employer');
      const convList: any[] = Array.isArray((res as any)?.data)
        ? (res as any).data
        : Array.isArray(res)
          ? (res as any)
          : [];
      const conv = convList.find(
        (c: any) =>
          (applicationId && c.application_id === applicationId) ||
          c.other_user?.id === targetWorkerId,
      );
      if (conv) {
        navigation.navigate('Chat', {
          conversationId: conv.id,
          jobTitle: conv.job_title || appData?.job?.title || 'Job',
          otherUserName: conv.other_user?.name || workerName,
        });
      } else {
        showAlert(
          'Chat Not Found',
          'A conversation will be created when you shortlist this applicant or initiate chat.',
        );
      }
    } catch {
      showAlert('Error', "Couldn't open chat. Please check your connection and try again.");
    }
  };

  const handleViewApplication = () => {
    if (applicationId) {
      navigation.navigate('ApplicantDetail', {
        applicantId: applicationId,
        jobTitle: appData?.job?.title,
        applicantName: workerName,
        status,
      });
    }
  };

  const formatScore = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === '' || val === 'N/A') return 'N/A';
    const num = Number(val);
    if (isNaN(num) || num <= 0) return '0.0';
    return num % 1 === 0 ? num.toFixed(1) : num.toFixed(1);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          testID="header-back-btn"
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text
          style={styles.appBarTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {t('worker_profile') || 'Worker Profile'}
        </Text>
        <TouchableOpacity
          testID="header-report-btn"
          style={styles.iconButton}
          onPress={handleReportWorker}
          accessibilityLabel="Report Worker"
        >
          <Ionicons name="flag-outline" size={20} color={colors.inkMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary, colors.primaryDark]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.paperBright}
          />
        }
      >
        {/* Profile Hero Card */}
        <View style={styles.profileHeaderCard}>
          {avatarUrl ? (
            <Image
              cachePolicy="memory-disk"
              priority="high"
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              transition={200}
            />
          ) : (
            <Avatar name={workerName} size={76} />
          )}

          <View style={styles.nameRow}>
            <Text style={styles.workerName}>{workerName}</Text>
            {isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.mintDeep}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>

          {isVerified ? (
            <View style={styles.verifiedChip}>
              <Ionicons name="shield-checkmark" size={14} color={colors.mintDeep} />
              <Text style={styles.verifiedText}>{t('verified_worker') || 'Verified Worker'}</Text>
            </View>
          ) : (
            <View style={styles.unverifiedChip}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.inkMuted} />
              <Text style={styles.unverifiedText}>
                {t('unverified_worker') || 'Unverified Worker'}
              </Text>
            </View>
          )}

          {/* Location */}
          {(barangay || municipality) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.locationText}>
                {[barangay, municipality].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Reputation Score Card - Frosted Crystal Glass */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('worker_reputation') || 'Worker Reputation'}</Text>
          <View style={styles.reputationWrapper}>
            <View style={styles.ambientGlowAzure} pointerEvents="none" />
            <View style={styles.ambientGlowGold} pointerEvents="none" />
            <View style={styles.reputationCard}>
              <View style={styles.scoreHeroRow}>
                <Text style={styles.bigScore}>{formatScore(reputationScore)}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  {reviewsCount > 0 && reputationScore && Number(reputationScore) > 0 ? (
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name="star"
                          size={18}
                          color={
                            s <= Math.round(Number(reputationScore || 0)) ? colors.gold : '#E2E8F0'
                          }
                        />
                      ))}
                    </View>
                  ) : null}
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft }}>
                    {reviewsCount > 0
                      ? `${t('overall_worker_rating') || 'Overall Worker Rating'} (${reviewsCount} ${
                          reviewsCount === 1 ? 'review' : 'reviews'
                        })`
                      : t('no_ratings_yet') || 'No ratings yet'}
                  </Text>
                </View>
              </View>

              {/* Stats divider & completed jobs */}
              <View style={styles.statsRowDivider}>
                <View style={styles.statBox}>
                  <Ionicons name="checkmark-done-circle-outline" size={20} color={colors.primary} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.statBoxNumber}>{completedJobsCount}</Text>
                    <Text style={styles.statBoxLabel}>
                      {completedJobsCount === 1 ? 'Job Completed' : 'Jobs Completed'}
                    </Text>
                  </View>
                </View>
                <View style={styles.statBox}>
                  <Ionicons name="ribbon-outline" size={20} color={colors.gold} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.statBoxNumber}>{isVerified ? 'Verified' : 'Pending'}</Text>
                    <Text style={styles.statBoxLabel}>ID Status</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* About / Bio Section */}
        {bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('about_worker') || 'About'}</Text>
            <View style={styles.contentCard}>
              <Text style={styles.bioText}>{bio}</Text>
            </View>
          </View>
        ) : null}

        {/* Skills Section */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('skills') || 'Skills'}</Text>
            <View style={styles.contentCard}>
              <View style={styles.skillsWrapper}>
                {skills.map((skill, index) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Work History Section */}
        {experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('work_history') || 'Work History'}</Text>
            <View style={styles.contentCard}>
              {experiences.map((exp: any, index: number) => {
                const jobTitle = exp.job_title || exp.title || 'Work Experience';
                const company = exp.company_name || exp.company;
                const startDate = exp.start_date;
                const endDate = exp.is_current ? 'Present' : exp.end_date;
                const dateStr = [startDate, endDate].filter(Boolean).join(' - ');

                return (
                  <View
                    key={exp.id || index}
                    style={[
                      styles.experienceItem,
                      index > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: colors.inkFaint,
                        paddingTop: 14,
                        marginTop: 14,
                      },
                    ]}
                  >
                    <View style={styles.expHeaderRow}>
                      <View style={styles.expIconBadge}>
                        <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.expTitle}>{jobTitle}</Text>
                        {company && <Text style={styles.expCompany}>{company}</Text>}
                        {dateStr ? <Text style={styles.expDates}>{dateStr}</Text> : null}
                      </View>
                    </View>
                    {exp.description ? (
                      <Text style={styles.expDescription}>{exp.description}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Character References Section (with Progressive Disclosure) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('character_references') || 'Character References'}
          </Text>
          <View style={styles.contentCard}>
            {!isReferencesUnlocked ? (
              <View style={styles.privacyShieldBox}>
                <Ionicons name="shield-outline" size={20} color={colors.inkMuted} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.privacyTitle}>
                    {t('privacy_shield_title') || 'Protected by SIKAP Privacy Shield'}
                  </Text>
                  <Text style={styles.privacyDesc}>
                    {t('privacy_shield_desc') ||
                      'Character references are unlocked once you shortlist this applicant to discuss work terms.'}
                  </Text>
                </View>
              </View>
            ) : characterReferences.length > 0 ? (
              characterReferences.map((ref: any, index: number) => {
                const refName = ref.name || 'Reference';
                const refRole = ref.relationship || ref.position || ref.company;
                const refPhone = ref.contact_number || ref.phone;

                return (
                  <View
                    key={ref.id || index}
                    style={[
                      styles.refItem,
                      index > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: colors.inkFaint,
                        paddingTop: 12,
                        marginTop: 12,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.refName}>{refName}</Text>
                      {refRole ? <Text style={styles.refRole}>{refRole}</Text> : null}
                      {refPhone ? (
                        <TouchableOpacity
                          style={styles.phoneLinkRow}
                          onPress={() => Linking.openURL(`tel:${refPhone}`)}
                        >
                          <Ionicons name="call-outline" size={13} color={colors.primary} />
                          <Text style={styles.phoneLinkText}>{refPhone}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {refPhone ? (
                      <TouchableOpacity
                        style={styles.phoneCallButton}
                        onPress={() => Linking.openURL(`tel:${refPhone}`)}
                      >
                        <Ionicons name="call" size={15} color={colors.primary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyNote}>No character references provided.</Text>
            )}
          </View>
        </View>

        {/* Contact Information (Unlocked in Stage 4) */}
        {isPhoneUnlocked && phone ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Direct Contact</Text>
            <View style={styles.contentCard}>
              <View style={styles.contactRow}>
                <View style={styles.contactIconBadge}>
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Mobile Number</Text>
                  <Text style={styles.contactValue}>{phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callActionButton}
                  onPress={() => Linking.openURL(`tel:${phone}`)}
                >
                  <Ionicons name="call" size={16} color={colors.white} />
                  <Text style={styles.callActionText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Employer Reviews Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('reviews_feedback') || 'Employer Reviews'} ({reviews.length})
          </Text>
          {reviews.length > 0 ? (
            reviews.map((rev: any, index: number) => {
              const reviewerName = rev.reviewer?.name || rev.reviewer_name || 'Employer';
              const rating = rev.overall_rating || 5;
              const comment = rev.comment;
              const dateStr = rev.created_at
                ? new Date(rev.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '';

              return (
                <View key={rev.id || index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Avatar name={reviewerName} size={36} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reviewerName}>{reviewerName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                              key={s}
                              name="star"
                              size={12}
                              color={s <= Math.round(rating) ? colors.gold : '#E2E8F0'}
                            />
                          ))}
                        </View>
                        {dateStr ? <Text style={styles.reviewDate}> • {dateStr}</Text> : null}
                      </View>
                    </View>
                  </View>
                  {comment ? <Text style={styles.reviewComment}>{comment}</Text> : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyReviewsCard}>
              <Ionicons name="chatbox-ellipses-outline" size={32} color={colors.inkFaint} />
              <Text style={styles.emptyReviewsTitle}>
                {t('no_reviews_yet') || 'No reviews yet'}
              </Text>
              <Text style={styles.emptyReviewsSub}>
                Reviews from employers who completed jobs with {workerName} will appear here.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Docked Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.bottomBarRow}>
          {applicationId ? (
            <Button
              label={t('view_application_btn') || 'View Application'}
              variant="outline"
              size="base"
              style={{ flex: 1 }}
              onPress={handleViewApplication}
            />
          ) : null}
          <Button
            label={t('message_worker_btn') || 'Message Worker'}
            variant="primary"
            size="base"
            style={{ flex: 1 }}
            onPress={handleOpenChat}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileHeaderCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    ...shadows.sm,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: colors.paperBright,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  workerName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  verifiedText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.mintDeep,
  },
  unverifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    gap: 4,
  },
  unverifiedText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 10,
  },
  reputationWrapper: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  ambientGlowAzure: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  ambientGlowGold: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
  },
  reputationCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    ...shadows.sm,
  },
  scoreHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bigScore: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.ink,
  },
  statsRowDivider: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
    paddingTop: 14,
    marginTop: 14,
    gap: 16,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  statBoxNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  statBoxLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
  },
  contentCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    ...shadows.sm,
  },
  bioText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 22,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: colors.paperCream,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  skillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
  experienceItem: {
    gap: 6,
  },
  expHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  expIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.paperCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  expTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  expCompany: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  expDates: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  expDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 18,
    marginLeft: 42,
  },
  privacyShieldBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.paper,
    padding: 14,
    borderRadius: 14,
  },
  privacyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 4,
  },
  privacyDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 18,
  },
  refItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  refRole: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  phoneLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  phoneLinkText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
  phoneCallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.paperCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paperCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
  },
  contactValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  callActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
  },
  callActionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.white,
  },
  reviewCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    ...shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  reviewDate: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
  },
  reviewComment: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
    marginTop: 8,
  },
  emptyReviewsCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    ...shadows.sm,
  },
  emptyReviewsTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginTop: 8,
  },
  emptyReviewsSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.paperBright,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
    paddingHorizontal: 20,
    paddingTop: 12,
    ...shadows.base,
  },
  bottomBarRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default WorkerPublicProfileScreen;
