import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';

type ApplicantDetailScreenRouteProp = RouteProp<EmployerStackParamList, 'ApplicantDetail'>;
type ApplicantDetailScreenNavigationProp = NativeStackNavigationProp<EmployerStackParamList, 'ApplicantDetail'>;

const ApplicantDetailScreen: React.FC = () => {
  const route = useRoute<ApplicantDetailScreenRouteProp>();
  const navigation = useNavigation<ApplicantDetailScreenNavigationProp>();
  const { applicantId, jobTitle, applicantName, status } = route.params;

  // In Iteration 1, we'll use dummy data
  const isShortlisted = status === 'shortlisted' || status === 'employer_confirmed';

  const navigateToConfirmHire = () => {
    navigation.navigate('ConfirmHire', { applicantId, applicantName, jobTitle });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Applicant profile</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{applicantName.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{applicantName}</Text>
              <Ionicons name="checkmark-circle" size={18} color={colors.mintDeep} />
            </View>
            <Text style={styles.locationText}>
              <Ionicons name="location" size={11} color={colors.primary} /> Sorsogon City
            </Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>Verified • Tier 1</Text>
            </View>
          </View>
        </View>

        {/* Reputation Card */}
        <View style={styles.reputationCard}>
          <Text style={styles.reputationEyebrow}>Reputation</Text>
          <View style={styles.reputationRow}>
            <Text style={styles.reputationScore}>4.8</Text>
            <View style={styles.reputationStars}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name="star" size={14} color={colors.gold} />
                ))}
              </View>
              <Text style={styles.reputationCount}>8 ratings</Text>
            </View>
          </View>
          <Text style={styles.reputationTagline}>Their score travels with them.</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.mint }]}>
            <Text style={[styles.statValue, { color: colors.mintDeep }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.mintDeep }]}>Jobs done</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.butter }]}>
            <Text style={[styles.statValue, { color: colors.ink }]}>98%</Text>
            <Text style={[styles.statLabel, { color: colors.inkSoft }]}>On time</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.sky }]}>
            <Text style={[styles.statValue, { color: colors.skyDeep }]}>2y</Text>
            <Text style={[styles.statLabel, { color: colors.skyDeep }]}>Member</Text>
          </View>
        </View>

        {/* Skills */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionEyebrow}>Skills</Text>
          <View style={styles.skillsList}>
            <View style={[styles.chip, { backgroundColor: colors.peach }]}>
              <Ionicons name="hammer" size={14} color={colors.primaryDark} />
              <Text style={[styles.chipText, { color: colors.primaryDark }]}>Carpentry</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.mint }]}>
              <Ionicons name="construct" size={14} color={colors.mintDeep} />
              <Text style={[styles.chipText, { color: colors.mintDeep }]}>Masonry</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.butter }]}>
              <Ionicons name="brush" size={14} color={colors.ink} />
              <Text style={[styles.chipText, { color: colors.ink }]}>Painting</Text>
            </View>
          </View>
        </View>

        {/* Contact Info (Requires Shortlist) */}
        {!isShortlisted ? (
          <View style={styles.privacyShield}>
            <View style={styles.shieldHeader}>
              <View style={styles.shieldIcon}>
                <Ionicons name="lock-closed" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.shieldTitle}>Privacy Shield Active</Text>
                <Text style={styles.shieldSub}>Contact details hidden</Text>
              </View>
            </View>
            <Text style={styles.shieldDesc}>
              Shortlist {applicantName.split(' ')[0]} to unlock their phone number and references.
            </Text>
          </View>
        ) : (
          <View style={[styles.privacyShield, { borderColor: colors.mintDeep }]}>
            <View style={styles.shieldHeader}>
              <View style={[styles.shieldIcon, { backgroundColor: colors.mint }]}>
                <Ionicons name="eye" size={16} color={colors.mintDeep} />
              </View>
              <View>
                <Text style={styles.shieldTitle}>Contact details unlocked</Text>
                <Text style={[styles.shieldSub, { color: colors.mintDeep }]}>You can now talk outside the app</Text>
              </View>
            </View>
            <View style={{ marginTop: 12, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, fontSize: 13 }}>Phone</Text>
                <Text style={{ fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13 }}>0912 345 6789</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.footer}>
        {!isShortlisted ? (
          <Button 
            label="Shortlist Applicant" 
            variant="primary" 
            size="lg" 
            fullWidth 
            icon={<Ionicons name="star" size={18} color="white" />}
          />
        ) : (
          <Button 
            label="Proceed to Confirm Hire" 
            variant="primary" 
            size="lg" 
            fullWidth 
            icon={<Ionicons name="arrow-forward" size={18} color="white" />}
            onPress={navigateToConfirmHire}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPill: {
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.sm,
  },
  headerPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkMuted,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.primaryDark,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  locationText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
  },
  verifiedBadge: {
    backgroundColor: colors.mint,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  verifiedBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.mintDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reputationCard: {
    backgroundColor: colors.peach,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  reputationEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  reputationScore: {
    fontFamily: fonts.bodyBold,
    fontSize: 52,
    lineHeight: 60,
    color: colors.ink,
  },
  reputationStars: {
    alignItems: 'flex-end',
    paddingBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reputationCount: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
  },
  reputationTagline: {
    fontFamily: fonts.displayItalic,
    fontSize: 14,
    color: colors.primaryDark,
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  skillsSection: {
    marginBottom: 24,
  },
  sectionEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  privacyShield: {
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.paperBright,
  },
  shieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  shieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  shieldSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.primary,
  },
  shieldDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    padding: 20,
    paddingBottom: 24,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
});

export default ApplicantDetailScreen;
