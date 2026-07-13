import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useJobRequest } from '../../hooks/useJobApplications';

type ApplicantDetailScreenRouteProp = RouteProp<EmployerStackParamList, 'ApplicantDetail'>;
type ApplicantDetailScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'ApplicantDetail'
>;

const ApplicantDetailScreen: React.FC = () => {
  const route = useRoute<ApplicantDetailScreenRouteProp>();
  const navigation = useNavigation<ApplicantDetailScreenNavigationProp>();
  const { applicantId, jobTitle, applicantName, status } = route.params;

  const { showAlert } = useAlert();
  const [isMenuVisible, setMenuVisible] = useState(false);

  const handleReport = () => {
    setMenuVisible(false);
    navigation.navigate('Report' as any, { id: applicantId, type: 'user' });
  };

  const isShortlisted =
    status === 'employer_requested' || status === 'accepted' || status === 'employer_confirmed';
  const isConfirmed = status === 'employer_confirmed';
  const isAccepted = status === 'accepted';
  const isPending = status === 'pending';
  const isCompleted = status === 'completed';

  const navigateToConfirmHire = () => {
    navigation.navigate('ConfirmHire', { applicantId, applicantName, jobTitle });
  };

  const navigateToSendRequest = () => {
    navigation.navigate('SendRequest', { id: applicantId, applicantName, jobTitle });
  };

  const navigateToCancelHire = () => {
    navigation.navigate('CancelHire', { id: applicantId, applicantName, jobTitle });
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
        <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
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
              <Ionicons name="location" size={11} color={colors.primary} /> Worker
            </Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Reputation Card */}
        <View style={styles.reputationCard}>
          <Text style={styles.reputationEyebrow}>Reputation</Text>
          <View style={styles.reputationRow}>
            <Text style={styles.reputationScore}>N/A</Text>
            <View style={styles.reputationStars}>
              <Text style={styles.reputationCount}>No ratings yet</Text>
            </View>
          </View>
          <Text style={styles.reputationTagline}>Their score travels with them.</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.mint }]}>
            <Text style={[styles.statValue, { color: colors.mintDeep }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.mintDeep }]}>Jobs done</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.sky }]}>
            <Text style={[styles.statValue, { color: colors.skyDeep }]}>New</Text>
            <Text style={[styles.statLabel, { color: colors.skyDeep }]}>Member</Text>
          </View>
        </View>

        {/* Contact Info (Requires Shortlist & Confirmed) */}
        {status === 'pending' || status === 'withdrawn' ? (
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
              Confirm hire to unlock their phone number and references.
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
                <Text style={[styles.shieldSub, { color: colors.mintDeep }]}>
                  You can now review their references
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 12, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, fontSize: 13 }}>
                  Phone
                </Text>
                <Text style={{ fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13 }}>
                  {route.params.phone || '0912 345 6789'}
                </Text>
              </View>
              {route.params.emergencyContactName && (
                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}
                >
                  <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, fontSize: 13 }}>
                    Emergency ({route.params.emergencyContactName})
                  </Text>
                  <Text style={{ fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13 }}>
                    {route.params.emergencyContactPhone}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.footer}>
        {status === 'pending' && (
          <Button
            label="Shortlist Applicant"
            variant="primary"
            size="lg"
            fullWidth
            onPress={navigateToSendRequest}
            icon={<Ionicons name="star" size={18} color="white" />}
          />
        )}
        {status === 'pending_negotiation' && (
          <View style={{ gap: 12 }}>
            <Button
              label="Proceed to Confirm Hire"
              variant="primary"
              size="lg"
              fullWidth
              icon={<Ionicons name="arrow-forward" size={18} color="white" />}
              onPress={navigateToConfirmHire}
            />
            <Button
              label="Cancel Hire"
              variant="ghost"
              size="base"
              fullWidth
              onPress={navigateToCancelHire}
            />
          </View>
        )}
        {status === 'employer_confirmed' && (
          <View style={{ gap: 12 }}>
            <Button label="Waiting for worker..." variant="outline" size="lg" fullWidth disabled />
            <Button
              label="Cancel Hire"
              variant="ghost"
              size="base"
              fullWidth
              onPress={navigateToCancelHire}
            />
          </View>
        )}
        {status === 'accepted' && (
          <Button label="Job is in progress" variant="outline" size="lg" fullWidth disabled />
        )}
        {status === 'completed' && (
          <Button
            label="Rate Worker"
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="star" size={18} color="white" />}
            onPress={() =>
              navigation.navigate('RateWorker', {
                id: applicantId,
                workerName: applicantName,
                jobTitle,
              })
            }
          />
        )}
      </View>

      <Modal visible={isMenuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuOption} onPress={handleReport}>
              <Ionicons name="flag-outline" size={20} color={colors.error} />
              <Text style={[styles.menuOptionText, { color: colors.error }]}>Report Applicant</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 60,
    marginRight: 16,
    width: 220,
    ...shadows.md,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuOptionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
});

export default ApplicantDetailScreen;
