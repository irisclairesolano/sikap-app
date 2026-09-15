import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useWithdrawApplication, useAcceptOffer, useRejectOffer } from '../../hooks/useApply';
import { useApplication } from '../../hooks/useJobApplications';
import { messagesApi } from '../../api/messages';

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
  const { data: rawAppData, isLoading: queryLoading, refetch } = useApplication(applicationId);
  const appData = ((rawAppData as any)?.data ?? rawAppData) as any;

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const status = appData?.status || route.params?.status;
  const jobTitle = appData?.job?.title || route.params?.jobTitle;
  const employerName = appData?.job?.employer?.name || route.params?.employerName;
  const compensation =
    appData?.final_agreed_price || appData?.job?.compensation || route.params?.compensation;

  const { mutate: withdraw, isPending: isWithdrawing } = useWithdrawApplication();
  const { showAlert } = useAlert();
  const [isMenuVisible, setMenuVisible] = useState(false);

  const handleOpenChat = async () => {
    try {
      if (appData?.conversation_id) {
        navigation.navigate('Chat', {
          conversationId: appData.conversation_id,
          jobTitle: appData.job?.title || jobTitle,
          otherUserName: employerName,
        });
        return;
      }
      const res = await messagesApi.getConversations();
      const currentAppId = appData?.id ?? applicationId;
      const conv = res.data.find((c) => c.application_id === currentAppId);
      if (conv) {
        navigation.navigate('Chat', {
          conversationId: conv.id,
          jobTitle: conv.job_title || appData?.job?.title || jobTitle,
          otherUserName: conv.other_user?.name || employerName,
        });
      }
    } catch {
      showAlert('Error', "Couldn't open chat. Please check your connection and try again.");
    }
  };

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
      case 'employer_requested':
        return 2;
      case 'employer_confirmed':
        return 3;
      case 'accepted':
      case 'hired':
        return 4;
      case 'completed':
        return 5;
      default:
        return 1;
    }
  };

  const stage = getStage();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={queryLoading}
            onRefresh={refetch}
            colors={[colors.primary, colors.primaryDark]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.paperBright}
          />
        }
      >
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

            <View style={styles.minimalistSharedBox}>
              <View style={styles.minimalistSharedHeader}>
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.minimalistSharedTitle}>
                  Contact & references shared with employer
                </Text>
              </View>
              <View style={styles.minimalistChipsRow}>
                <View style={styles.minimalistChip}>
                  <Ionicons name="call-outline" size={13} color={colors.primaryDark} />
                  <Text style={styles.minimalistChipText}>Mobile number</Text>
                </View>
                <View style={styles.minimalistChip}>
                  <Ionicons name="people-outline" size={13} color={colors.primaryDark} />
                  <Text style={styles.minimalistChipText}>Character references</Text>
                </View>
              </View>
              <Text style={styles.minimalistSharedFootnote}>
                You can message each other in chat to discuss work schedule, requirements, and agree
                on a price.
              </Text>
            </View>
          </View>
        )}

        {/* STAGE 3: OFFER */}
        {stage === 3 && (
          <View>
            <View style={[styles.priceCard, styles.priceCardAmber]}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Text style={[styles.priceEyebrow, { color: '#854D0E' }]}>Final agreed price</Text>
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={16} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.priceNum}>₱{compensation || '1,800'}</Text>
              <Text style={styles.priceDesc}>3 days • Carpentry • Bulan</Text>
            </View>

            <View style={[styles.mintNotice, styles.mintNoticeEmerald]}>
              <Ionicons name="checkmark-circle" size={20} color="#15803D" />
              <Text style={styles.mintNoticeText}>
                <Text style={{ fontWeight: '700', color: '#14532D' }}>Slot locked. </Text>
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
            <View style={[styles.priceCard, styles.priceCardMint]}>
              <Text style={[styles.priceEyebrow, { color: '#166534' }]}>Active Contract</Text>
              <Text style={styles.priceNum}>₱{compensation || '1,800'}</Text>
              <Text style={styles.priceDesc}>Agreed price locked.</Text>
            </View>

            <View style={[styles.mintNotice, styles.mintNoticeEmerald]}>
              <Ionicons name="briefcase" size={20} color="#15803D" />
              <Text style={styles.mintNoticeText}>
                <Text style={{ fontWeight: '700', color: '#14532D' }}>You are hired! </Text>
                Proceed to the job location on the agreed date.
              </Text>
            </View>
          </View>
        )}

        {/* STAGE 5: COMPLETED */}
        {stage === 5 && (
          <View>
            <View style={[styles.priceCard, styles.priceCardSky]}>
              <Text style={[styles.priceEyebrow, { color: '#075985' }]}>Job Completed</Text>
              <Text style={styles.priceNum}>₱{compensation || '1,800'}</Text>
              <Text style={styles.priceDesc}>
                {appData?.has_reviewed
                  ? 'Job finished and rated. Thank you!'
                  : 'Job finished. Awaiting review.'}
              </Text>
            </View>

            <View
              style={[
                styles.mintNotice,
                appData?.has_reviewed ? styles.mintNoticeEmerald : styles.mintNoticeRose,
              ]}
            >
              <Ionicons
                name={appData?.has_reviewed ? 'checkmark-circle' : 'star'}
                size={20}
                color={appData?.has_reviewed ? '#15803D' : '#E11D48'}
              />
              <Text
                style={[
                  styles.mintNoticeText,
                  { color: appData?.has_reviewed ? '#166534' : '#9F1239' },
                ]}
              >
                {appData?.has_reviewed ? (
                  <>
                    <Text style={{ fontWeight: '700', color: '#15803D' }}>Review submitted! </Text>
                    {appData.user_review?.overall_rating
                      ? `You rated this employer ★ ${Number(appData.user_review.overall_rating).toFixed(1)}.`
                      : 'Thank you for your rating and review.'}
                  </>
                ) : (
                  <>
                    <Text style={{ fontWeight: '700', color: colors.primaryDark }}>
                      Job complete!{' '}
                    </Text>
                    Please rate your employer to help the community.
                  </>
                )}
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
          <>
            <Button
              label="Open Chat"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleOpenChat}
            />
            <Button
              label={isWithdrawing ? 'Withdrawing...' : 'Withdraw application'}
              variant="ghost"
              size="base"
              fullWidth
              onPress={handleWithdraw}
              loading={isWithdrawing}
            />
          </>
        )}
        {stage === 3 && (
          <>
            <Button
              label="Review Offer"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() =>
                navigation.navigate('AcceptHire', {
                  id: applicationId,
                  jobTitle: jobTitle || 'Job',
                  employerName: employerName || 'Employer',
                  offeredPrice: compensation ? String(compensation) : undefined,
                  conversationId: appData?.conversation_id ?? undefined,
                })
              }
            />
            <Button
              label="Open Chat"
              variant="outline"
              size="lg"
              fullWidth
              onPress={handleOpenChat}
            />
          </>
        )}
        {stage === 4 && (
          <>
            <Button
              label="Open Chat"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleOpenChat}
            />
            <Button label="Job is in progress" variant="ghost" size="base" fullWidth disabled />
          </>
        )}
        {stage === 5 && (
          <>
            {!appData?.has_reviewed && (
              <Button
                label="Rate Employer"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() =>
                  navigation.navigate('RateEmployer', {
                    id: applicationId,
                    employerName: employerName || 'Employer',
                    jobTitle: jobTitle || 'Job',
                  })
                }
              />
            )}
            <Button
              label="Open Chat"
              variant={appData?.has_reviewed ? 'primary' : 'outline'}
              size="lg"
              fullWidth
              onPress={handleOpenChat}
            />
          </>
        )}
        {status === 'rejected' && (
          <Button
            label="Open Chat"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleOpenChat}
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
  minimalistSharedBox: {
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  minimalistSharedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  minimalistSharedTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  minimalistChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  minimalistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.peach,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  minimalistChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  minimalistSharedFootnote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 17,
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
  priceCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    marginTop: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  priceCardAmber: {
    backgroundColor: 'rgba(254, 252, 232, 0.90)',
    borderColor: 'rgba(254, 240, 138, 0.70)',
  },
  priceCardMint: {
    backgroundColor: 'rgba(240, 253, 244, 0.90)',
    borderColor: 'rgba(187, 247, 208, 0.70)',
  },
  priceCardSky: {
    backgroundColor: 'rgba(240, 249, 255, 0.90)',
    borderColor: 'rgba(186, 230, 253, 0.70)',
  },
  priceEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lockBadge: {
    width: 36,
    height: 36,
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  priceNum: { fontFamily: fonts.bodyBold, fontSize: 40, color: '#0F172A', marginTop: 18 },
  priceDesc: { fontFamily: fonts.body, fontSize: 14, color: '#475569', marginTop: 8 },
  mintNotice: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  mintNoticeEmerald: {
    backgroundColor: 'rgba(240, 253, 244, 0.92)',
    borderColor: 'rgba(187, 247, 208, 0.70)',
  },
  mintNoticeRose: {
    backgroundColor: 'rgba(255, 241, 242, 0.92)',
    borderColor: 'rgba(254, 205, 211, 0.70)',
  },
  mintNoticeText: { fontFamily: fonts.body, fontSize: 13, flex: 1 },
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
    paddingVertical: 12,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
    gap: 10,
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
