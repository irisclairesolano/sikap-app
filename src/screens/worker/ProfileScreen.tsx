import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { colors, fonts, shadows } from '../../theme';
import { profileApi } from '../../api/profile';
import { useAuth } from '../../hooks/useAuth';
import { useReviews } from '../../hooks/useReviews';
type ProfileScreenNavigationProp = NativeStackNavigationProp<WorkerStackParamList, 'ProfileMain'>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { refetchProfile } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    initialData: () => queryClient.getQueryData(['profile']),
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const { data: reviewsData } = useReviews();

  if (isLoading || !user) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}
        edges={['top', 'left', 'right']}
      >
        <Text style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const worker = {
    name: user.name,
    location: `${user.barangay}, ${user.municipality}`,
    verified: user.verification_status === 'approved',
    reputation: reviewsData?.reputation_score ?? user.reputation_score ?? 5.0,
    ratings: reviewsData?.reviews_count ?? (user as any).ratings_count ?? 0,
    jobsDone: (user as any).completed_jobs_count ?? 0,
    memberSince: (user as any).member_since || 'New',
    skills: user.worker_profile?.skills || [],
    bio: user.worker_profile?.bio || '',
    experiences: user.worker_profile?.experiences || [],
    recentReview: (() => {
      const receivedReviews = (reviewsData?.reviews || []).filter(
        (r) =>
          r.reviewer?.id !== user.id &&
          (!r.reviewee_id || r.reviewee_id === user.id) &&
          r.reviewer_role !== 'worker',
      );
      const topReview = receivedReviews[0];
      return topReview
        ? {
            employer: topReview.reviewer?.name || 'Employer',
            stars: Math.round(topReview.overall_rating),
            comment: topReview.comment || '',
          }
        : null;
    })(),
  };

  const hasSkills = (user?.worker_profile?.skills?.length || 0) > 0;
  const hasHistory = (user?.worker_profile?.experiences?.length || 0) > 0;
  const hasRefs = (user?.worker_profile?.references?.length || 0) > 0;
  const isProfileComplete = hasSkills && hasHistory && hasRefs;

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
    await queryClient.invalidateQueries({ queryKey: ['reviews'] });
    await refetchProfile();
    setRefreshing(false);
  };

  const getAvatarUrl = () => {
    if (!user?.avatar_url) return null;
    let url = user.avatar_url;
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      const apiBase = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/api.*$/, '');
      url = url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, apiBase);
    }
    if (url.startsWith('http')) return url;
    const apiBase = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/api.*$/, '');
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
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
        <View style={styles.iconBtn} />
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Public profile</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {!isProfileComplete && (
          <TouchableOpacity
            style={styles.setupBanner}
            activeOpacity={0.8}
            onPress={() => (navigation as any).navigate('Find')}
          >
            <View style={styles.setupBannerIcon}>
              <Ionicons name="alert-circle" size={24} color={colors.primaryDark} />
            </View>
            <View style={styles.setupBannerText}>
              <Text style={styles.setupBannerTitle}>Finish setting up</Text>
              <Text style={styles.setupBannerSubtitle}>
                Your profile is missing some details. Tap to complete it.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
          </TouchableOpacity>
        )}

        {/* Profile Header */}
        <TouchableOpacity
          style={styles.profileHeader}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            {getAvatarUrl() ? (
              <Image
                cachePolicy="memory-disk"
                priority="high"
                transition={150}
                source={{ uri: getAvatarUrl()! }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{worker.name.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{worker.name}</Text>
              {worker.verified && (
                <Ionicons name="checkmark-circle" size={18} color={colors.mintDeep} />
              )}
            </View>
            <Text style={styles.locationText}>
              <Ionicons name="location" size={11} color={colors.primary} /> {worker.location}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Reputation Card - Frosted Crystal Glass */}
        <View style={styles.reputationCardWrapper}>
          <View style={styles.ambientGlowRose} pointerEvents="none" />
          <View style={styles.reputationCard}>
            <View style={styles.reputationHeaderRow}>
              <View style={styles.reputationBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#E11D48" />
              </View>
              <Text style={styles.reputationEyebrow}>Worker Reputation</Text>
            </View>
            <View style={styles.reputationRow}>
              <Text style={styles.reputationScore}>
                {worker.ratings > 0 ? formatScore(worker.reputation) : 'N/A'}
              </Text>
              <View style={styles.reputationStars}>
                {worker.ratings > 0 ? (
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={14}
                        color={star <= Math.round(worker.reputation) ? colors.gold : '#E2E8F0'}
                      />
                    ))}
                  </View>
                ) : null}
                <Text style={styles.reputationCount}>
                  {worker.ratings > 0 ? `${worker.ratings} verified ratings` : 'No ratings yet'}
                </Text>
              </View>
            </View>
            <Text style={styles.reputationTagline}>Your score travels with you.</Text>
          </View>
        </View>

        {/* Stats Grid - Frosted Crystal Glass */}
        <View style={styles.statsWrapper}>
          <View style={styles.ambientGlowMint} pointerEvents="none" />
          <View style={styles.ambientGlowBlue} pointerEvents="none" />
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={[styles.statIconBadge, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
                <Ionicons name="checkmark-done-outline" size={15} color="#16A34A" />
              </View>
              <Text style={styles.statValue}>{worker.jobsDone}</Text>
              <Text style={styles.statLabel}>Jobs done</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statIconBadge, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                <Ionicons name="calendar-outline" size={15} color="#0284C7" />
              </View>
              <Text style={styles.statValue}>{worker.memberSince}</Text>
              <Text style={styles.statLabel}>Member</Text>
            </View>
          </View>
        </View>

        {/* About Me */}
        {worker.bio ? (
          <View style={styles.skillsSection}>
            <Text style={styles.sectionEyebrow}>About Me</Text>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.ink,
                marginTop: 10,
                lineHeight: 22,
              }}
            >
              {worker.bio}
            </Text>
          </View>
        ) : null}

        {/* Work History */}
        <View style={styles.skillsSection}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionEyebrow}>Work History</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddWorkHistory' as any)}>
              <Text style={styles.viewAllText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 10, gap: 12 }}>
            {!worker.experiences || worker.experiences.length === 0 ? (
              <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, fontSize: 13 }}>
                No work history added yet.
              </Text>
            ) : (
              worker.experiences.map((exp) => (
                <View
                  key={exp.id}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.butter,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="briefcase" size={18} color={colors.inkSoft} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink }}>
                      {exp.job_title}
                    </Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>
                      {exp.company}
                    </Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
                      {exp.duration}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Skills */}
        <View style={styles.skillsSection}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionEyebrow}>Skills</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddSkills' as any)}>
              <Text style={styles.viewAllText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.skillsList}>
            {worker.skills.length === 0 ? (
              <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, fontSize: 13 }}>
                No skills added yet.
              </Text>
            ) : (
              worker.skills.map((skill, index) => {
                const bgColors = [colors.peach, colors.mint, colors.butter, colors.sky];
                const textColors = [
                  colors.primaryDark,
                  colors.mintDeep,
                  colors.ink,
                  colors.skyDeep,
                ];
                const icons = ['hammer', 'construct', 'brush', 'water'] as const;
                const colorIdx = index % 4;

                return (
                  <View
                    key={skill.id}
                    style={[styles.chip, { backgroundColor: bgColors[colorIdx] }]}
                  >
                    <Ionicons name={icons[colorIdx]} size={14} color={textColors[colorIdx]} />
                    <Text style={[styles.chipText, { color: textColors[colorIdx] }]}>
                      {skill.name}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Character References */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionEyebrow}>Character References</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CharacterReferences' as any)}>
              <Text style={styles.viewAllText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 10, gap: 12 }}>
            {!user.worker_profile?.references || user.worker_profile.references.length === 0 ? (
              <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, fontSize: 13 }}>
                No references added yet.
              </Text>
            ) : (
              user.worker_profile.references.map((ref) => (
                <View key={ref.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.paperBright,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="person" size={18} color={colors.inkSoft} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink }}>
                      {ref.name}
                    </Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
                      {ref.relationship} •{' '}
                      {ref.phone ? ref.phone.replace(/(\d{4})\d{4}(\d{3})/, '$1 ••• $2') : ''}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent Review */}
        {worker.recentReview && (
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionEyebrow}>Recent review</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Reviews')}>
                <Text style={styles.viewAllText}>View all →</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 10 }}>
              <View style={styles.reviewNameRow}>
                <Text style={styles.reviewerName}>{worker.recentReview?.employer}</Text>
                <View style={styles.starsRowSmall}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name="star"
                      size={11}
                      color={s <= (worker.recentReview?.stars ?? 0) ? colors.gold : colors.inkFaint}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>{worker.recentReview?.comment}</Text>
            </View>
          </View>
        )}
      </ScrollView>
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
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.primaryDark },
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
  ambientGlowRose: {
    position: 'absolute',
    top: -10,
    right: 20,
    width: 140,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
  },
  reputationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
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
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reputationEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#E11D48',
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
  statsWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  ambientGlowMint: {
    position: 'absolute',
    top: -10,
    left: 10,
    width: 120,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
  },
  ambientGlowBlue: {
    position: 'absolute',
    bottom: -10,
    right: 15,
    width: 130,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  statIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: { fontFamily: fonts.numericBold, fontSize: 18, color: '#0F172A' },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 3,
  },
  skillsSection: { marginBottom: 16 },
  sectionEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  skillsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  reviewSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.peach,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.peachBright,
  },
  setupBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paperBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  setupBannerText: { flex: 1 },
  setupBannerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.primaryDark,
    marginBottom: 2,
  },
  setupBannerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.primaryDark,
    opacity: 0.8,
  },
});

export default ProfileScreen;
