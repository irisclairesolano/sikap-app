import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Message } from '../../types';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { applicationsApi } from '../../api/applications';
import { messagesApi } from '../../api/messages';
import { useQueryClient } from '@tanstack/react-query';
import { useAlert } from '../../contexts/AlertContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfirmHire } from '../../hooks/useJobApplications';
import { useMarkJobComplete } from '../../hooks/useJobs';
import { useAcceptOffer, useRejectOffer, useFlagOffline } from '../../hooks/useApply';
import { triggerHaptic } from '../../utils/haptics';

export const DOLE_DAILY_MINIMUM = 455;
export const DOLE_HOURLY_MINIMUM = 56.88;

interface ActionCardProps {
  message: Message;
  currentUserId: number;
  currentUserRole: 'worker' | 'employer';
  conversationId: number;
  conversationStatus?: 'open' | 'locked' | 'unlock_requested';
  applicationStatus?: string;
  applicationId?: number;
  hasReviewed?: boolean;
  otherUserName?: string;
  jobTitle?: string;
  jobId?: number;
  jobCompensation?: number | null;
  jobRateUnit?: string | null;
  finalAgreedPrice?: number | null;
  hasRealMessageFromEmployer?: boolean;
  isBlocked?: boolean;
  isSlotLocked?: boolean;
  onActionComplete: () => void;
}

