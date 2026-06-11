import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';

type EmployerProfileScreenNavigationProp = NativeStackNavigationProp<EmployerStackParamList, 'Profile'>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<EmployerProfileScreenNavigationProp>();

  // Dummy employer data
  const employer = {
    name: 'Juan Reyes',
    location: 'San Rafael, Bulan',
    tier: 'Tier 2',
    verified: true,
    reputation: 4.8,
    ratings: 9,
    activeJobs: 3,
    hired: 12,
    totalPaid: '₱24,800',
    memberSince: '1y',
    recentReview: {
      worker: 'Maria Santos',
      stars: 5,
      comment: '"Clear instructions, paid on time. Excellent employer."'
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.iconBtn} />
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Public profile</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="create-outline" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{employer.name.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{employer.name}</Text>
              {employer.verified && <Ionicons name="checkmark-circle" size={18} color={colors.mintDeep} />}
            </View>
            <Text style={styles.locationText}>
              <Ionicons name="location" size={11} color={colors.primary} /> {employer.location}
            </Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>
                {employer.verified ? 'Verified' : 'Unverified'} • {employer.tier}
              </Text>
            </View>
          </View>
        </View>

        {/* Reputation Card */}
        <View style={[styles.reputationCard, { backgroundColor: colors.sky }]}>
          <Text style={styles.reputationEyebrow}>Reputation</Text>
          <View style={styles.reputationRow}>
            <Text style={styles.reputationScore}>{employer.reputation}</Text>
            <View style={styles.reputationStars}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name="star" size={14} color={star <= Math.round(employer.reputation) ? colors.gold : colors.inkFaint} />
                ))}
              </View>
              <Text style={[styles.reputationCount, { color: colors.skyDeep }]}>{employer.ratings} ratings</Text>
            </View>
          </View>
          <Text style={styles.reputationTagline}>Your score travels with you.</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.peach }]}>
            <Text style={[styles.statValue, { color: colors.ink }]}>{employer.activeJobs}</Text>
            <Text style={[styles.statLabel, { color: colors.primaryDark }]}>Active jobs</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.mint }]}>
            <Text style={[styles.statValue, { color: colors.ink }]}>{employer.hired}</Text>
            <Text style={[styles.statLabel, { color: colors.mintDeep }]}>Hires</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.butter }]}>
            <Text style={[styles.statValue, { color: colors.ink }]}>{employer.totalPaid}</Text>
            <Text style={[styles.statLabel, { color: colors.inkSoft }]}>Total paid</Text>
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
                  {[1, 2, 3, 4, 5].map(s => (
                    <Ionicons key={s} name="star" size={11} color={s <= employer.recentReview.stars ? colors.gold : colors.inkFaint} />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>{employer.recentReview.comment}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: { backgroundColor: colors.paperBright, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, ...shadows.sm },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.ink },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameText: { fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: -0.5, color: colors.ink },
  locationText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  verifiedBadge: { backgroundColor: colors.mint, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start', marginTop: 6 },
  verifiedBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.mintDeep, textTransform: 'uppercase', letterSpacing: 0.5 },
  reputationCard: { backgroundColor: colors.peach, borderRadius: 20, padding: 20, marginBottom: 16 },
  reputationEyebrow: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.skyDeep, textTransform: 'uppercase', letterSpacing: 1 },
  reputationRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 },
  reputationScore: { fontFamily: fonts.bodyBold, fontSize: 52, lineHeight: 52, color: colors.ink },
  reputationStars: { alignItems: 'flex-end', paddingBottom: 6 },
  starsRow: { flexDirection: 'row', gap: 2 },
  reputationCount: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft, marginTop: 4 },
  reputationTagline: { fontFamily: fonts.displayItalic, fontSize: 14, color: colors.skyDeep, marginTop: 8 },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontFamily: fonts.bodyBold, fontSize: 18 },
  statLabel: { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  reviewSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.inkFaint },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionEyebrow: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1 },
  viewAllText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primary },
  reviewNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  starsRowSmall: { flexDirection: 'row', gap: 1 },
  reviewComment: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 4, fontStyle: 'italic' },
});

export default ProfileScreen;
