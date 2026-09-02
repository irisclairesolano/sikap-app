import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { useAuthCheck } from '../../hooks/useAuthCheck';
import Button from '../../components/common/Button';

import { useFocusEffect } from '@react-navigation/native';
import { useEmployerJobs } from '../../hooks/useEmployerJobs';
import { JobPost } from '../../types';

import { DashboardSkeleton } from '../../components/common/SkeletonLoader';
import { RefreshableContainer } from '../../components/common/RefreshableContainer';

export const EmployerDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  const { user } = useAuthCheck();

  const { data: jobsResponse, isLoading: loading, refetch, isRefetching } = useEmployerJobs();
  const [actionPage, setActionPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const allJobs: JobPost[] = jobsResponse?.data || [];
  const activeJobs = allJobs.filter(
    (j: JobPost) =>
      (j.status as string) === 'open' ||
      (j.status as string) === 'closed_in_progress' ||
      (j.status as string) === 'in_progress',
  );

  const totalHires = allJobs.reduce((acc, j) => {
    const hiredCount = (j.applications || []).filter(
      (a: any) =>
        a.status === 'accepted' || a.status === 'completed' || a.status === 'employer_confirmed',
    ).length;
    return acc + (j.accepted_count || hiredCount);
  }, 0);

  const totalPaid = allJobs.reduce((acc, j) => {
    const completedApps = (j.applications || []).filter(
      (a: any) => a.status === 'completed' || a.status === 'accepted',
    );
    const paid = completedApps.reduce(
      (pAcc: number, a: any) =>
        pAcc + (Number(a.final_agreed_price) || Number(j.compensation) || 0),
      0,
    );
    return acc + paid;
  }, 0);

  const reputationFormatted =
    user?.reputation_score !== undefined && user?.reputation_score !== null
      ? Number(user.reputation_score).toFixed(1)
      : '5.0';

  if (loading && !jobsResponse) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  const getInitial = (name?: string) => (name ? name.charAt(0).toUpperCase() : 'E');

  // Flatten all applications across jobs to create individual action items
  const allActions = allJobs.flatMap((job) =>
    (job.applications || []).map((app) => {
      const isDone =
        app.status === 'completed' || app.status === 'rejected' || app.status === 'withdrawn';
      let title = 'Review application';
      let description = `${app.worker?.name || 'Worker'} applied for ${job.title}`;
      let stageBadge = 'Stage 1 · Review';
      let badgeBg: string = colors.urgentSoft;
      let badgeColor: string = colors.urgent;
      let iconName: any = 'person-outline';
      let borderColor: string = colors.urgentSoft;

      switch (app.status as string) {
        case 'pending':
          title = `Review application`;
          description = `${app.worker?.name || 'Worker'} applied for ${job.title}`;
          stageBadge = 'Stage 1 · Review';
          badgeBg = colors.urgentSoft;
          badgeColor = colors.urgent;
          iconName = 'people-outline';
          borderColor = colors.urgentSoft;
          break;
        case 'employer_requested':
        case 'pending_negotiation':
          title = `Confirm terms & hire`;
          description = `Shortlisted ${app.worker?.name || 'Worker'} for ${job.title}`;
          stageBadge = 'Stage 2 · Negotiation';
          badgeBg = colors.peach;
          badgeColor = colors.primaryDark;
          iconName = 'chatbubbles-outline';
          borderColor = colors.peach;
          break;
        case 'employer_confirmed':
          title = `Offer awaiting response`;
          description = `Offer sent to ${app.worker?.name || 'Worker'} for ${job.title}`;
          stageBadge = 'Stage 3 · Offer Sent';
          badgeBg = colors.butter;
          badgeColor = colors.ink;
          iconName = 'time-outline';
          borderColor = colors.butter;
          break;
        case 'accepted':
        case 'hired':
          title = `Job in progress`;
          description = `${app.worker?.name || 'Worker'} is working on ${job.title}`;
          stageBadge = 'Stage 4 · In Progress';
          badgeBg = colors.mint;
          badgeColor = colors.mintDeep;
          iconName = 'construct-outline';
          borderColor = colors.mint;
          break;
        case 'completed':
          title = `Rate & review worker`;
          description = `Completed job with ${app.worker?.name || 'Worker'} on ${job.title}`;
          stageBadge = 'Stage 5 · Done';
          badgeBg = '#E0DED4';
          badgeColor = colors.inkSoft;
          iconName = 'checkmark-done-circle-outline';
          borderColor = colors.inkFaint;
          break;
        default:
          title = `Application status: ${app.status}`;
          description = `${app.worker?.name || 'Worker'} on ${job.title}`;
          stageBadge = app.status;
          badgeBg = colors.inkFaint;
          badgeColor = colors.inkSoft;
          iconName = 'information-circle-outline';
          borderColor = colors.inkFaint;
          break;
      }

      return {
        id: app.id,
        app,
        job,
        title,
        description,
        stageBadge,
        badgeBg,
        badgeColor,
        iconName,
        borderColor,
        isDone,
      };
    }),
  );

  // Active items first, then completed items
  const sortedActions = [...allActions].sort((a, b) => {
    if (a.isDone === b.isDone) return 0;
    return a.isDone ? 1 : -1;
  });

  const pendingCount = allActions.filter((a) => !a.isDone).length;
  const totalActionPages = Math.ceil(sortedActions.length / ITEMS_PER_PAGE) || 1;
  const paginatedActions = sortedActions.slice(
    (actionPage - 1) * ITEMS_PER_PAGE,
    actionPage * ITEMS_PER_PAGE,
  );

  // Flatten recent applicants
  const allRecentApplicants = allJobs.flatMap((j) =>
    (j.applications || []).map((app) => ({ ...app, jobTitle: j.title, jobId: j.id })),
  );

  const navigateToApplicantDetail = (app: any, jobTitle: string) => {
    navigation.navigate('ApplicantDetail', {
      applicantId: Number(app.id),
      applicantName: app.worker?.name || 'Worker Applicant',
      jobTitle: jobTitle || '',
      status: app.status || 'pending',
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
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(user?.name || 'Employer')}</Text>
          </View>
          <View>
            <Text style={styles.greetingSmall}>Hi,</Text>
            <Text style={styles.greetingName}>
              {user?.name ? user.name.split(' ')[0] : 'Employer'}
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

      <RefreshableContainer
        onRefresh={async () => {
          await refetch();
        }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid - Informational & Non-clickable */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.peach }]}>
            <Text style={[styles.statNum, { color: colors.primaryDark }]}>{activeJobs.length}</Text>
            <Text style={[styles.statLabel, { color: colors.primaryDark }]}>Active jobs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.mint }]}>
            <Text style={[styles.statNum, { color: colors.mintDeep }]}>{totalHires}</Text>
            <Text style={[styles.statLabel, { color: colors.mintDeep }]}>Total hires</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.butter }]}>
            <Text style={[styles.statNum, { color: colors.ink }]}>
              ₱{totalPaid.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.inkSoft }]}>Total paid</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.sky }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[styles.statNum, { color: colors.skyDeep }]}>{reputationFormatted}</Text>
              <Ionicons
                name="star"
                size={14}
                color={colors.skyDeep}
                style={{ marginLeft: 2, marginBottom: 4 }}
              />
            </View>
            <Text style={[styles.statLabel, { color: colors.skyDeep }]}>Reputation</Text>
          </View>
        </View>

        <Button
          label="Post a new job"
          size="lg"
          fullWidth
          icon="add-circle-outline"
          onPress={() => navigation.navigate('PostJob')}
          style={{ marginTop: 24 }}
        />

        {/* Action Required Section */}
        <View style={styles.actionHeader}>
          <Text style={styles.sectionHeaderTitle}>Action required</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{pendingCount}</Text>
          </View>
        </View>

        <View style={styles.listContainer}>
          {sortedActions.length === 0 ? (
            <View style={[styles.actionCard, { borderColor: colors.inkFaint }]}>
              <View style={[styles.actionIconBox, { backgroundColor: colors.paperBright }]}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.mintDeep} />
              </View>
              <View style={styles.jobDetails}>
                <Text style={styles.jobTitle}>All caught up!</Text>
                <Text style={styles.jobSubtitle}>No pending actions required right now</Text>
              </View>
            </View>
          ) : (
            paginatedActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionCard,
                  {
                    borderColor: action.borderColor,
                    backgroundColor: action.isDone ? '#ECEAE2' : colors.paperBright,
                    opacity: action.isDone ? 0.85 : 1,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => navigateToApplicantDetail(action.app, action.job.title)}
              >
                <View
                  style={[
                    styles.actionIconBox,
                    {
                      backgroundColor: action.isDone ? '#DEDCD2' : action.badgeBg,
                    },
                  ]}
                >
                  <Ionicons
                    name={action.iconName}
                    size={22}
                    color={action.isDone ? colors.inkSoft : action.badgeColor}
                  />
                </View>
                <View style={styles.jobDetails}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}
                  >
                    <Text
                      style={[
                        styles.jobTitle,
                        { color: action.isDone ? colors.inkSoft : colors.ink },
                      ]}
                    >
                      {action.title}
                    </Text>
                    {action.isDone && (
                      <View style={styles.doneMarker}>
                        <Ionicons name="checkmark" size={10} color={colors.white} />
                        <Text style={styles.doneMarkerText}>DONE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.jobSubtitle} numberOfLines={1}>
                    {action.description}
                  </Text>
                  <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                    <View
                      style={[
                        styles.stageBadgeContainer,
                        { backgroundColor: action.isDone ? '#DEDCD2' : action.badgeBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stageBadgeText,
                          { color: action.isDone ? colors.inkSoft : action.badgeColor },
                        ]}
                      >
                        {action.stageBadge}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={action.isDone ? colors.inkFaint : colors.inkLight}
                />
              </TouchableOpacity>
            ))
          )}

          {/* Pagination Controls */}
          {totalActionPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, actionPage === 1 && styles.pageBtnDisabled]}
                disabled={actionPage === 1}
                onPress={() => setActionPage((p) => Math.max(1, p - 1))}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={actionPage === 1 ? colors.inkFaint : colors.ink}
                />
                <Text style={[styles.pageBtnText, actionPage === 1 && styles.pageBtnTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageIndicator}>
                Page {actionPage} of {totalActionPages}
              </Text>

              <TouchableOpacity
                style={[styles.pageBtn, actionPage === totalActionPages && styles.pageBtnDisabled]}
                disabled={actionPage === totalActionPages}
                onPress={() => setActionPage((p) => Math.min(totalActionPages, p + 1))}
              >
                <Text
                  style={[
                    styles.pageBtnText,
                    actionPage === totalActionPages && styles.pageBtnTextDisabled,
                  ]}
                >
                  Next
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={actionPage === totalActionPages ? colors.inkFaint : colors.ink}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Real Dynamic Recent Applicants */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: 32, marginBottom: 12 }]}>
          Recent applicants
        </Text>

        <View style={styles.listContainer}>
          {allRecentApplicants.length === 0 ? (
            <View style={[styles.applicantCard, { justifyContent: 'center', paddingVertical: 20 }]}>
              <Ionicons
                name="people-outline"
                size={28}
                color={colors.inkLight}
                style={{ marginRight: 12 }}
              />
              <View style={styles.jobDetails}>
                <Text style={styles.jobTitle}>No applicants yet</Text>
                <Text style={styles.jobSubtitle}>
                  Applicants will appear here when workers apply
                </Text>
              </View>
            </View>
          ) : (
            allRecentApplicants.slice(0, 3).map((app, index) => (
              <TouchableOpacity
                key={app.id || index}
                style={styles.applicantCard}
                activeOpacity={0.7}
                onPress={() => navigateToApplicantDetail(app, (app as any).jobTitle || '')}
              >
                <View style={styles.applicantAvatar}>
                  <Text style={styles.applicantAvatarText}>
                    {(app.worker?.name || 'W').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.jobDetails}>
                  <Text style={styles.jobTitle}>{app.worker?.name || 'Worker Applicant'}</Text>
                  <Text style={styles.jobSubtitle}>Applied for {(app as any).jobTitle}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={styles.ratingText}>
                      {app.worker?.reputation_score !== undefined &&
                      app.worker?.reputation_score !== null
                        ? app.worker.reputation_score
                        : 5.0}{' '}
                      • {app.status}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </RefreshableContainer>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
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
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.skyDeep,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  statCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontFamily: fonts.numericBold,
    fontSize: 26,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doneMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inkSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  doneMarkerText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.white,
    letterSpacing: 0.5,
  },
  stageBadgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stageBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.paperBright,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    gap: 4,
  },
  pageBtnDisabled: {
    opacity: 0.4,
    borderColor: 'transparent',
  },
  pageBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
  },
  pageBtnTextDisabled: {
    color: colors.inkFaint,
  },
  pageIndicator: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  listContainer: {
    gap: 10,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 12,
  },
  badgeCount: {
    backgroundColor: colors.urgent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCountText: {
    color: colors.white,
    fontFamily: fonts.numericBold,
    fontSize: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  applicantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantAvatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.mintDeep,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.paperBright,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontFamily: fonts.numeric,
    fontSize: 12,
    color: colors.inkMuted,
    marginLeft: 4,
  },
  timeTag: {
    alignSelf: 'flex-start',
  },
  timeTagText: {
    fontFamily: fonts.numeric,
    fontSize: 11,
    color: colors.inkMuted,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 12,
    paddingRight: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    gap: 12,
  },
  jobIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobDetails: {
    flex: 1,
  },
  jobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 2,
  },
  jobSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  jobApplicantsNum: {
    fontFamily: fonts.numericBold,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  newBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default EmployerDashboardScreen;
