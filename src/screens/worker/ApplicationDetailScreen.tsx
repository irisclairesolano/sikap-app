import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useWithdrawApplication, useAcceptOffer, useRejectOffer } from '../../hooks/useApply';
import { useApplication } from '../../hooks/useJobApplications';

type ApplicationDetailScreenRouteProp = RouteProp<WorkerStackParamList, 'ApplicationDetail'>;
type ApplicationDetailScreenNavigationProp = NativeStackNavigationProp<
  WorkerStackParamList,
  'ApplicationDetail'
>;

const ApplicationDetailScreen: React.FC = () => {
  const route = useRoute<ApplicationDetailScreenRouteProp>();
  const navigation = useNavigation<ApplicationDetailScreenNavigationProp>();

  const rawAppId =
    (route.params as any)?.applicationId ||
    (route.params as any)?.id ||
    (route.params as any)?.applicantId;
  const applicationId = Number(rawAppId);
  const { data: appData, isLoading: queryLoading } = useApplication(applicationId);

  const status = appData?.status || route.params?.status;
  const jobTitle = appData?.job?.title || route.params?.jobTitle;
  const employerName = appData?.job?.employer?.name || route.params?.employerName;
  const compensation =
    appData?.final_agreed_price || appData?.job?.compensation || route.params?.compensation;

  const { mutate: withdraw, isPending: isWithdrawing } = useWithdrawApplication();
  const { showAlert } = useAlert();
  const [isMenuVisible, setMenuVisible] = useState(false);

  if (queryLoading && !jobTitle) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!queryLoading && !appData && !jobTitle) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 18,
            color: colors.ink,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Application Not Found
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.inkMuted,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          This application details may no longer be available.
        </Text>
        <Button
          label="Go Back"
          variant="outline"
          size="base"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}
        />
      </SafeAreaView>
    );
  }

  const handleWithdraw = () => {
    setMenuVisible(false);
    showAlert(
      'Withdraw Application',
      'Are you sure you want to withdraw? The employer will be notified, and this action cannot be undone.',
      [
        { text: 'No, continue', style: 'cancel' },
        {
          text: 'Yes, withdraw',
          style: 'destructive',
          onPress: () => {
            withdraw(applicationId, {
              onSuccess: () => {
                navigation.goBack();
              },
              onError: (err: any) => {
                showAlert('Error', err.message || 'Could not withdraw application.');
              },
            });
          },
        },
      ],
    );
  };

  const getStage = () => {
    switch (status) {
      case 'pending':
        return 1;
      case 'shortlisted':
      case 'pending_negotiation':
        return 2;
      case 'employer_confirmed':
        return 3;
      case 'accepted':
        return 4;
      case 'completed':
        return 5;
      default:
        return 1;
    }
  };

  const stage = getStage();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>
            {status === 'withdrawn'
              ? 'Withdrawn'
              : stage === 1
                ? 'Application Tracking'
                : stage === 2
                  ? 'Shortlisted'
                  : stage === 3
                    ? 'Offer Received'
                    : stage === 4
                      ? 'Hired'
                      : 'Completed'}
          </Text>
        </View>
        {status !== 'withdrawn' ? (
          <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.ink} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} /> // Spacer
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {status === 'withdrawn' && (
          <View style={styles.withdrawnNotice}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text style={styles.withdrawnNoticeText}>
              You have withdrawn your application for this job.
            </Text>
          </View>
        )}

        {/* 4-Stage Tracker */}
        <View style={styles.stages}>
          <View style={stage >= 1 ? styles.stageActive : styles.stage}>
            <View
              style={[
                styles.stageCircle,
                stage >= 2 ? styles.stageDone : stage === 1 ? styles.stageCircleActive : null,
              ]}
            >
              {stage >= 2 ? (
                <Ionicons name="checkmark" size={14} color="white" />
              ) : (
                <Text style={stage === 1 ? styles.stageCircleTextActive : styles.stageCircleText}>
                  1
                </Text>
              )}
            </View>
            <Text style={styles.stageLabel}>Applied</Text>
          </View>
          <View style={[styles.stageDivider, stage >= 2 && styles.stageDoneDivider]} />

          <View style={stage >= 2 ? styles.stageActive : styles.stage}>
            <View
              style={[
                styles.stageCircle,
                stage >= 3 ? styles.stageDone : stage === 2 ? styles.stageCircleActive : null,
              ]}
            >
              {stage >= 3 ? (
                <Ionicons name="checkmark" size={14} color="white" />
              ) : (
                <Text style={stage === 2 ? styles.stageCircleTextActive : styles.stageCircleText}>
                  2
                </Text>
              )}
            </View>
            <Text style={styles.stageLabel}>Shortlisted</Text>
          </View>
          <View style={[styles.stageDivider, stage >= 3 && styles.stageDoneDivider]} />

          <View style={stage >= 3 ? styles.stageActive : styles.stage}>
            <View
              style={[
                styles.stageCircle,
                stage >= 4 ? styles.stageDone : stage === 3 ? styles.stageCircleActive : null,
              ]}
            >
              {stage >= 4 ? (
                <Ionicons name="checkmark" size={14} color="white" />
              ) : (
                <Text style={stage === 3 ? styles.stageCircleTextActive : styles.stageCircleText}>
                  3
                </Text>
              )}
            </View>
            <Text style={styles.stageLabel}>Offer</Text>
          </View>
          <View style={[styles.stageDivider, stage >= 4 && styles.stageDoneDivider]} />

          <View style={stage >= 4 ? styles.stageActive : styles.stage}>
            <View
              style={[
                styles.stageCircle,
                stage >= 5 ? styles.stageDone : stage === 4 ? styles.stageCircleActive : null,
              ]}
            >
              {stage >= 5 ? (
                <Ionicons name="checkmark" size={14} color="white" />
              ) : (
                <Text style={stage === 4 ? styles.stageCircleTextActive : styles.stageCircleText}>
                  4
                </Text>
              )}
            </View>
            <Text style={styles.stageLabel}>Hired</Text>
          </View>
          <View style={[styles.stageDivider, stage >= 5 && styles.stageDoneDivider]} />

          <View style={stage >= 5 ? styles.stageActive : styles.stage}>
            <View style={[styles.stageCircle, stage === 5 ? styles.stageCircleActive : null]}>
              <Text style={stage === 5 ? styles.stageCircleTextActive : styles.stageCircleText}>
                5
              </Text>
            </View>
            <Text style={styles.stageLabel}>Done</Text>
          </View>
        </View>

        {/* Dynamic Content based on Stage */}

        {/* STAGE 1: PENDING */}
        {stage === 1 && (
          <View>
            <Text style={styles.pageTitle}>Application sent.</Text>
            <Text style={styles.lede}>
              You applied for <Text style={styles.ledeHighlight}>{jobTitle}</Text>. Reyes Household
              is reviewing your profile.
            </Text>

            <View style={[styles.shieldCard, { marginTop: 24 }]}>
              <View style={[styles.shieldHeader, { marginBottom: 0 }]}>
                <View style={[styles.shieldBadge, { backgroundColor: colors.sky }]}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.skyDeep} />
                </View>
                <View>
                  <Text style={[styles.shieldSub, { color: colors.skyDeep }]}>
                    Privacy Shield Active
                  </Text>
                  <Text style={styles.shieldTitle}>Only public info is visible</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* STAGE 2: SHORTLISTED */}
        {stage === 2 && (
          <View>
            <Text style={styles.pageTitle}>
              {employerName}
              {'\n'}
              <Text style={styles.titleItalic}>wants to talk.</Text>
            </Text>
            <Text style={styles.lede}>
              You've been shortlisted for <Text style={styles.ledeHighlight}>{jobTitle}</Text>. They
              may reach out to discuss the work and price.
            </Text>

            <View style={[styles.shieldCard, { marginTop: 14 }]}>
              <View style={styles.shieldHeader}>
                <View style={[styles.shieldBadge, { backgroundColor: colors.peach }]}>
                  <Ionicons name="eye" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.shieldSub, { color: colors.primary }]}>
                    Now visible to employer
                  </Text>
                  <Text style={styles.shieldTitle}>References + contact unlocked</Text>
                </View>
              </View>
              <View style={styles.shieldRow}>
                <Text style={styles.shieldLabel}>Character References</Text>
                <Text style={[styles.shieldStatus, { color: colors.primary }]}>Revealed</Text>
              </View>
              <View style={styles.shieldRow}>
                <Text style={styles.shieldLabel}>Mobile Number</Text>
                <Text style={[styles.shieldStatus, { color: colors.primary }]}>Revealed</Text>
              </View>
            </View>

            <View style={styles.butterNotice}>
              <Ionicons
                name="information-circle"
                size={18}
                color={colors.primaryDark}
                style={{ marginTop: 1 }}
              />
              <Text style={styles.butterNoticeText}>
                <Text style={{ fontWeight: '700' }}>Talk outside the app</Text>, then come back when
                you've agreed on a price.
              </Text>
            </View>
          </View>
        )}

        {/* STAGE 3: OFFER */}
        {stage === 3 && (
          <View>
            <View style={styles.priceCard}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Text style={styles.priceEyebrow}>Final agreed price</Text>
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={16} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.priceNum}>₱{compensation || '1,800'}</Text>
              <Text style={styles.priceDesc}>3 days • Carpentry • Bulan</Text>
            </View>

            <View style={styles.mintNotice}>
              <Ionicons name="checkmark-circle" size={20} color={colors.mintDeep} />
              <Text style={styles.mintNoticeText}>
                <Text style={{ fontWeight: '700', color: colors.ink }}>Slot locked. </Text>
                No price surprises, no ghosting.
              </Text>
            </View>

            <View style={styles.employerContactCard}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>{(employerName || 'Employer').charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.employerNameCard}>{employerName || 'Employer'}</Text>
                <Text style={styles.employerSubCard}>Awaiting response • 23h left</Text>
              </View>
              <Ionicons name="call-outline" size={22} color={colors.primary} />
            </View>
          </View>
        )}

        {/* STAGE 4: HIRED */}
        {stage === 4 && (
          <View>
            <View style={styles.priceCard}>
              <Text style={styles.priceEyebrow}>Active Contract</Text>
              <Text style={styles.priceNum}>₱{compensation || '1,800'}</Text>
              <Text style={styles.priceDesc}>Agreed price locked.</Text>
            </View>

            <View style={styles.mintNotice}>
              <Ionicons name="briefcase" size={20} color={colors.mintDeep} />
              <Text style={styles.mintNoticeText}>
                <Text style={{ fontWeight: '700', color: colors.ink }}>You are hired! </Text>
                Proceed to the job location on the agreed date.
              </Text>
            </View>
          </View>
        )}

        {/* STAGE 5: COMPLETED */}
        {stage === 5 && (
          <View>
            <View style={[styles.priceCard, { backgroundColor: colors.sky }]}>
              <Text style={styles.priceEyebrow}>Job Completed</Text>
              <Text style={styles.priceNum}>₱{compensation || '1,800'}</Text>
              <Text style={styles.priceDesc}>Job finished. Awaiting review.</Text>
            </View>

            <View style={[styles.mintNotice, { backgroundColor: colors.peach }]}>
              <Ionicons name="star" size={20} color={colors.primary} />
              <Text style={[styles.mintNoticeText, { color: colors.primary }]}>
                <Text style={{ fontWeight: '700', color: colors.primaryDark }}>Job complete! </Text>
                Please rate your employer to help the community.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        {stage === 1 && status !== 'withdrawn' && (
          <Button
            label={isWithdrawing ? 'Withdrawing...' : 'Withdraw application'}
            variant="ghost"
            size="lg"
            fullWidth
            onPress={handleWithdraw}
            loading={isWithdrawing}
          />
        )}
        {stage === 2 && status !== 'withdrawn' && (
          <Button
            label={isWithdrawing ? 'Withdrawing...' : 'Withdraw application'}
            variant="ghost"
            size="lg"
            fullWidth
            onPress={handleWithdraw}
            loading={isWithdrawing}
          />
        )}
        {stage === 3 && (
          <Button
            label="Review Offer"
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="arrow-forward" size={18} color="white" />}
            onPress={() =>
              navigation.navigate('AcceptHire', {
                id: applicationId,
                jobTitle: jobTitle || 'Job',
                employerName: employerName || 'Employer',
                offeredPrice: compensation ? String(compensation) : undefined,
              })
            }
          />
        )}
        {stage === 4 && (
          <Button label="Job is in progress" variant="ghost" size="lg" fullWidth disabled />
        )}
        {stage === 5 && (
          <Button
            label="Rate Employer"
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="star" size={18} color="white" />}
            onPress={() =>
              navigation.navigate('RateEmployer', {
                id: applicationId,
                employerName: employerName || 'Employer',
                jobTitle: jobTitle || 'Job',
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
            <TouchableOpacity style={styles.menuOption} onPress={handleWithdraw}>
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
              <Text style={[styles.menuOptionText, { color: colors.error }]}>
                Withdraw Application
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primary },
  scrollContent: { padding: 20, paddingBottom: 40 },
  stages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  stage: { alignItems: 'center', opacity: 0.5 },
  stageActive: { alignItems: 'center', opacity: 1 },
  stageCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stageCircleActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  stageDone: { borderColor: colors.mintDeep, backgroundColor: colors.mintDeep, borderWidth: 0 },
  stageCircleText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkMuted },
  stageCircleTextActive: { fontFamily: fonts.bodyBold, fontSize: 10, color: 'white' },
  stageLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ink },
  stageDivider: {
    height: 2,
    flex: 1,
    backgroundColor: colors.inkFaint,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stageDoneDivider: { backgroundColor: colors.mintDeep },
  pageTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, letterSpacing: -0.5 },
  titleItalic: { fontFamily: fonts.displayItalic, color: colors.primary },
  lede: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: 12,
    lineHeight: 22,
  },
  ledeHighlight: { fontFamily: fonts.bodyBold, color: colors.ink },
  shieldCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  shieldHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  shieldBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldSub: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shieldTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, marginTop: 2 },
  shieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  shieldLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  shieldStatus: { fontFamily: fonts.bodyBold, fontSize: 13 },
  butterNotice: {
    backgroundColor: colors.butter,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  butterNoticeText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 20,
    flex: 1,
  },
  priceCard: { backgroundColor: colors.butter, borderRadius: 20, padding: 24, marginTop: 16 },
  priceEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lockBadge: {
    width: 36,
    height: 36,
    backgroundColor: 'white',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  priceNum: { fontFamily: fonts.bodyBold, fontSize: 40, color: colors.ink, marginTop: 18 },
  priceDesc: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 8 },
  mintNotice: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  mintNoticeText: { fontFamily: fonts.body, fontSize: 13, color: colors.mintDeep, flex: 1 },
  employerContactCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    ...shadows.sm,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.mintDeep },
  employerNameCard: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  employerSubCard: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
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
  withdrawnNotice: {
    backgroundColor: colors.status.pending.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  withdrawnNoticeText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.warning,
    flex: 1,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 60,
    marginRight: 16,
    width: 220,
    ...shadows.base,
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

export default ApplicationDetailScreen;
