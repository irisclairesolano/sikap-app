/**
 * ============================================================================
 * SCREEN: Worker Application Detail & Hiring Tracker
 *         (src/screens/worker/ApplicationDetailScreen.tsx)
 * ============================================================================
 *
 * (a) Screen / Module Role in the SIKAP Mobile App:
 *     Provides the Worker's real-time view of their job application lifecycle
 *     and SIKAP's 4-Stage Progressive Data Disclosure (Privacy Shield) model
 *     plus Stage 5 (Completed Job Receipt). Allows workers to withdraw pending
 *     applications, open the negotiation chat once shortlisted, and formally
 *     Accept or Decline an employer's locked price offer.
 *
 * (b) Key State & Hooks Used:
 *     - `useApplication(applicationId)`: Fetches live application state,
 *       agreed price, and linked conversation ID (`GET /api/v1/applications/{id}`).
 *     - `useWithdrawApplication()`: Mutation to withdraw an application during
 *       Stage 1 (`pending`) or Stage 2 (`shortlisted`).
 *     - `useAcceptOffer()` / `useRejectOffer()`: Stage 3 mutations that either
 *       lock the contract (`accepted`) or decline the employer's offer.
 *
 * (c) UI <-> React Query <-> Pusher WebSockets <-> Laravel REST API Data Flow:
 *     1. `useApplication(applicationId)` hydrates the screen from React Query
 *        (`['application', applicationId]`) and refetches on focus.
 *     2. Real-time notifications (`notification.sent` / `message.sent` on
 *        Pusher) invalidate application and conversation caches when the
 *        employer shortlists the worker or sends a price offer.
 *     3. Accepting an offer (`POST /api/v1/applications/{id}/accept-offer`)
 *        transitions the application to Stage 4 (`accepted`), invalidates
 *        job/application queries, and navigates to the milestone `SuccessScreen`.
 * ============================================================================
 */
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useLanguage } from '../../contexts/LanguageContext';

type ApplicationDetailScreenRouteProp = RouteProp<WorkerStackParamList, 'ApplicationDetail'>;
type ApplicationDetailScreenNavigationProp = NativeStackNavigationProp<
  WorkerStackParamList,
  'ApplicationDetail'
>;

const ApplicationDetailScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
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

  const handleGoBack = React.useCallback(() => {
    const state = navigation.getState?.();
    if (state && typeof state.index === 'number' && state.index > 0) {
      navigation.goBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      (navigation as any).navigate('Mine', { screen: 'Applications' });
    }
  }, [navigation]);

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
    showAlert(t('alert_withdraw_title'), t('alert_withdraw_msg'), [
      { text: t('alert_withdraw_btn_cancel'), style: 'cancel' },
      {
        text: t('alert_withdraw_btn_confirm'),
        style: 'destructive',
        onPress: () => {
          withdraw(applicationId, {
            onSuccess: () => {
              handleGoBack();
            },
            onError: (err: any) => {
              showAlert(t('error_title'), err.message || t('alert_withdraw_err_msg'));
            },
          });
        },
      },
    ]);
  };

  const handleAcceptOffer = () => {
    acceptOfferMutation.mutate(applicationId, {
      onSuccess: () => {
        triggerHaptic('success');
        navigation.replace('Success', {
          variant: 'milestone',
          title: t('hiring_stage4_milestone_title'),
          message: t('hiring_stage4_milestone_msg', {
            jobTitle: jobTitle || 'this job',
            employerName: employerName || 'the employer',
          }),
          detail: [
            { label: 'Job', value: jobTitle || 'Job' },
            { label: 'Employer', value: employerName || 'Employer' },
            ...(compensation
              ? [{ label: t('hiring_final_agreed_price_eyebrow'), value: `₱${compensation}` }]
              : []),
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
      t('alert_decline_offer_title'),
      t('alert_decline_offer_msg').replace('{jobTitle}', jobTitle || 'this job'),
      [
        { text: t('alert_decline_offer_btn_cancel'), style: 'cancel' },
        {
          text: t('alert_decline_offer_btn_confirm'),
          style: 'destructive',
          onPress: () => {
            rejectOfferMutation.mutate(applicationId, {
              onSuccess: () => {
                triggerHaptic('medium');
                showAlert(
                  t('alert_decline_offer_title'),
                  t('alert_decline_offer_success_msg').replace(
                    '{jobTitle}',
                    jobTitle || 'this job',
                  ),
                );
                refetch();
              },
              onError: (err: any) => {
                showAlert(t('error_title'), err.message || t('alert_decline_offer_err_msg'));
              },
            });
          },
        },
      ],
    );
  };

  // ==========================================================================
  // 4-STAGE PROGRESSIVE DATA DISCLOSURE & HIRING PIPELINE (WORKER VIEW)
  // ==========================================================================
  // Maps backend `application.status` to SIKAP's progressive trust stages:
  //   Stage 1 (Applied / `pending`):
  //     Privacy Shield is active. Only public profile info (skills, work
  //     history, reputation score) is visible to the employer. Phone number,
  //     character references, and emergency contact remain locked.
  //   Stage 2 (Shortlisted / `pending_negotiation` | `employer_requested`):
  //     Employer has shortlisted the worker. Worker's mobile number, character
  //     references, and in-app chat unlock so both parties can negotiate scope.
  //   Stage 3 (Offer Received / `employer_confirmed`):
  //     Employer has locked a formal price offer (`final_agreed_price`). Worker
  //     can review and either Accept or Decline the offer.
  //   Stage 4 (Hired / `accepted` | `hired`):
  //     Worker accepted the offer. Contract price and slot are locked, and
  //     emergency contact details are shared for worksite safety.
  //   Stage 5 (Done / `completed`):
  //     Job is finished; renders `CompletedJobOverview` receipt and mutual rating.
  // ==========================================================================
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
        <TouchableOpacity style={styles.iconBtn} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text
            style={styles.headerPillText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {status === 'withdrawn'
              ? t('status_withdrawn')
              : stage === 1
                ? t('application_tracking')
                : stage === 2
                  ? t('status_shortlisted')
                  : stage === 3
                    ? t('status_job_offer_received')
                    : stage === 4
                      ? t('status_hired')
                      : t('receipt_official_header') || 'Job Receipt'}
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
              {t('confirm_withdraw_prompt')
                ? 'You have withdrawn your application for this job.'
                : 'You have withdrawn your application for this job.'}
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
              <Text style={styles.stageLabel}>{t('stepper_applied')}</Text>
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
              <Text style={styles.stageLabel}>{t('stepper_shortlisted')}</Text>
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
              <Text style={styles.stageLabel}>{t('stepper_offer')}</Text>
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
              <Text style={styles.stageLabel}>{t('stepper_hired')}</Text>
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
              <Text style={styles.stageLabel}>{t('stepper_done')}</Text>
            </View>
          </View>
        )}

        {/* Dynamic Content based on Stage */}

        {/* STAGE 1: PENDING */}
        {stage === 1 && (
          <View>
            <Text style={styles.pageTitle}>{t('hiring_stage1_sent_title')}</Text>
            <Text style={styles.lede}>
              {t('hiring_stage1_sent_desc', {
                jobTitle: jobTitle || 'this job',
                employerName: employerName || 'The employer',
              })}
            </Text>

            <View style={[styles.shieldCard, { marginTop: 24 }]}>
              <View style={[styles.shieldHeader, { marginBottom: 0 }]}>
                <View style={[styles.shieldBadge, { backgroundColor: colors.sky }]}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.skyDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.shieldSub, { color: colors.skyDeep }]}>
                    {t('hiring_privacy_shield_on')}
                  </Text>
                  <Text style={styles.shieldTitle}>{t('hiring_privacy_shield_public_only')}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* STAGE 2: SHORTLISTED */}
        {stage === 2 && (
          <View>
            <Text style={styles.pageTitle}>
              {t('hiring_stage2_wants_to_talk', { employerName })}
            </Text>
            <Text style={styles.lede}>
              {t('hiring_stage2_shortlisted_desc', { jobTitle: jobTitle || 'this job' })}
            </Text>

            <View style={styles.minimalistSharedBox}>
              <View style={styles.minimalistSharedHeader}>
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.minimalistSharedTitle}>
                  {t('hiring_contact_disclosed_title')}
                </Text>
              </View>
              <View style={styles.minimalistChipsRow}>
                <View style={styles.minimalistChip}>
                  <Ionicons name="call-outline" size={13} color={colors.primaryDark} />
                  <Text style={styles.minimalistChipText}>{t('hiring_mobile_number_chip')}</Text>
                </View>
                <View style={styles.minimalistChip}>
                  <Ionicons name="people-outline" size={13} color={colors.primaryDark} />
                  <Text style={styles.minimalistChipText}>
                    {t('hiring_character_references_chip')}
                  </Text>
                </View>
              </View>
              <Text style={styles.minimalistSharedFootnote}>
                {t('hiring_chat_advice_footnote')}
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
                <Text style={[styles.priceEyebrow, { color: '#854D0E' }]}>
                  {t('hiring_final_agreed_price_eyebrow')}
                </Text>
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
              <Text style={styles.mintNoticeText}>{t('hiring_slot_locked_guarantee')}</Text>
            </View>

            <View style={styles.employerContactCard}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>{(employerName || 'Employer').charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.employerNameCard}>{employerName || 'Employer'}</Text>
                <Text style={styles.employerSubCard}>{t('hiring_offer_active_status')}</Text>
              </View>
              <Ionicons name="call-outline" size={22} color={colors.primary} />
            </View>
          </View>
        )}

        {/* STAGE 4: HIRED */}
        {stage === 4 && (
          <View>
            <View style={[styles.priceCard, styles.priceCardMint]}>
              <Text style={[styles.priceEyebrow, { color: '#166534' }]}>
                {t('hiring_active_contract_eyebrow')}
              </Text>
              <Text style={styles.priceNum}>
                ₱{compensation ? Number(compensation).toLocaleString() : '0'}
              </Text>
              <Text style={styles.priceDesc}>Agreed price locked.</Text>
            </View>

            <View style={[styles.mintNotice, styles.mintNoticeEmerald]}>
              <Ionicons name="briefcase" size={20} color="#15803D" />
              <Text style={styles.mintNoticeText}>{t('hiring_stage4_guidance')}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FOOTER ACTIONS */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {stage === 1 && status !== 'withdrawn' && (
          <Button
            label={isWithdrawing ? 'Withdrawing...' : t('withdraw_application')}
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
              label={t('open_chat')}
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleOpenChat}
            />
            <Button
              label={isWithdrawing ? 'Withdrawing...' : t('withdraw_application')}
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
            <View style={styles.footerRow}>
              <Button
                label={t('hiring_decline_offer_btn')}
                variant="outline"
                size="base"
                style={{ flex: 1 }}
                loading={rejectOfferMutation.isPending}
                disabled={acceptOfferMutation.isPending || rejectOfferMutation.isPending}
                onPress={handleRejectOffer}
              />
              <Button
                label={t('hiring_accept_offer_btn')}
                variant="primary"
                size="base"
                style={{ flex: 1 }}
                loading={acceptOfferMutation.isPending}
                disabled={acceptOfferMutation.isPending || rejectOfferMutation.isPending}
                onPress={handleAcceptOffer}
              />
            </View>
            <Button
              label={t('open_chat')}
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
              label={t('open_chat')}
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleOpenChat}
            />
            <Button
              label={t('hiring_job_in_progress_btn')}
              variant="ghost"
              size="base"
              fullWidth
              disabled
            />
          </>
        )}
        {stage === 5 && (
          <Button
            label={t('open_chat')}
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleOpenChat}
          />
        )}
        {status === 'rejected' && (
          <Button
            label={t('open_chat')}
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
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setMenuVisible(false);
                const targetJobId = appData?.job?.id || appData?.job_post_id;
                if (targetJobId) {
                  navigation.navigate('JobDetails', { id: targetJobId });
                }
              }}
            >
              <Ionicons name="eye-outline" size={20} color={colors.primary} />
              <Text style={[styles.menuOptionText, { color: colors.ink }]}>
                {t('receipt_btn_view_job_post') || 'View Job Post'}
              </Text>
            </TouchableOpacity>

            {stage < 4 && status !== 'completed' && status !== 'withdrawn' && (
              <TouchableOpacity style={styles.menuOption} onPress={handleWithdraw}>
                <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                <Text style={[styles.menuOptionText, { color: colors.error }]}>
                  {t('withdraw_application')}
                </Text>
              </TouchableOpacity>
            )}
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
    maxWidth: '72%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.sm,
  },
  headerPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primary,
    textAlign: 'center',
  },
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
    marginHorizontal: 4,
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
    paddingTop: 10,
    backgroundColor: colors.paperBright,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
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
