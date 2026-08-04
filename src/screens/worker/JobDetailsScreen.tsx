import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

type JobDetailsRouteProp = RouteProp<WorkerStackParamList, 'JobDetails'>;

export const JobDetailsScreen: React.FC = () => {
  const route = useRoute<JobDetailsRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const { id } = route.params;
  const insets = useSafeAreaInsets();

  const { data: job, isLoading, isError, error } = useJob(id);
  const { data: savedJobsData } = useSavedJobs();
  const { mutate: toggleSave, isPending: isSaving } = useToggleSaveJob();

  const isSaved = savedJobsData?.data?.some((j) => j.id === id) || false;

  const handleToggleSave = () => {
    toggleSave(id);
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

  const isUrgent = false; // Mock for now
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

        <TouchableOpacity style={styles.iconButton} onPress={handleToggleSave} disabled={isSaving}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isSaved ? colors.primary : colors.ink}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category & Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{job.categories?.join(', ') || 'Other'}</Text>
          </View>
          {isUrgent && (
            <View style={[styles.badge, styles.badgeUrgent]}>
              <Ionicons name="flame" size={10} color={colors.error} />
              <Text style={[styles.badgeText, { color: colors.error }]}>URGENT</Text>
            </View>
          )}
          {isVerified && (
            <View style={[styles.badge, styles.badgeVerified]}>
              <Ionicons name="checkmark-circle" size={10} color={colors.mintDeep} />
              <Text style={[styles.badgeText, { color: colors.mintDeep }]}>VERIFIED</Text>
            </View>
          )}
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

        {/* Employer Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Employer</Text>
          <View style={styles.employerCard}>
            <Avatar name={job.employer?.name || 'Unknown'} size={48} />

            <View style={styles.employerInfo}>
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

              <View style={styles.employerStats}>
                <Ionicons name="star" size={12} color={colors.gold} />
                <Text style={styles.statText}>{job.employer?.reputation_score || 'New'}</Text>
                <Text style={styles.statDot}>·</Text>
                <Text style={styles.statText}>2 hires</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24 }]}
      >
        <Button
          label="Apply for this job"
          size="lg"
          onPress={() => navigation.navigate('Apply', { id: job.id })}
          fullWidth
        />
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
  badgeVerified: {
    backgroundColor: colors.mint,
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
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: colors.paperBright,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});

export default JobDetailsScreen;
