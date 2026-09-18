import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import { profileApi } from '../../api/profile';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RefreshableContainer } from '../../components/common/RefreshableContainer';
import { useAuth } from '../../hooks/useAuth';
import { useEmployerJobs } from '../../hooks/useEmployerJobs';
import { useReviews } from '../../hooks/useReviews';

type EmployerProfileScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'ProfileMain'
>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<EmployerProfileScreenNavigationProp>();
  const { user: authUser, refetchProfile } = useAuth();
  const queryClient = useQueryClient();
  const { data: jobsResponse } = useEmployerJobs();
  const { data: reviewsData } = useReviews(undefined, 'employer');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    initialData: () => (queryClient.getQueryData(['profile']) as any) || authUser,
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (isLoading || (!user && !authUser)) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}
        edges={['top', 'left', 'right']}
      >
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const profileUser = user || authUser;
  const activeJobsCount = (jobsResponse?.data || []).filter(
    (j) => j.status === 'open' || j.status === 'closed_in_progress',
  ).length;

  const latestReview = reviewsData?.reviews?.[0];
  const recentReview = latestReview
    ? {
        worker: latestReview.reviewer?.name || 'Worker',
        stars: latestReview.overall_rating,
        comment: latestReview.comment || '',
      }
    : null;

  // Employer data mixed with real
  const employer = {
    name: profileUser?.name || 'Unknown',
    bio: profileUser?.employer_profile?.description || profileUser?.worker_profile?.bio || '',
    location: profileUser
      ? `${profileUser.barangay || ''}, ${profileUser.municipality || ''}`
      : 'Unknown',
    verified: profileUser?.verification_badge || false,
    reputation:
      reviewsData?.reputation_score && reviewsData.reputation_score > 0
        ? reviewsData.reputation_score
        : profileUser?.reputation_score || 0,
    ratings: reviewsData?.reviews_count ?? profileUser?.ratings_count ?? 0,
    activeJobs: activeJobsCount || profileUser?.employer_profile?.active_jobs || 0,
    hired: profileUser?.employer_profile?.total_hired || 0,
    totalPaid: `₱${profileUser?.employer_profile?.total_spent || 0}`,
    memberSince: 'New',
    recentReview,
  };

  const getAvatarUrl = () => {
    if (!profileUser?.avatar_url) return null;
    let url = profileUser.avatar_url;
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      const apiBase = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/api.*$/, '');
      url = url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, apiBase);
    }
    if (url.startsWith('http')) return url;
    const apiBase = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/api.*$/, '');
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
    await refetchProfile();
    setRefreshing(false);
  };

  const formatScore = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === '' || val === 'N/A') return 'N/A';
    const num = Number(val);
    if (isNaN(num) || num <= 0) return '0.0';
    if (num % 1 === 0) return num.toFixed(1);
    if (Number(num.toFixed(1)) === num) return num.toFixed(1);
    return Number(num.toFixed(2)).toString();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="create-outline" size={22} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Employer Profile</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Settings' as any)}
        >
          <Ionicons name="settings-outline" size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <RefreshableContainer
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {getAvatarUrl() ? (
              <Image
                source={{ uri: getAvatarUrl()! }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {(employer.name || 'E').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{employer.name}</Text>
              {employer.verified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.mintDeep} />
              )}
            </View>
            <Text style={styles.locationText}>{employer.location}</Text>
            {employer.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>Verified Employer</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio Section */}
        {!!employer.bio && (
          <View style={styles.bioCard}>
            <Text style={styles.bioTitle}>About</Text>
            <Text style={styles.bioText}>{employer.bio}</Text>
          </View>
        )}

        {/* Reputation Card - Clean Card */}
        <View style={styles.reputationCard}>
          <View style={styles.reputationHeaderRow}>
            <View style={styles.reputationBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#0284C7" />
            </View>
            <Text style={styles.reputationEyebrow}>Employer Reputation</Text>
          </View>
          <View style={styles.reputationRow}>
            <Text style={styles.reputationScore}>
              {employer.ratings > 0 ? formatScore(employer.reputation) : 'N/A'}
            </Text>
            <View style={styles.reputationStars}>
              {employer.ratings > 0 ? (
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={14}
                      color={star <= Math.round(employer.reputation) ? colors.gold : '#E2E8F0'}
                    />
                  ))}
                </View>
              ) : null}
              <Text style={styles.reputationCount}>
                {employer.ratings > 0 ? `${employer.ratings} verified ratings` : 'No ratings yet'}
              </Text>
            </View>
          </View>
          <Text style={styles.reputationTagline}>Your score travels with you.</Text>
        </View>

        {/* Stats Grid - Clean Card */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={styles.statIconCircle}>
              <Ionicons name="briefcase-outline" size={16} color="#E11D48" />
            </View>
            <Text style={styles.statValue}>{employer.activeJobs}</Text>
            <Text style={styles.statLabel}>Active jobs</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconCircle}>
              <Ionicons name="people-outline" size={16} color="#16A34A" />
            </View>
            <Text style={styles.statValue}>{employer.hired}</Text>
            <Text style={styles.statLabel}>Hires</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconCircle}>
              <Ionicons name="cash-outline" size={16} color="#D97706" />
            </View>
            <Text style={styles.statValue}>{employer.totalPaid}</Text>
            <Text style={styles.statLabel}>Total paid</Text>
          </View>
        </View>

        {/* Recent Review */}
        {employer.recentReview && (
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionEyebrow}>Recent review</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Reviews')}>
                <Text style={styles.viewAllText}>View all →</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 10 }}>
              <View style={styles.reviewNameRow}>
                <Text style={styles.reviewerName}>{employer.recentReview.worker}</Text>
                <View style={styles.starsRowSmall}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name="star"
                      size={11}
                      color={
                        employer.recentReview && s <= employer.recentReview.stars
                          ? colors.gold
                          : colors.inkFaint
                      }
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>{employer.recentReview.comment}</Text>
            </View>
          </View>
        )}
      </RefreshableContainer>
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.ink },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameText: { fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: -0.5, color: colors.ink },
  locationText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  verifiedBadge: {
    backgroundColor: colors.mint,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  verifiedBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.mintDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reputationCardWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  ambientGlowSky: {
    position: 'absolute',
    top: -10,
    right: 20,
    width: 140,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
  },
  reputationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reputationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reputationBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reputationEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  reputationScore: {
    fontFamily: fonts.numericBold,
    fontSize: 48,
    lineHeight: 56,
    color: '#0F172A',
  },
  reputationStars: { alignItems: 'flex-end', paddingBottom: 6 },
  starsRow: { flexDirection: 'row', gap: 2 },
  reputationCount: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 4,
  },
  reputationTagline: {
    fontFamily: fonts.displayItalic,
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
  },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: fonts.numericBold,
    fontSize: 18,
    color: '#0F172A',
    marginTop: 6,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 3,
  },
  reviewSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  viewAllText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primary },
  reviewNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  starsRowSmall: { flexDirection: 'row', gap: 1 },
  reviewComment: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
    fontStyle: 'italic',
  },
  bioCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  bioTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bioText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },
});

export default ProfileScreen;
