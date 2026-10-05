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
import { CompletedJobOverview } from '../../components/applications/CompletedJobOverview';
import { useAcceptOffer, useRejectOffer, useWithdrawApplication } from '../../hooks/useApply';
import { useApplication } from '../../hooks/useJobApplications';
import { messagesApi } from '../../api/messages';
import { triggerHaptic } from '../../utils/haptics';

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
  const {
    data: rawAppData,
    isLoading: queryLoading,
    isError,
    error,
    refetch,
  } = useApplication(applicationId);
  const appData = ((rawAppData as any)?.data ?? rawAppData) as any;

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const status = appData?.status || route.params?.status;
  const jobTitle = appData?.job?.title || route.params?.jobTitle;
  const employerName =
    appData?.job?.employer?.name ||
    (appData?.job?.employer?.is_deleted ? 'Deleted Account' : route.params?.employerName) ||
    'Employer';
  const compensation =
    appData?.final_agreed_price || appData?.job?.compensation || route.params?.compensation;

  const { mutate: withdraw, isPending: isWithdrawing } = useWithdrawApplication();
  const acceptOfferMutation = useAcceptOffer();
  const rejectOfferMutation = useRejectOffer();
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

  if (queryLoading && !appData) {
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

  if (isError && !appData) {
    const isDeletedAccount =
      (error as any)?.status === 404 ||
      (error as any)?.metadata?.error === 'user_deleted' ||
      error?.message?.toLowerCase().includes('account') ||
      error?.message?.toLowerCase().includes('not found');

    if (isDeletedAccount) {
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
          <Ionicons name="person-remove-outline" size={48} color={colors.inkMuted} />
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 18,
              color: colors.ink,
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            This Account No Longer Exists
          </Text>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.inkMuted,
              marginTop: 6,
              textAlign: 'center',
              lineHeight: 20,
              maxWidth: 300,
            }}
          >
            The employer's account has been deactivated or deleted. This job is no longer available.
          </Text>
          <Button
            label="Go Back"
            variant="outline"
            size="base"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 24 }}
          />
        </SafeAreaView>
      );
    }

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
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 18,
            color: colors.ink,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Failed to Load Application
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
          Unable to retrieve application details. Please try again.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <Button
            label="Go Back"
            variant="outline"
            size="base"
            onPress={() => navigation.goBack()}
          />
          <Button label="Retry" variant="primary" size="base" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!queryLoading && !appData) {
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

  const handleAcceptOffer = () => {
    acceptOfferMutation.mutate(applicationId, {
      onSuccess: () => {
        triggerHaptic('success');
        navigation.navigate('Success', {
          variant: 'milestone',
          title: "🎉 You're Hired!",
          message: `Congratulations! You accepted the job offer for "${jobTitle || 'this job'}". Coordinate details in chat with ${employerName || 'the employer'}.`,
          detail: [
            { label: 'Job', value: jobTitle || 'Job' },
            { label: 'Employer', value: employerName || 'Employer' },
            ...(compensation ? [{ label: 'Agreed Price', value: `₱${compensation}` }] : []),
          ],
          primaryAction: {
            label: 'Open chat',
            navigateTo: appData?.conversation_id
              ? {
                  name: 'Chat',
                  params: {
                    conversationId: appData.conversation_id,
                    jobTitle,
                    otherUserName: employerName,
                  },
                }
              : { name: 'ConversationsList' },
          },
          secondaryAction: {
            label: 'See job details',
            navigateTo: {
              name: 'ApplicationDetail',
              params: { applicationId, jobTitle, employerName },
            },
          },
        });
      },
      onError: (err: any) => {
        showAlert('Error', err.message || 'Failed to accept offer.');
      },
    });
  };

  const handleRejectOffer = () => {
    showAlert(
      'Decline Offer',
      `Are you sure you want to decline the offer for "${jobTitle || 'this job'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Decline',
          style: 'destructive',
          onPress: () => {
            rejectOfferMutation.mutate(applicationId, {
              onSuccess: () => {
                triggerHaptic('medium');
                showAlert(
                  'Offer Declined',
                  `You have declined the offer for "${jobTitle || 'this job'}".`,
                );
                refetch();
              },
              onError: (err: any) => {
                showAlert('Error', err.message || 'Failed to decline offer.');
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

        {/* Completed Job Overview when stage 5, or 4-Stage Tracker for active stages */}
        {stage === 5 ? (
          <CompletedJobOverview
            viewerRole="worker"
            application={appData}
            job={appData?.job}
            onOpenChat={handleOpenChat}
          />
        ) : (
          <View style={styles.stages}>
            <View style={stage >= 1 ? styles.stageActive : styles.stage}>
              <View
                style={[
                  styles.stageCircle,
                  stage > 1 ? styles.stageDone : stage === 1 ? styles.stageCircleActive : null,
                ]}
              >
                {stage > 1 ? (
                  <Ionicons name="checkmark" size={12} color="white" />
                ) : (
                  <Text style={stage === 1 ? styles.stageCircleTextActive : styles.stageCircleText}>
                    1
                  </Text>
                )}
              </View>
              <Text style={styles.stageLabel}>Applied</Text>
            </View>
            <View style={styles.stageDivider}>
              {stage > 1 ? (
                <View style={[StyleSheet.absoluteFill, styles.stageDoneDivider]} />
              ) : stage === 1 ? (
                <View style={styles.stageDividerHalf} />
              ) : null}
            </View>

            <View style={stage >= 2 ? styles.stageActive : styles.stage}>
              <View
                style={[
                  styles.stageCircle,
                  stage > 2 ? styles.stageDone : stage === 2 ? styles.stageCircleActive : null,
                ]}
              >
                {stage > 2 ? (
                  <Ionicons name="checkmark" size={12} color="white" />
                ) : (
                  <Text style={stage === 2 ? styles.stageCircleTextActive : styles.stageCircleText}>
                    2
                  </Text>
                )}
              </View>
              <Text style={styles.stageLabel}>Shortlisted</Text>
            </View>
            <View style={styles.stageDivider}>
              {stage > 2 ? (
                <View style={[StyleSheet.absoluteFill, styles.stageDoneDivider]} />
              ) : stage === 2 ? (
                <View style={styles.stageDividerHalf} />
              ) : null}
            </View>

            <View style={stage >= 3 ? styles.stageActive : styles.stage}>
              <View
                style={[
                  styles.stageCircle,
                  stage > 3 ? styles.stageDone : stage === 3 ? styles.stageCircleActive : null,
                ]}
              >
                {stage > 3 ? (
                  <Ionicons name="checkmark" size={12} color="white" />
                ) : (
                  <Text style={stage === 3 ? styles.stageCircleTextActive : styles.stageCircleText}>
                    3
                  </Text>
                )}
              </View>
              <Text style={styles.stageLabel}>Offer</Text>
            </View>
            <View style={styles.stageDivider}>
              {stage > 3 ? (
                <View style={[StyleSheet.absoluteFill, styles.stageDoneDivider]} />
              ) : stage === 3 ? (
                <View style={styles.stageDividerHalf} />
              ) : null}
            </View>

            <View style={stage >= 4 ? styles.stageActive : styles.stage}>
              <View
                style={[
                  styles.stageCircle,
                  stage > 4 ? styles.stageDone : stage === 4 ? styles.stageCircleActive : null,
                ]}
              >
                {stage > 4 ? (
                  <Ionicons name="checkmark" size={12} color="white" />
                ) : (
                  <Text style={stage === 4 ? styles.stageCircleTextActive : styles.stageCircleText}>
                    4
                  </Text>
                )}
              </View>
              <Text style={styles.stageLabel}>Hired</Text>
            </View>
            <View style={styles.stageDivider}>
              {stage > 4 ? (
                <View style={[StyleSheet.absoluteFill, styles.stageDoneDivider]} />
              ) : stage === 4 ? (
                <View style={styles.stageDividerHalf} />
              ) : null}
            </View>

            <View style={styles.stage}>
              <View style={styles.stageCircle}>
                <Text style={styles.stageCircleText}>5</Text>
              </View>
              <Text style={styles.stageLabel}>Done</Text>
            </View>
          </View>
        )}

        {/* Dynamic Content based on Stage */}

        {/* STAGE 1: PENDING */}
        {stage === 1 && (
          <View>
            <Text style={styles.pageTitle}>Application sent.</Text>
            <Text style={styles.lede}>
              You applied for <Text style={styles.ledeHighlight}>{jobTitle}</Text>.{' '}
              {employerName || 'The employer'} is reviewing your profile.
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
              <Text style={styles.priceNum}>
                ₱{compensation ? Number(compensation).toLocaleString() : '0'}
              </Text>
              <Text style={styles.priceDesc}>
                {[
                  appData?.job?.duration
                    ? `${appData.job.duration} ${appData.job.duration_unit || 'days'}`
                    : null,
                  appData?.job?.category,
                  appData?.job?.municipality,
                ]
                  .filter(Boolean)
                  .join(' • ') || 'Agreed terms'}
              </Text>
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
                <Text style={styles.employerSubCard}>Awaiting response • Offer active</Text>
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
              <Text style={styles.priceNum}>
                ₱{compensation ? Number(compensation).toLocaleString() : '0'}
              </Text>
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
              label="Accept Offer"
              variant="primary"
              size="lg"
              fullWidth
              loading={acceptOfferMutation.isPending}
              disabled={acceptOfferMutation.isPending || rejectOfferMutation.isPending}
              onPress={handleAcceptOffer}
            />
            <Button
              label="Decline Offer"
              variant="outline"
              size="lg"
              fullWidth
              loading={rejectOfferMutation.isPending}
              disabled={acceptOfferMutation.isPending || rejectOfferMutation.isPending}
              onPress={handleRejectOffer}
            />
            <Button
              label="Open Chat"
              variant="ghost"
              size="base"
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
          <Button
            label="Open Chat"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleOpenChat}
          />
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
  stageCircleActive: {
    borderColor: colors.mintDeep,
    backgroundColor: colors.mint,
    borderWidth: 2,
  },
  stageDone: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  stageCircleText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkMuted },
  stageCircleTextActive: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.mintDeep },
  stageLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ink },
  stageDivider: {
    height: 3,
    flex: 1,
    backgroundColor: colors.inkFaint,
    marginHorizontal: -4,
    marginBottom: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stageDoneDivider: { backgroundColor: colors.mintDeep },
  stageDividerHalf: {
    width: '50%',
    height: '100%',
    backgroundColor: colors.mint,
  },
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    padding: 24,
    marginTop: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  priceCardAmber: {
    borderColor: 'rgba(251, 191, 36, 0.40)',
  },
  priceCardMint: {
    borderColor: 'rgba(34, 197, 94, 0.40)',
  },
  priceCardSky: {
    borderColor: 'rgba(56, 189, 248, 0.40)',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  mintNoticeEmerald: {
    borderColor: 'rgba(34, 197, 94, 0.40)',
  },
  mintNoticeRose: {
    borderColor: 'rgba(244, 63, 94, 0.40)',
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
