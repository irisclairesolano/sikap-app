import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image } from 'expo-image';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { useJob } from '../../hooks/useJob';
import { useSavedJobs, useToggleSaveJob } from '../../hooks/useSavedJobs';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { Avatar } from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { useReactToJob } from '../../hooks/useReactToJob';
import { getShareLink } from '../../api/jobs';
import { ReportJobSheet } from '../../components/jobs/ReportJobSheet';
import { MediaViewerModal } from '../../components/common/MediaViewerModal';

type JobDetailsRouteProp = RouteProp<WorkerStackParamList, 'JobDetails'>;

export const JobDetailsScreen: React.FC = () => {
  const route = useRoute<JobDetailsRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const id = Number(route.params.id);
  const insets = useSafeAreaInsets();

  const { data: job, isLoading, isError, error } = useJob(id);
  const { data: savedJobsData } = useSavedJobs();
  const { mutate: toggleSave, isPending: isSaving } = useToggleSaveJob();
  const [reportSheetVisible, setReportSheetVisible] = useState(false);
  const [viewerMedia, setViewerMedia] = useState<{ type: 'photo' | 'video'; url: string } | null>(
    null,
  );
  const { mutate: toggleReact, isPending: isReacting } = useReactToJob();

  const isSaved = savedJobsData?.data?.some((j) => j.id === id) || false;

  const handleToggleSave = () => {
    toggleSave(id);
  };

  const handleReact = () => {
    if (job) toggleReact(job.id);
  };

  const handleShare = async () => {
    if (!job) return;
    try {
      const result = await getShareLink(job.id);
      await Share.share({
        message: `Check out this job on SIKAP!\n\n${result.job_title}\n${result.share_link}`,
      });
    } catch (err: any) {
      if (err?.response?.status === 410) {
        Alert.alert('Job Closed', 'This job is no longer available.');
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (isError || !job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
        <ErrorBanner message={error?.message || 'Failed to load job details.'} />
      </SafeAreaView>
    );
  }

  const isUrgent = !!(job?.is_urgent || job?.urgent);
  const isVerified = job.employer?.verification_badge;

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Posted ${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Posted ${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `Posted ${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `Posted ${diffInMonths}mo ago`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>

        <View style={styles.postedChip}>
          <Text style={styles.postedText}>{getRelativeTime(job.created_at)}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setReportSheetVisible(true)}>
            <Ionicons name="flag-outline" size={22} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleToggleSave}
            disabled={isSaving}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? colors.primary : colors.ink}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category & Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>
              {Array.isArray(job.categories)
                ? job.categories
                    .filter((c: string) => c && c.trim().length > 1 && c.toLowerCase() !== 'hi')
                    .join(' · ') ||
                  job.category ||
                  'General'
                : job.category || 'General'}
            </Text>
          </View>
          {isUrgent && (
            <View style={[styles.badge, styles.badgeUrgent]}>
              <Ionicons name="flame" size={10} color={colors.error} />
              <Text style={[styles.badgeText, { color: colors.error }]}>URGENT</Text>
            </View>
          )}
          {isVerified && <Ionicons name="checkmark-circle" size={18} color="#22C55E" />}
        </View>

        {/* Title */}
        <Text style={styles.title}>{job.title}</Text>

        {/* Peach Pay Card Hero */}
        <View style={styles.payCard}>
          <View style={styles.payRow}>
            <Text style={styles.paySymbol}>₱</Text>
            <Text style={styles.payValue}>{job.compensation}</Text>
          </View>
          <Text style={styles.payPeriod}>
            per {job.duration} {job.duration_unit}
          </Text>
        </View>

        {/* Info Cards Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="location" size={20} color={colors.primaryDark} />
            </View>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {job.municipality}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="people" size={20} color={colors.primaryDark} />
            </View>
            <Text style={styles.infoLabel}>Slots</Text>
            <Text style={styles.infoValue}>
              {job.accepted_count || 0} / {job.slots || 1} filled
            </Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.descriptionText}>{job.description}</Text>
        </View>

        {/* Tools Required Section */}
        {job.tools_required ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tools Required</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.paperBright,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.inkFaint,
                gap: 8,
              }}
            >
              <Ionicons name="construct-outline" size={18} color={colors.primary} />
              <Text
                style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, flex: 1 }}
              >
                {job.tools_required}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Media Attachments Section */}
        {((job.photos && job.photos.length > 0) || job.video_url) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attachments & Media</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingTop: 6 }}
            >
              {job.photos?.map((photoUrl: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => setViewerMedia({ type: 'photo', url: photoUrl })}
                >
                  <Image
                    source={{ uri: photoUrl }}
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: 14,
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
                      borderRadius: 10,
                    }}
                  >
                    <Ionicons name="expand-outline" size={14} color={colors.white} />
                  </View>
                </TouchableOpacity>
              ))}

              {job.video_url && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setViewerMedia({ type: 'video', url: job.video_url! })}
                  style={{
                    width: 150,
                    height: 110,
                    borderRadius: 14,
                    backgroundColor: '#1E1E1E',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="play-circle" size={40} color={colors.white} />
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
          </View>
        )}

        {/* Employer Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Employer</Text>
          <TouchableOpacity
            style={styles.employerCard}
            activeOpacity={0.8}
            onPress={() => {
              (navigation as any).navigate('EmployerPublicProfile', {
                employerId: job.employer_id,
                employerName: job.employer?.name,
                avatarUrl: job.employer?.avatar_url,
                verificationBadge: job.employer?.verification_badge,
                reputationScore: job.employer?.reputation_score,
                barangay: job.barangay,
                municipality: job.municipality,
                businessDocuments: job.employer?.employer_profile?.business_documents || [],
              });
            }}
          >
            <Avatar name={job.employer?.name || 'Unknown'} size={48} />

            <View style={[styles.employerInfo, { flex: 1 }]}>
              <View style={styles.employerNameRow}>
                <Text style={styles.employerName}>{job.employer?.name || 'Unknown'}</Text>
                {job.employer?.verification_badge && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.mintDeep}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>

              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 11,
                  color: colors.primary,
                  marginTop: 2,
                }}
              >
                Tap to view public profile & verification docs →
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
          </TouchableOpacity>
        </View>

        <ReportJobSheet
          visible={reportSheetVisible}
          onClose={() => setReportSheetVisible(false)}
          jobId={job.id}
          jobTitle={job.title}
        />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {job.is_applied || job.has_applied || job.application_id ? (
          <View style={styles.alreadyAppliedCard}>
            <View style={styles.alreadyAppliedRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.mintDeep} />
              <Text style={styles.alreadyAppliedTitle}>You have already applied for this job.</Text>
            </View>
            <TouchableOpacity
              style={styles.alreadyAppliedBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (job.application_id) {
                  (navigation as any).navigate('ApplicationDetail', {
                    applicationId: job.application_id,
                  });
                } else {
                  (navigation as any).navigate('Mine');
                }
              }}
            >
              <Text style={styles.alreadyAppliedBtnText}>
                Click here to manage your application →
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            label="Apply for this job"
            size="lg"
            onPress={() => navigation.navigate('Apply', { id: job.id })}
            fullWidth
          />
        )}
      </View>

      <MediaViewerModal
        visible={!!viewerMedia}
        media={viewerMedia}
        onClose={() => setViewerMedia(null)}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postedChip: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  postedText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  scrollContent: {
    paddingHorizontal: 26,
    paddingBottom: 40,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  categoryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.ink,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  badgeUrgent: {
    backgroundColor: colors.status.rejected.bg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.8,
    marginBottom: 20,
  },
  payCard: {
    backgroundColor: colors.peach,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  paySymbol: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.primaryDark,
    marginTop: 6,
    marginRight: 4,
  },
  payValue: {
    fontFamily: fonts.numericBold,
    fontSize: 52,
    color: colors.primaryDark,
    lineHeight: 60,
    letterSpacing: -1,
  },
  payPeriod: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.primaryDark,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 32,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 18,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 14,
  },
  descriptionText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.inkMuted,
  },
  employerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    padding: 16,
    borderRadius: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  employerInfo: {
    marginLeft: 14,
    flex: 1,
  },
  employerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  employerName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  employerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginLeft: 4,
  },
  statDot: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkFaint,
    marginHorizontal: 6,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.paperBright,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  alreadyAppliedCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.mint,
    alignItems: 'center',
  },
  alreadyAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alreadyAppliedTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  alreadyAppliedBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  alreadyAppliedBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

const detailActionBar = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF8',
    borderRadius: 16,
    padding: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E0D8',
  },
  text: {
    fontSize: 13,
    color: '#8C7B6A',
    fontWeight: '500',
  },
  textActive: {
    color: '#E85D75',
    fontWeight: '700',
  },
});

export default JobDetailsScreen;