const formatCurrency = (val: unknown) => {
  const num = typeof val === 'number' ? val : parseFloat(String(val ?? '0'));
  if (isNaN(num)) return '₱0.00';
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ActionCard: React.FC<ActionCardProps> = ({
  message,
  currentUserRole,
  conversationId,
  conversationStatus = 'open',
  applicationStatus,
  applicationId,
  hasReviewed = false,
  otherUserName,
  jobTitle,
  jobId,
  jobCompensation,
  jobRateUnit,
  finalAgreedPrice,
  hasRealMessageFromEmployer,
  isBlocked = false,
  isSlotLocked = false,
  onActionComplete,
}) => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { t } = useLanguage();
  const confirmHireMutation = useConfirmHire();
  const markJobCompleteMutation = useMarkJobComplete();
  const acceptOfferMutation = useAcceptOffer();
  const rejectOfferMutation = useRejectOffer();
  const flagOfflineMutation = useFlagOffline();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [isPriceInputVisible, setIsPriceInputVisible] = useState(false);
  const [hireDecision, setHireDecision] = useState<'hire' | 'decline' | null>(null);
  const hasEmployerSentMessage = hasRealMessageFromEmployer ?? true;
  const [isGuideMinimized, setIsGuideMinimized] = useState(hasRealMessageFromEmployer === true);

  const { card_type } = message;

  const [optimisticState, setOptimisticState] = useState<{
    cardResolved?: boolean;
    applicationStatus?: string;
    finalAgreedPrice?: number;
    conversationStatus?: 'open' | 'locked' | 'unlock_requested';
    cardDataPatch?: Record<string, any>;
  } | null>(null);

  const card_data = {
    ...message.card_data,
    ...(optimisticState?.cardDataPatch || {}),
  };

  const card_resolved =
    optimisticState?.cardResolved !== undefined
      ? optimisticState.cardResolved
      : message.card_resolved;

  const effectiveApplicationStatus =
    optimisticState?.applicationStatus !== undefined
      ? optimisticState.applicationStatus
      : applicationStatus;

  const effectiveConversationStatus =
    optimisticState?.conversationStatus !== undefined
      ? optimisticState.conversationStatus
      : conversationStatus;

  const targetAppId = Number(card_data?.application_id || card_data?.id || applicationId || 0);
  const cachedApp: any =
    targetAppId > 0 && queryClient?.getQueryData
      ? queryClient.getQueryData(['application', targetAppId])
      : null;
  const applicationObj = cachedApp?.data ?? cachedApp;

  const userHasReviewed = Boolean(
    hasReviewed ||
    applicationObj?.has_reviewed ||
    applicationObj?.user_review ||
    (applicationObj as any)?.reviewed ||
    card_data?.has_reviewed ||
    card_data?.user_has_reviewed,
  );

  if (message.message_type !== 'action_card' || !message.card_type) return null;

  const effectivePrice =
    optimisticState?.finalAgreedPrice ??
    card_data?.price ??
    card_data?.final_agreed_price ??
    (card_data as any)?.agreed_price ??
    finalAgreedPrice;

  const effectiveJobCompensation =
    jobCompensation ??
    (card_data?.compensation as number | undefined) ??
    (applicationObj?.job?.compensation as number | undefined);
  const effectiveJobRateUnit =
    jobRateUnit ??
    (card_data?.rate_unit as string | undefined) ??
    (applicationObj?.job?.rate_unit as string | undefined);

  const applyOptimisticCardUpdate = (patch: {
    cardResolved?: boolean;
    applicationStatus?: string;
    finalAgreedPrice?: number;
    conversationStatus?: 'open' | 'locked' | 'unlock_requested';
    cardDataPatch?: Record<string, any>;
  }) => {
    // 1. Immediately update local card state (0 ms)
    setOptimisticState((prev) => ({
      cardResolved:
        patch.cardResolved !== undefined ? patch.cardResolved : (prev?.cardResolved ?? true),
      applicationStatus:
        patch.applicationStatus !== undefined ? patch.applicationStatus : prev?.applicationStatus,
      finalAgreedPrice:
        patch.finalAgreedPrice !== undefined ? patch.finalAgreedPrice : prev?.finalAgreedPrice,
      conversationStatus:
        patch.conversationStatus !== undefined
          ? patch.conversationStatus
          : prev?.conversationStatus,
      cardDataPatch: {
        ...(prev?.cardDataPatch || {}),
        ...(patch.cardDataPatch || {}),
      },
    }));

    // 2. Synchronously update ['messages', conversationId] in queryClient cache
    queryClient.setQueryData(['messages', conversationId], (old: any) => {
      if (!old) return old;
      if (old.pages && Array.isArray(old.pages)) {
        const newPages = old.pages.map((page: any) => {
          if (!page?.data || !Array.isArray(page.data)) return page;
          return {
            ...page,
            data: page.data.map((m: Message) => {
              if (m.id === message.id) {
                return {
                  ...m,
                  card_resolved: patch.cardResolved !== undefined ? patch.cardResolved : true,
                  card_data: {
                    ...m.card_data,
                    ...(patch.cardDataPatch || {}),
                    ...(patch.finalAgreedPrice !== undefined
                      ? {
                          price: patch.finalAgreedPrice,
                          final_agreed_price: patch.finalAgreedPrice,
                        }
                      : {}),
                  },
                };
              }
              return m;
            }),
          };
        });
        return { ...old, pages: newPages };
      }
      if (Array.isArray(old)) {
        return old.map((m: Message) => {
          if (m.id === message.id) {
            return {
              ...m,
              card_resolved: patch.cardResolved !== undefined ? patch.cardResolved : true,
              card_data: {
                ...m.card_data,
                ...(patch.cardDataPatch || {}),
                ...(patch.finalAgreedPrice !== undefined
                  ? { price: patch.finalAgreedPrice, final_agreed_price: patch.finalAgreedPrice }
                  : {}),
              },
            };
          }
          return m;
        });
      }
      return old;
    });

    // 3. Synchronously update ['conversation', conversationId] cache
    queryClient.setQueryData(['conversation', conversationId], (old: any) => {
      if (!old) return old;
      const targetObj = old.data ? old.data : old;
      const updated = {
        ...targetObj,
        ...(patch.applicationStatus !== undefined
          ? { application_status: patch.applicationStatus }
          : {}),
        ...(patch.finalAgreedPrice !== undefined
          ? { final_agreed_price: patch.finalAgreedPrice }
          : {}),
        ...(patch.conversationStatus !== undefined ? { status: patch.conversationStatus } : {}),
      };
      return old.data ? { ...old, data: updated } : updated;
    });

    // 4. Synchronously update ['conversations'] cache
    queryClient.setQueriesData({ queryKey: ['conversations'] }, (old: any) => {
      if (!old) return old;
      const updateList = (list: any[]) =>
        list.map((c: any) => {
          if (c.id === conversationId) {
            return {
              ...c,
              ...(patch.applicationStatus !== undefined
                ? { application_status: patch.applicationStatus }
                : {}),
              ...(patch.finalAgreedPrice !== undefined
                ? { final_agreed_price: patch.finalAgreedPrice }
                : {}),
              ...(patch.conversationStatus !== undefined
                ? { status: patch.conversationStatus }
                : {}),
            };
          }
          return c;
        });
      if (Array.isArray(old)) return updateList(old);
      if (old.data && Array.isArray(old.data)) return { ...old, data: updateList(old.data) };
      return old;
    });

    // 5. Synchronously update ['application', targetAppId] cache if applicable
    if (targetAppId > 0) {
      queryClient.setQueryData(['application', targetAppId], (old: any) => {
        if (!old) return old;
        const targetObj = old.data ? old.data : old;
        const updated = {
          ...targetObj,
          ...(patch.applicationStatus !== undefined ? { status: patch.applicationStatus } : {}),
          ...(patch.finalAgreedPrice !== undefined
            ? { final_agreed_price: patch.finalAgreedPrice, agreed_price: patch.finalAgreedPrice }
            : {}),
        };
        return old.data ? { ...old, data: updated } : updated;
      });
    }
  };

  const handleAction = async (
    actionId: string,
    apiCall: () => Promise<any>,
    invalidateKeys?: unknown[][],
    optimisticConfig?: {
      cardResolved?: boolean;
      applicationStatus?: string;
      finalAgreedPrice?: number;
      conversationStatus?: 'open' | 'locked' | 'unlock_requested';
      cardDataPatch?: Record<string, any>;
    },
  ) => {
    if (isBlocked) {
      triggerHaptic('error');
      showAlert('Action Unavailable', 'Cannot perform actions while this conversation is blocked.');
      return;
    }
    triggerHaptic('success');
    if (optimisticConfig) {
      applyOptimisticCardUpdate(optimisticConfig);
    } else {
      setLoadingAction(actionId);
    }

    try {
      await apiCall();
      if (invalidateKeys) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      onActionComplete();
    } catch (error: any) {
      if (optimisticConfig) {
        setOptimisticState(null);
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      }
      triggerHaptic('error');
      showAlert('Action Failed', error.message || 'Unable to complete request.');
    } finally {
      setLoadingAction(null);
    }
  };

  const renderEtchedCard = (
    title: string,
    subtitle?: string,
    icon: keyof typeof Ionicons.glyphMap = 'checkmark-circle-outline',
    badgeText: string = 'Completed',
    badgeColor: string = colors.mintDeep,
    badgeBg: string = '#DCFCE7',
    ctaButton?: { label: string; onPress: () => void; iconName?: keyof typeof Ionicons.glyphMap },
  ) => (
    <View style={styles.etchedCardContainer}>
      <View style={styles.etchedCard}>
        <View style={styles.etchedCardTop}>
          <View style={[styles.etchedIconBadge, { backgroundColor: badgeBg }]}>
            <Ionicons name={icon} size={16} color={badgeColor} />
          </View>
          <View style={styles.etchedContent}>
            <Text style={styles.etchedTitle}>{title}</Text>
            {subtitle ? <Text style={styles.etchedSubtitle}>{subtitle}</Text> : null}
            {badgeText ? (
              <View style={styles.etchedBadgeRow}>
                <View style={[styles.etchedBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.etchedBadgeText, { color: badgeColor }]}>{badgeText}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      {ctaButton && (
        <TouchableOpacity
          style={styles.ratingCtaBtn}
          onPress={ctaButton.onPress}
          activeOpacity={0.85}
        >
          <Ionicons name={ctaButton.iconName || 'star'} size={15} color={colors.white} />
          <Text style={styles.ratingCtaBtnText}>{ctaButton.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // 1. JOB REQUEST & CONFIRM HIRE
  if (card_type === 'job_request' || card_type === 'confirm_hire') {
    if (effectiveApplicationStatus === 'rejected' || effectiveApplicationStatus === 'declined') {
      return renderEtchedCard(
        'Application Declined',
        'This application was declined and conversation is closed.',
        'close-circle-outline',
        t('card_status_declined'),
        colors.error,
        '#FEE2E2',
      );
    }

    const isConfirmResolved =
      card_resolved ||
      ['employer_confirmed', 'accepted', 'completed'].includes(effectiveApplicationStatus || '');

    if (isConfirmResolved) {
      const displayPrice = effectivePrice;
      return renderEtchedCard(
        'Hire Confirmed by Employer',
        displayPrice ? `Agreed Price: ${formatCurrency(displayPrice)}` : 'Agreed price confirmed.',
        'cash-outline',
        t('card_status_confirmed'),
        '#1D4ED8',
        '#DBEAFE',
      );
    }

    const employerName = String(
      card_data?.employer_name ||
        (currentUserRole === 'worker' ? otherUserName || 'The employer' : 'You'),
    );
    const workerName = String(
      card_data?.worker_name ||
        (currentUserRole === 'employer' ? otherUserName || 'The applicant' : 'You'),
    );
    const displayJobTitle = String(card_data?.job_title || jobTitle || 'the job');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="briefcase-outline" size={20} color="#1D4ED8" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>{t('shortlisted_application')}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {displayJobTitle}
            </Text>
          </View>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>{t('stage_2')}</Text>
          </View>
        </View>

        {/* Primary Request Announcement */}
        <View style={styles.requestBanner}>
          <Text style={styles.requestBannerText}>
            {currentUserRole === 'worker' ? (
              <>
                <Text style={styles.requestBannerBold}>{employerName}</Text>
                {" shortlisted your application for '"}
                <Text style={styles.requestBannerBold}>{displayJobTitle}</Text>
                {"'."}
              </>
            ) : (
              <>
                {'You shortlisted '}
                <Text style={styles.requestBannerBold}>{workerName}</Text>
                {" for '"}
                <Text style={styles.requestBannerBold}>{displayJobTitle}</Text>
                {"'."}
              </>
            )}
          </Text>
        </View>

        {/* Next Steps Guidance */}
        <View style={[styles.guideBox, isGuideMinimized && styles.guideBoxMinimized]}>
          <TouchableOpacity
            style={[styles.guideHeader, isGuideMinimized && styles.guideHeaderMinimized]}
            onPress={() => {
              triggerHaptic('light');
              setIsGuideMinimized((prev) => !prev);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isGuideMinimized ? 'Expand next steps' : 'Minimize next steps'}
          >
            <View style={styles.guideHeaderLeft}>
              <Ionicons name="compass-outline" size={15} color={colors.primary} />
              <Text style={styles.guideTitle}>{t('next_steps')}</Text>
              <View style={styles.guideCountBadge}>
                <Text style={styles.guideCountText}>{t('guide_step_count')}</Text>
              </View>
            </View>
            <View style={styles.guideToggle}>
              <Text style={styles.guideToggleText}>
                {isGuideMinimized ? t('guide_show') : t('guide_minimize')}
              </Text>
              <Ionicons
                name={isGuideMinimized ? 'chevron-down' : 'chevron-up'}
                size={14}
                color={colors.inkMuted}
              />
            </View>
          </TouchableOpacity>

          {!isGuideMinimized && (
            <>
              {currentUserRole === 'worker' ? (
                <>
                  <View style={styles.guideStepRow}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{t('guide_worker_step1_title')}</Text>
                      <Text style={styles.stepDesc}>{t('guide_worker_step1_desc')}</Text>
                    </View>
                  </View>

                  <View style={styles.guideStepRow}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{t('guide_worker_step2_title')}</Text>
                      <Text style={styles.stepDesc}>{t('guide_worker_step2_desc')}</Text>
                    </View>
                  </View>

                  <View style={styles.guideStepRow}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>3</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{t('guide_worker_step3_title')}</Text>
                      <Text style={styles.stepDesc}>{t('guide_worker_step3_desc')}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.guideStepRow}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{t('guide_employer_step1_title')}</Text>
                      <Text style={styles.stepDesc}>
                        {t('guide_employer_step1_desc', {
                          workerName: otherUserName || 'the worker',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.guideStepRow}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{t('guide_employer_step2_title')}</Text>
                      <Text style={styles.stepDesc}>{t('guide_employer_step2_desc')}</Text>
                    </View>
                  </View>

                  <View style={styles.guideStepRow}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>3</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{t('guide_employer_step3_title')}</Text>
                      <Text style={styles.stepDesc}>
                        {t('guide_employer_step3_desc', {
                          workerName: otherUserName || 'the worker',
                        })}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </>
          )}
        </View>

        {/* DOLE Region V Suggested Wage Advisory Guide */}
        {!isSlotLocked && (
          <View style={styles.doleWageBox} testID="dole-wage-guide-box">
            <View style={styles.doleWageHeader}>
              <View style={styles.doleWageBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#047857" />
                <Text style={styles.doleWageBadgeText}>{t('dole_wage_guide_title')}</Text>
              </View>
              <Text style={styles.doleWageSubtext}>{t('dole_wage_region_tag')}</Text>
            </View>

            <View style={styles.doleWageRow}>
              <View style={styles.doleWageCol}>
                <Text style={styles.doleWageLabel}>{t('dole_wage_suggested_label')}</Text>
                <Text style={styles.doleWageValue}>{t('dole_wage_daily_baseline')}</Text>
                <Text style={styles.doleWageEq}>{t('dole_wage_hourly_baseline')}</Text>
              </View>
              {effectiveJobCompensation != null && Number(effectiveJobCompensation) > 0 ? (
                <View style={[styles.doleWageCol, styles.doleWageColBorder]}>
                  <Text style={styles.doleWageLabel}>{t('dole_wage_posted_rate')}</Text>
                  <Text style={styles.doleWagePostedValue}>
                    ₱{Number(effectiveJobCompensation).toLocaleString()}
                    {effectiveJobRateUnit === 'per_hour'
                      ? ' / hr'
                      : effectiveJobRateUnit === 'per_day'
                        ? ' / day'
                        : ''}
                  </Text>
                  <Text style={styles.doleWageEq}>
                    {effectiveJobRateUnit === 'per_hour'
                      ? '≈ ₱' + (Number(effectiveJobCompensation) * 8).toLocaleString() + ' / day'
                      : effectiveJobRateUnit === 'per_day'
                        ? '≈ ₱' + (Number(effectiveJobCompensation) / 8).toFixed(2) + ' / hr'
                        : 'Fixed Project'}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.doleWageHint}>
              {currentUserRole === 'worker'
                ? t('dole_wage_negotiation_worker_hint')
                : t('dole_wage_negotiation_employer_hint')}
            </Text>
          </View>
        )}

        {/* Worker Footer Notice */}
        {currentUserRole === 'worker' && !isSlotLocked && (
          <View style={styles.chatReadyPill}>
            <Ionicons name="chatbubbles-outline" size={14} color={colors.primary} />
            <Text style={styles.chatReadyText}>{t('chat_is_open_notice')}</Text>
          </View>
        )}

        {/* Slot Locked Banner or Employer Actions */}
        {isSlotLocked ? (
          <View style={styles.slotFullBanner}>
            <Ionicons
              name="lock-closed"
              size={15}
              color={colors.inkMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.slotFullBannerText}>{t('slots_full_no_negotiation')}</Text>
          </View>
        ) : currentUserRole === 'employer' ? (
          <>
            {!hasEmployerSentMessage ? (
              <View style={styles.chatReadyPill}>
                <Ionicons name="chatbubbles-outline" size={14} color={colors.inkMuted} />
                <Text style={[styles.chatReadyText, { color: colors.inkMuted }]}>
                  {t('send_message_before_hire_notice')}
                </Text>
              </View>
            ) : hireDecision !== 'hire' ? (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: colors.paperBright,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.inkFaint,
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}
                >
                  <Ionicons name="help-circle-outline" size={17} color={colors.primary} />
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink }}>
                    {t('hire_decision')}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: colors.inkSoft,
                    marginBottom: 12,
                    lineHeight: 18,
                  }}
                >
                  {t('hire_decision_prompt')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { flex: 1, backgroundColor: colors.primary }]}
                    onPress={() => {
                      setHireDecision('hire');
                      setIsPriceInputVisible(true);
                    }}
                  >
                    <Text
                      style={styles.actionBtnText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {t('hire_worker')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        flex: 1,
                        backgroundColor: '#FEE2E2',
                        borderWidth: 1,
                        borderColor: '#FCA5A5',
                      },
                    ]}
                    disabled={!!loadingAction}
                    onPress={() => {
                      showAlert(
                        t('decline_applicant'),
                        'Are you sure you want to decline this applicant? This will close the conversation and send them an encouraging update.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Yes, Decline',
                            style: 'destructive',
                            onPress: () => {
                              const appId = targetAppId;
                              handleAction(
                                'decline',
                                () => applicationsApi.decline(appId),
                                [
                                  ['conversations'],
                                  ['conversation', conversationId],
                                  ['messages', conversationId],
                                  ['jobApplications'],
                                  ['application', appId],
                                  ['myJobs'],
                                  ['job'],
                                ],
                                {
                                  cardResolved: true,
                                  applicationStatus: 'declined',
                                },
                              );
                            },
                          },
                        ],
                      );
                    }}
                  >
                    {loadingAction === 'decline' ? (
                      <ActivityIndicator color={colors.error} />
                    ) : (
                      <Text
                        style={[styles.actionBtnText, { color: colors.error }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {t('decline')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : !isPriceInputVisible ? (
              <TouchableOpacity
                testID="set-final-price-toggle-btn"
                style={styles.togglePriceBtn}
                onPress={() => setIsPriceInputVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.togglePriceLeft}>
                  <Ionicons name="cash-outline" size={17} color={colors.primary} />
                  <Text
                    style={styles.togglePriceBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {t('set_final_price_confirm_hire')}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={17} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.priceSection}>
                <View style={styles.priceSectionHeader}>
                  <Text style={styles.priceSectionTitle}>{t('set_final_agreed_price')}</Text>
                  <TouchableOpacity
                    onPress={() => setIsPriceInputVisible(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('enter_agreed_price_placeholder')}
                  placeholderTextColor={colors.inkLight}
                  keyboardType="numeric"
                  value={priceInput}
                  onChangeText={setPriceInput}
                  autoFocus
                />

                {/* DOLE Quick Fill Pills */}
                <View style={styles.dolePillRow}>
                  <TouchableOpacity
                    testID="dole-quick-pill-min"
                    style={styles.doleQuickPill}
                    onPress={() => {
                      triggerHaptic('light');
                      setPriceInput('455');
                    }}
                  >
                    <Ionicons name="sparkles" size={12} color={colors.primary} />
                    <Text style={styles.doleQuickPillText}>{t('dole_wage_use_suggested')}</Text>
                  </TouchableOpacity>
                  {effectiveJobCompensation && Number(effectiveJobCompensation) !== 455 ? (
                    <TouchableOpacity
                      testID="dole-quick-pill-posted"
                      style={styles.doleQuickPill}
                      onPress={() => {
                        triggerHaptic('light');
                        setPriceInput(String(effectiveJobCompensation));
                      }}
                    >
                      <Ionicons name="pricetag-outline" size={12} color={colors.ink} />
                      <Text style={[styles.doleQuickPillText, { color: colors.ink }]}>
                        {t('dole_wage_use_posted', {
                          amount: Number(effectiveJobCompensation).toLocaleString(),
                        })}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Real-time Sanity / DOLE benchmark warning / validation */}
                {parseFloat(priceInput) > 0 && parseFloat(priceInput) < 455 ? (
                  <View style={styles.doleInputWarningBox} testID="dole-input-warning-box">
                    <Ionicons name="warning-outline" size={14} color="#B45309" />
                    <Text style={styles.doleInputWarningText}>
                      {t('dole_wage_offer_below_warning', {
                        amount: parseFloat(priceInput).toLocaleString(),
                      })}
                    </Text>
                  </View>
                ) : parseFloat(priceInput) >= 455 ? (
                  <View style={styles.doleInputSuccessBox} testID="dole-input-success-box">
                    <Ionicons name="checkmark-circle" size={14} color="#047857" />
                    <Text style={styles.doleInputSuccessText}>
                      {t('dole_wage_offer_meets_badge')}
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.priceHelperText}>{t('agreed_price_helper_note')}</Text>
                <View style={styles.priceActionsRow}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1, marginTop: 0 }]}
                    onPress={() => {
                      const price = parseFloat(priceInput);
                      if (isNaN(price) || price <= 0) {
                        showAlert('Invalid Price', 'Please enter a valid price in Pesos.');
                        return;
                      }
                      setIsPriceInputVisible(false);
                      triggerHaptic('success');
                      applyOptimisticCardUpdate({
                        cardResolved: true,
                        applicationStatus: 'employer_confirmed',
                        finalAgreedPrice: price,
                        cardDataPatch: { price, final_agreed_price: price },
                      });
                      confirmHireMutation.mutate(
                        { id: targetAppId, price },
                        {
                          onSuccess: () => {
                            onActionComplete();
                          },
                          onError: (err: any) => {
                            setOptimisticState(null);
                            queryClient.invalidateQueries({
                              queryKey: ['messages', conversationId],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ['conversation', conversationId],
                            });
                            showAlert('Action Failed', err.message || 'Unable to confirm hire.');
                          },
                        },
                      );
                    }}
                    disabled={confirmHireMutation.isPending || !!loadingAction}
                  >
                    {confirmHireMutation.isPending ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>{t('confirm_hire')}</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelPriceBtn}
                    onPress={() => setIsPriceInputVisible(false)}
                    disabled={!!loadingAction}
                  >
                    <Text style={styles.cancelPriceBtnText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : null}
      </View>
    );
  }

  // 3. ACCEPT OR REJECT
  if (card_type === 'accept_or_reject') {
    const isOfferResolved =
      card_resolved ||
      ['accepted', 'completed', 'rejected', 'cancelled'].includes(effectiveApplicationStatus || '');

    if (isOfferResolved) {
      if (effectiveApplicationStatus === 'rejected' || effectiveApplicationStatus === 'cancelled') {
        return renderEtchedCard(
          t('job_offer_declined'),
          `Offer of ${formatCurrency(effectivePrice)} was declined.`,
          'close-circle-outline',
          t('card_status_declined'),
          colors.error,
          '#FEE2E2',
        );
      }
      return renderEtchedCard(
        t('job_offer_accepted'),
        `Agreed Price: ${formatCurrency(effectivePrice)}`,
        'checkmark-done-circle-outline',
        t('card_status_accepted'),
        colors.success,
        '#DCFCE7',
      );
    }

    if (currentUserRole === 'employer') {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBadge, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="paper-plane-outline" size={20} color={colors.success} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.title}>{t('hire_offer_sent')}</Text>
              <Text style={styles.subtitle}>
                Agreed price:{' '}
                <Text style={styles.priceHighlight}>{formatCurrency(effectivePrice)}</Text>{' '}
                <Text style={styles.priceTag}>{t('agreed_price_total_tag')}</Text>
              </Text>
            </View>
            <View style={[styles.headerTag, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.headerTagText, { color: '#B45309' }]}>
                {t('card_status_pending')}
              </Text>
            </View>
          </View>

          {/* DOLE Region V Benchmark Comparison for Sent Offer */}
          {effectivePrice != null && Number(effectivePrice) >= 455 ? (
            <View style={styles.doleOfferBadgeSuccess}>
              <Ionicons name="checkmark-circle" size={13} color="#047857" />
              <Text style={styles.doleOfferBadgeSuccessText}>
                {t('dole_wage_offer_meets_badge')}
              </Text>
            </View>
          ) : effectivePrice != null && Number(effectivePrice) < 455 ? (
            <View style={styles.doleOfferBadgeNotice}>
              <Ionicons name="information-circle" size={13} color="#B45309" />
              <Text style={styles.doleOfferBadgeNoticeText}>
                {t('dole_wage_offer_below_notice', {
                  amount: Number(effectivePrice).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                })}
              </Text>
            </View>
          ) : null}

          <View style={styles.frostedWaitingPill}>
            <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
            <Text style={styles.frostedWaitingText}>
              {t('waiting_worker_response', { workerName: otherUserName || 'the worker' })}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.outlineButtonError, { marginTop: 12 }]}
            onPress={() => {
              showAlert(t('alert_cancel_hire_title'), t('confirm_cancel_hire_prompt'), [
                { text: t('hiring_cancel_hire_back_btn') || 'No', style: 'cancel' },
                {
                  text: t('hiring_cancel_hire_confirm_btn') || 'Yes, Cancel',
                  style: 'destructive',
                  onPress: () =>
                    handleAction(
                      'cancel',
                      () =>
                        apiClient(`/applications/${String(targetAppId)}/cancel-hire`, {
                          method: 'PATCH',
                        }),
                      [
                        ['application', targetAppId],
                        ['applications'],
                        ['conversations'],
                        ['conversation', conversationId],
                        ['messages', conversationId],
                        ['job'],
                        ['jobs'],
                        ['myJobs'],
                        ['jobApplications'],
                        ['my-applications'],
                      ],
                      {
                        cardResolved: true,
                        applicationStatus: 'cancelled',
                      },
                    ),
                },
              ]);
            }}
            disabled={!!loadingAction}
          >
            {loadingAction === 'cancel' ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={styles.outlineButtonErrorText}>{t('cancel_hire')}</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (
      isSlotLocked &&
      !['employer_confirmed', 'accepted', 'completed', 'hired'].includes(
        effectiveApplicationStatus || '',
      )
    ) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBadge, { backgroundColor: colors.paperBright }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.inkMuted} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.title}>{t('position_filled')}</Text>
              <Text style={styles.subtitle}>
                Agreed price:{' '}
                <Text style={styles.priceHighlight}>{formatCurrency(effectivePrice)}</Text>
              </Text>
            </View>
          </View>
          <View style={styles.slotFullBanner}>
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={colors.inkMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.slotFullBannerText}>{t('slots_full_no_negotiation')}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="document-text-outline" size={20} color={colors.success} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>{t('job_offer_received')}</Text>
            <Text style={styles.subtitle}>
              Agreed price:{' '}
              <Text style={styles.priceHighlight}>{formatCurrency(effectivePrice)}</Text>{' '}
              <Text style={styles.priceTag}>{t('agreed_price_total_tag')}</Text>
            </Text>
          </View>
        </View>

        {/* DOLE Region V Benchmark Comparison for Received Offer */}
        {effectivePrice != null && Number(effectivePrice) >= 455 ? (
          <View style={styles.doleOfferBadgeSuccess}>
            <Ionicons name="checkmark-circle" size={13} color="#047857" />
            <Text style={styles.doleOfferBadgeSuccessText}>{t('dole_wage_offer_meets_badge')}</Text>
          </View>
        ) : effectivePrice != null && Number(effectivePrice) < 455 ? (
          <View style={styles.doleOfferBadgeNotice}>
            <Ionicons name="information-circle" size={13} color="#B45309" />
            <Text style={styles.doleOfferBadgeNoticeText}>
              {t('dole_wage_offer_below_notice', {
                amount: Number(effectivePrice).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              })}
            </Text>
          </View>
        ) : null}

        <View style={styles.offerTotalNotice}>
          <Ionicons name="information-circle-outline" size={16} color="#166534" />
          <Text style={styles.offerTotalNoticeText}>{t('offer_total_amount_notice')}</Text>
        </View>
        <View style={styles.rowButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
            onPress={() => {
              triggerHaptic('success');
              applyOptimisticCardUpdate({
                cardResolved: true,
                applicationStatus: 'accepted',
              });
              acceptOfferMutation.mutate(targetAppId, {
                onSuccess: () => {
                  onActionComplete();
                  navigation.navigate('Success', {
                    variant: 'milestone',
                    title: "🎉 You're Hired!",
                    message: `Congratulations! You've officially accepted the job offer for "${jobTitle || 'this position'}". Communicate directly with your employer and give it your best!`,
                    primaryAction: {
                      label: 'Back to Chat',
                      goBack: true,
                    },
                    secondaryAction: {
                      label: 'View My Applications',
                      navigateTo: { name: 'MyApplications' },
                    },
                  });
                },
                onError: (err: any) => {
                  setOptimisticState(null);
                  queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                  queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
                  showAlert('Action Failed', err.message || 'Unable to accept offer.');
                },
              });
            }}
            disabled={acceptOfferMutation.isPending || !!loadingAction}
          >
            {acceptOfferMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionBtnText}>{t('accept_offer')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.error }]}
            onPress={() => {
              showAlert('Decline Offer', 'Are you sure you want to decline this job offer?', [
                { text: 'Back', style: 'cancel' },
                {
                  text: 'Yes, Decline',
                  style: 'destructive',
                  onPress: () => {
                    triggerHaptic('medium');
                    applyOptimisticCardUpdate({
                      cardResolved: true,
                      applicationStatus: 'rejected',
                    });
                    rejectOfferMutation.mutate(targetAppId, {
                      onSuccess: () => {
                        onActionComplete();
                      },
                      onError: (err: any) => {
                        setOptimisticState(null);
                        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                        queryClient.invalidateQueries({
                          queryKey: ['conversation', conversationId],
                        });
                        showAlert('Action Failed', err.message || 'Unable to decline offer.');
                      },
                    });
                  },
                },
              ]);
            }}
            disabled={rejectOfferMutation.isPending || !!loadingAction}
          >
            {rejectOfferMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionBtnText}>{t('decline_offer')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 4. CANCEL HIRE
  if (card_type === 'cancel_hire') {
    if (currentUserRole === 'worker') return null;

    if (['accepted', 'completed'].includes(effectiveApplicationStatus || '')) {
      return null;
    }

    if (card_resolved || effectiveApplicationStatus === 'cancelled') {
      return renderEtchedCard(
        t('hiring_cancelled'),
        'This hiring was cancelled.',
        'close-circle-outline',
        'Cancelled',
        colors.error,
        '#FEE2E2',
      );
    }

    // Suppress standalone cancel_hire card when offer is pending worker response (handled in accept_or_reject)
    if (effectiveApplicationStatus === 'employer_confirmed') {
      return null;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="close-circle-outline" size={20} color={colors.error} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>{t('cancel_hire')}</Text>
            <Text style={styles.subtitle}>{t('cancel_hire_before_accept')}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.outlineButtonError}
          onPress={() => {
            showAlert('Cancel Hire', 'Are you sure you want to cancel this hiring offer?', [
              { text: 'No', style: 'cancel' },
              {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: () =>
                  handleAction(
                    'cancel',
                    () =>
                      apiClient(`/applications/${String(targetAppId)}/cancel-hire`, {
                        method: 'PATCH',
                      }),
                    [
                      ['application', targetAppId],
                      ['applications'],
                      ['conversations'],
                      ['conversation', conversationId],
                      ['messages', conversationId],
                      ['job'],
                      ['jobs'],
                      ['myJobs'],
                      ['jobApplications'],
                      ['my-applications'],
                    ],
                    {
                      cardResolved: true,
                      applicationStatus: 'cancelled',
                    },
                  ),
              },
            ]);
          }}
          disabled={!!loadingAction}
        >
          {loadingAction === 'cancel' ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={styles.outlineButtonErrorText}>{t('cancel_hire')}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // 5. EMPLOYER CONTACT REVEAL
  if (card_type === 'employer_contact_reveal') {
    if (currentUserRole === 'employer') return null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: colors.sky }]}>
            <Ionicons name="call" size={18} color={colors.primary} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>{t('employer_contact')}</Text>
            <Text style={styles.subtitle}>{String(card_data?.employer_name ?? '')}</Text>
          </View>
        </View>
        <View style={styles.phoneBox}>
          <Ionicons name="call-outline" size={16} color={colors.primary} />
          <Text selectable style={styles.phoneText}>
            {String(card_data?.phone ?? 'No phone provided')}
          </Text>
        </View>
      </View>
    );
  }

  // 6. WORKER CONTACT REVEAL
  if (card_type === 'worker_contact_reveal') {
    if (currentUserRole === 'worker') return null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: colors.sky }]}>
            <Ionicons name="call" size={18} color={colors.primary} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>{t('worker_contact')}</Text>
            <Text style={styles.subtitle}>{String(card_data?.worker_name ?? '')}</Text>
          </View>
        </View>
        <View style={styles.phoneBox}>
          <Ionicons name="call-outline" size={16} color={colors.primary} />
          <Text selectable style={styles.phoneText}>
            {String(card_data?.phone ?? 'No phone provided')}
          </Text>
        </View>
      </View>
    );
  }

  // 7. MARK COMPLETE (Employer side, or completion etched card for either role)
  if (card_type === 'mark_complete') {
    const isJobCompleted = effectiveApplicationStatus === 'completed';

    if (isJobCompleted) {
      if (currentUserRole === 'worker') {
        return renderEtchedCard(
          t('job_marked_complete'),
          t('work_completed_verified'),
          'checkmark-done-circle',
          'Completed',
          colors.success,
          '#DCFCE7',
          userHasReviewed
            ? undefined
            : {
                label: t('rate_employer'),
                iconName: 'star' as const,
                onPress: () => {
                  navigation.navigate('RateEmployer', {
                    id: Number(card_data?.application_id || card_data?.id || targetAppId),
                    employerName: String(card_data?.employer_name || otherUserName || 'Employer'),
                    jobTitle: String(card_data?.job_title || jobTitle || 'Job'),
                  });
                },
              },
        );
      }

      return renderEtchedCard(
        t('job_marked_complete'),
        t('work_completed_verified'),
        'checkmark-done-circle',
        'Completed',
        colors.success,
        '#DCFCE7',
        userHasReviewed
          ? undefined
          : {
              label: t('rate_worker'),
              iconName: 'star',
              onPress: () => {
                navigation.navigate('RateWorker', {
                  id: Number(card_data?.application_id || card_data?.id || targetAppId),
                  workerName: String(card_data?.worker_name || otherUserName || 'Worker'),
                  jobTitle: String(card_data?.job_title || jobTitle || 'Job'),
                  jobId: Number(card_data?.job_id || jobId),
                });
              },
            },
      );
    }

    if (currentUserRole === 'worker') return null;

    // If resolved prior to full job completion (e.g. superseded by flag_offline), or worker already flagged, hide to avoid duplicate
    if (card_resolved || card_data?.is_flagged || card_data?.is_worker_flagged) {
      return null;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>{t('mark_as_completed')}</Text>
            <Text style={styles.subtitle}>{t('mark_complete_subtitle')}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.success }]}
          onPress={() => {
            showAlert('Mark Complete', 'Has this job been completed satisfactorily?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes, Mark Complete',
                onPress: () => {
                  const targetJobId = Number(card_data?.job_id || jobId);
                  const completePayload = targetAppId
                    ? { jobId: targetJobId, applicationId: targetAppId }
                    : targetJobId;
                  triggerHaptic('success');
                  applyOptimisticCardUpdate({
                    cardResolved: true,
                    applicationStatus: 'completed',
                  });
                  markJobCompleteMutation.mutate(completePayload, {
                    onSuccess: () => {
                      showAlert(
                        'Job Completed',
                        'The job has been marked as complete. You can now submit your review.',
                      );
                      onActionComplete();
                    },
                    onError: (err: any) => {
                      setOptimisticState(null);
                      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
                      showAlert('Action Failed', err.message || 'Unable to mark job complete.');
                    },
                  });
                },
              },
            ]);
          }}
          disabled={markJobCompleteMutation.isPending || !!loadingAction}
        >
          {markJobCompleteMutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>{t('mark_as_completed')}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // 8. FLAG OFFLINE (Worker flags, Employer confirms)
  if (card_type === 'flag_offline') {
    const isJobCompleted = effectiveApplicationStatus === 'completed';

    if (isJobCompleted) {
      // For worker: render Rate Employer CTA
      if (currentUserRole === 'worker') {
        return renderEtchedCard(
          t('job_marked_complete'),
          t('work_completed_verified'),
          'checkmark-done-circle',
          t('card_status_completed'),
          colors.success,
          '#DCFCE7',
          userHasReviewed
            ? undefined
            : {
                label: t('rate_employer'),
                iconName: 'star' as const,
                onPress: () => {
                  navigation.navigate('RateEmployer', {
                    id: Number(card_data?.application_id || card_data?.id || targetAppId),
                    employerName: String(card_data?.employer_name || otherUserName || 'Employer'),
                    jobTitle: String(card_data?.job_title || jobTitle || 'Job'),
                  });
                },
              },
        );
      }

      // For employer: render Rate Worker CTA
      return renderEtchedCard(
        t('job_marked_complete'),
        t('work_completed_verified'),
        'checkmark-done-circle',
        t('card_status_completed'),
        colors.success,
        '#DCFCE7',
        userHasReviewed
          ? undefined
          : {
              label: t('rate_worker'),
              iconName: 'star' as const,
              onPress: () => {
                navigation.navigate('RateWorker', {
                  id: Number(card_data?.application_id || card_data?.id || targetAppId),
                  workerName: String(card_data?.worker_name || otherUserName || 'Worker'),
                  jobTitle: String(card_data?.job_title || jobTitle || 'Job'),
                  jobId: Number(card_data?.job_id || jobId),
                });
              },
            },
      );
    }

    if (currentUserRole === 'worker') {
      if (card_data?.is_flagged) {
        return renderEtchedCard(
          t('work_flagged_done_title'),
          t('work_flagged_waiting_subtitle'),
          'time-outline',
          t('card_status_pending_confirmation'),
          colors.warning,
          '#FEF3C7',
        );
      }

      // If card was resolved before completion, do not render old action card
      if (card_resolved) {
        return null;
      }

      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="flag-outline" size={20} color={colors.warning} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.title}>{t('finish_work_title')}</Text>
              <Text style={styles.subtitle}>{t('finish_work_subtitle')}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.warning }]}
            onPress={() => {
              showAlert(t('flag_completed_alert_title'), t('flag_completed_alert_msg'), [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                  text: t('flag_completed_confirm_btn'),
                  onPress: () => {
                    const appId = targetAppId;
                    triggerHaptic('success');
                    applyOptimisticCardUpdate({
                      cardDataPatch: { is_flagged: true },
                    });
                    flagOfflineMutation.mutate(appId, {
                      onSuccess: () => {
                        onActionComplete();
                      },
                      onError: (err: any) => {
                        setOptimisticState(null);
                        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                        showAlert(t('action_failed'), err.message || t('flag_completed_error'));
                      },
                    });
                  },
                },
              ]);
            }}
            disabled={flagOfflineMutation.isPending || !!loadingAction}
          >
            {flagOfflineMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>{t('flag_completed_btn')}</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    // Employer side:
    if (!card_data?.is_flagged || card_resolved) {
      return null;
    }

    const workerName = String(card_data?.worker_name || otherUserName || 'Worker');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="flag-outline" size={20} color={colors.warning} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>{t('work_flagged_done_title')}</Text>
            <Text style={styles.subtitle}>
              {t('work_flagged_confirm_subtitle', { workerName })}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.success }]}
          onPress={() => {
            showAlert(t('confirm_work_done_title'), t('confirm_work_done_prompt', { workerName }), [
              { text: t('cancel') || 'Cancel', style: 'cancel' },
              {
                text: t('confirm') || 'Confirm',
                onPress: () => {
                  const targetJobId = Number(card_data?.job_id || jobId);
                  const completePayload = targetAppId
                    ? { jobId: targetJobId, applicationId: targetAppId }
                    : targetJobId;
                  triggerHaptic('success');
                  applyOptimisticCardUpdate({
                    cardResolved: true,
                    applicationStatus: 'completed',
                  });
                  markJobCompleteMutation.mutate(completePayload, {
                    onSuccess: () => {
                      showAlert(t('job_completed_title'), t('job_completed_review_msg'));
                      onActionComplete();
                    },
                    onError: (err: any) => {
                      setOptimisticState(null);
                      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
                      showAlert(t('action_failed'), err.message || t('mark_job_complete_error'));
                    },
                  });
                },
              },
            ]);
          }}
          disabled={markJobCompleteMutation.isPending || !!loadingAction}
        >
          {markJobCompleteMutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>{t('confirm_work_done_title')}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // 9. UNLOCK REQUEST (Worker requests reopen, Employer approves or declines)
  if (card_type === 'unlock_request') {
    const workerName = String(card_data?.worker_name || otherUserName || 'Worker');

    if (effectiveConversationStatus === 'open' || (card_resolved && !card_data?.declined)) {
      return renderEtchedCard(
        'Chat Reopened',
        currentUserRole === 'employer'
          ? 'You reopened this conversation.'
          : 'Employer approved reopening this chat.',
        'lock-open',
        'Reopened',
        colors.success,
        '#DCFCE7',
      );
    }

    if (card_data?.declined) {
      return renderEtchedCard(
        'Reopen Request Declined',
        currentUserRole === 'employer'
          ? 'You declined to reopen this conversation.'
          : 'Employer declined to reopen this conversation.',
        'close-circle-outline',
        'Closed',
        colors.inkMuted,
        colors.paper,
      );
    }

    // Pending employer decision
    if (currentUserRole === 'employer') {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBadge, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="lock-open-outline" size={20} color="#1D4ED8" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.title}>Reopen Chat Request</Text>
              <Text style={styles.subtitle}>
                {workerName} has requested to reopen this conversation.
              </Text>
            </View>
          </View>
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                showAlert(
                  'Unlock Conversation',
                  `Are you sure you want to reopen this chat with ${workerName}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Unlock',
                      onPress: () => {
                        handleAction(
                          'unlock',
                          () => messagesApi.unlockConversation(conversationId),
                          [
                            ['conversations'],
                            ['conversation', conversationId],
                            ['messages', conversationId],
                          ],
                          {
                            cardResolved: true,
                            conversationStatus: 'open',
                            cardDataPatch: { declined: false },
                          },
                        );
                      },
                    },
                  ],
                );
              }}
              disabled={!!loadingAction}
            >
              {loadingAction === 'unlock' ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.actionBtnText}>Unlock Chat</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderWidth: 1,
                  borderColor: colors.error,
                },
              ]}
              onPress={() => {
                showAlert(
                  'Decline Request',
                  'Are you sure you want to keep this conversation closed?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Keep Closed',
                      style: 'destructive',
                      onPress: () => {
                        handleAction(
                          'decline-unlock',
                          () => messagesApi.declineUnlock(conversationId),
                          [
                            ['conversations'],
                            ['conversation', conversationId],
                            ['messages', conversationId],
                          ],
                          {
                            cardResolved: true,
                            cardDataPatch: { declined: true },
                          },
                        );
                      },
                    },
                  ],
                );
              }}
              disabled={!!loadingAction}
            >
              {loadingAction === 'decline-unlock' ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <Text style={[styles.actionBtnText, { color: colors.error }]}>Keep Closed</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Pending for worker
    return renderEtchedCard(
      'Reopen Request Sent',
      'Waiting for employer approval to reopen this conversation.',
      'time-outline',
      t('card_status_pending'),
      colors.warning,
      '#FEF3C7',
    );
  }

  // Fallback for general resolved card if any other card_type
  if (card_resolved) {
    return renderEtchedCard('Action Completed', 'Done', 'checkmark-circle');
  }

  return null;
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  outlineButtonError: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  outlineButtonErrorText: {
    color: colors.error,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  priceHighlight: {
    fontFamily: fonts.bodyBold,
    color: colors.primaryDark,
    fontSize: 15,
  },
  // Subtle etched completed card
  etchedCardContainer: {
    marginVertical: 4,
  },
  etchedCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  etchedCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ratingCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 6,
    marginHorizontal: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingCtaBtnText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  etchedIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  etchedContent: {
    flex: 1,
    minWidth: 0,
  },
  etchedTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 19,
    flexShrink: 1,
  },
  etchedSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 17,
    marginTop: 3,
    flexShrink: 1,
  },
  etchedBadgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  etchedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  etchedBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  // Frosted waiting pill
  frostedWaitingPill: {
    marginHorizontal: 20,
    marginVertical: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  frostedWaitingText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(248, 250, 252, 0.90)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.80)',
  },
  phoneText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  headerTag: {
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  requestBanner: {
    backgroundColor: 'rgba(255, 127, 80, 0.08)',
    borderColor: 'rgba(255, 127, 80, 0.22)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  requestBannerText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 21,
  },
  requestBannerBold: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  guideBox: {
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  guideBoxMinimized: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.70)',
  },
  guideHeaderMinimized: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  guideHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guideTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guideCountBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
  },
  guideCountText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.primaryDark,
  },
  guideToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guideToggleText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkMuted,
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 4,
  },
  stepNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#1D4ED8',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
  },
  stepDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    lineHeight: 16,
    marginTop: 1,
  },
  chatReadyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 127, 80, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  chatReadyText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.primary,
  },
  togglePriceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 127, 80, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 127, 80, 0.30)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  togglePriceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  togglePriceBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
  priceSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.85)',
  },
  priceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceSectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  priceActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  cancelPriceBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPriceBtnText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  slotFullBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.10)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  slotFullBannerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkMuted,
    flex: 1,
  },
  priceHelperText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 4,
    lineHeight: 16,
  },
  priceTag: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkMuted,
  },
  offerTotalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  offerTotalNoticeText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
  doleWageBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  doleWageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  doleWageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  doleWageBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#065F46',
  },
  doleWageSubtext: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkMuted,
  },
  doleWageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  doleWageCol: {
    flex: 1,
  },
  doleWageColBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 12,
  },
  doleWageLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  doleWageValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#0F172A',
  },
  doleWagePostedValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
  doleWageEq: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkMuted,
    marginTop: 1,
  },
  doleWageHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 8,
    lineHeight: 15,
  },
  dolePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  doleQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  doleQuickPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.primary,
  },
  doleInputWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  doleInputWarningText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },
  doleInputSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  doleInputSuccessText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 15,
  },
  doleOfferBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  doleOfferBadgeSuccessText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: '#065F46',
  },
  doleOfferBadgeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  doleOfferBadgeNoticeText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },
});

export default ActionCard;
