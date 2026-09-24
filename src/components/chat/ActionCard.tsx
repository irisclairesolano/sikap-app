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
import { apiClient } from '../../api/client';
import { applicationsApi } from '../../api/applications';
import { jobsApi } from '../../api/jobs';
import { useQueryClient } from '@tanstack/react-query';
import { useAlert } from '../../contexts/AlertContext';

interface ActionCardProps {
  message: Message;
  currentUserId: number;
  currentUserRole: 'worker' | 'employer';
  conversationId: number;
  conversationStatus?: 'open' | 'locked' | 'unlock_requested';
  applicationStatus?: string;
  otherUserName?: string;
  jobTitle?: string;
  jobId?: number;
  hasRealMessageFromEmployer?: boolean;
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
  otherUserName,
  jobTitle,
  jobId,
  hasRealMessageFromEmployer = true,
  onActionComplete,
}) => {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [isPriceInputVisible, setIsPriceInputVisible] = useState(false);

  if (message.message_type !== 'action_card' || !message.card_type) return null;

  const { card_type, card_data, card_resolved } = message;

  const handleAction = async (
    actionId: string,
    apiCall: () => Promise<any>,
    invalidateKeys?: unknown[][],
  ) => {
    setLoadingAction(actionId);
    try {
      await apiCall();
      if (invalidateKeys) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      onActionComplete();
    } catch (error: any) {
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
  ) => (
    <View style={styles.etchedCard}>
      <View style={[styles.etchedIconBadge, { backgroundColor: badgeBg }]}>
        <Ionicons name={icon} size={15} color={badgeColor} />
      </View>
      <View style={styles.etchedContent}>
        <Text style={styles.etchedTitle}>{title}</Text>
        {subtitle ? <Text style={styles.etchedSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.etchedBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.etchedBadgeText, { color: badgeColor }]}>{badgeText}</Text>
      </View>
    </View>
  );

  // 1. UNLOCK REQUEST
  if (card_type === 'unlock_request') {
    const isUnlockResolved = card_resolved || conversationStatus === 'open';

    if (isUnlockResolved) {
      return renderEtchedCard(
        'Conversation Unlocked',
        'Chat has been reopened.',
        'lock-open-outline',
        'Unlocked',
        colors.primary,
        colors.peach,
      );
    }

    if (currentUserRole === 'worker') {
      return (
        <View style={styles.frostedWaitingPill}>
          <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
          <Text style={styles.frostedWaitingText}>
            Reopen request sent — Waiting for employer approval...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: colors.peach }]}>
            <Ionicons name="lock-open-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>Chat Reopen Request</Text>
            <Text style={styles.subtitle}>
              {String(card_data?.worker_name ?? 'Worker')} wants to reopen this conversation.
            </Text>
          </View>
        </View>
        <View style={styles.rowButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() =>
              handleAction(
                'unlock',
                () => apiClient(`/conversations/${conversationId}/unlock`, { method: 'PATCH' }),
                [['conversations'], ['messages', conversationId]],
              )
            }
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
              { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.inkFaint },
            ]}
            onPress={() => onActionComplete()}
          >
            <Text style={[styles.actionBtnText, { color: colors.ink }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2. JOB REQUEST & CONFIRM HIRE
  if (card_type === 'job_request' || card_type === 'confirm_hire') {
    const isConfirmResolved =
      card_resolved ||
      ['employer_confirmed', 'accepted', 'completed'].includes(applicationStatus || '');

    if (isConfirmResolved) {
      const displayPrice = card_data?.price || card_data?.final_agreed_price;
      return renderEtchedCard(
        'Hire Confirmed by Employer',
        displayPrice ? `Agreed Price: ${formatCurrency(displayPrice)}` : 'Agreed price confirmed.',
        'cash-outline',
        'Confirmed',
        colors.primary,
        colors.peach,
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
          <View style={[styles.cardIconBadge, { backgroundColor: colors.peach }]}>
            <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>Job Request</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {displayJobTitle}
            </Text>
          </View>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>Stage 2</Text>
          </View>
        </View>

        {/* Primary Request Announcement */}
        <View style={styles.requestBanner}>
          <Text style={styles.requestBannerText}>
            {currentUserRole === 'worker' ? (
              <>
                <Text style={styles.requestBannerBold}>{employerName}</Text>
                {" sent you a job request for the '"}
                <Text style={styles.requestBannerBold}>{displayJobTitle}</Text>
                {"' you applied for."}
              </>
            ) : (
              <>
                {'You sent a job request to '}
                <Text style={styles.requestBannerBold}>{workerName}</Text>
                {" for the '"}
                <Text style={styles.requestBannerBold}>{displayJobTitle}</Text>
                {"' they applied for."}
              </>
            )}
          </Text>
        </View>

        {/* Next Steps Guidance */}
        <View style={styles.guideBox}>
          <View style={styles.guideHeader}>
            <Ionicons name="compass-outline" size={15} color={colors.primary} />
            <Text style={styles.guideTitle}>Next Steps</Text>
          </View>

          {currentUserRole === 'worker' ? (
            <>
              <View style={styles.guideStepRow}>
                <View style={styles.stepNumBadge}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Discuss Details in Chat</Text>
                  <Text style={styles.stepDesc}>
                    The employer will send the first message. Discuss schedule, tasks, and negotiate
                    your agreed rate.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepRow}>
                <View style={styles.stepNumBadge}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Wait for Final Offer</Text>
                  <Text style={styles.stepDesc}>
                    Once you both agree on terms, {employerName} will set the final price and submit
                    the official hire offer.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepRow}>
                <View style={styles.stepNumBadge}>
                  <Text style={styles.stepNumText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Review & Accept</Text>
                  <Text style={styles.stepDesc}>
                    Review the offer card that appears in this chat and accept to officially start
                    the job.
                  </Text>
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
                  <Text style={styles.stepTitle}>Message the Worker</Text>
                  <Text style={styles.stepDesc}>
                    Send a message below to discuss availability, tasks, and negotiate the rate with{' '}
                    {workerName}.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepRow}>
                <View style={styles.stepNumBadge}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Agree on Final Price</Text>
                  <Text style={styles.stepDesc}>
                    Agree on the work scope and compensation terms before confirming the hire.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepRow}>
                <View style={styles.stepNumBadge}>
                  <Text style={styles.stepNumText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Set Price & Confirm</Text>
                  <Text style={styles.stepDesc}>
                    When you both agree, set the final price below. {workerName} will then accept to
                    officially start.
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Worker Footer Notice */}
        {currentUserRole === 'worker' && (
          <View style={styles.chatReadyPill}>
            <Ionicons name="chatbubbles-outline" size={14} color={colors.primary} />
            <Text style={styles.chatReadyText}>
              Chat is open · Feel free to discuss terms with the employer
            </Text>
          </View>
        )}

        {/* Employer Set Final Price Action */}
        {currentUserRole === 'employer' && (
          <>
            {!hasRealMessageFromEmployer ? (
              <View style={styles.chatReadyPill}>
                <Ionicons name="chatbubbles-outline" size={14} color={colors.inkMuted} />
                <Text style={[styles.chatReadyText, { color: colors.inkMuted }]}>
                  Send a message to the worker before setting a final price.
                </Text>
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
                  <Text style={styles.togglePriceBtnText}>Set Final Price & Confirm Hire</Text>
                </View>
                <Ionicons name="chevron-down" size={17} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.priceSection}>
                <View style={styles.priceSectionHeader}>
                  <Text style={styles.priceSectionTitle}>Set Final Agreed Price</Text>
                  <TouchableOpacity
                    onPress={() => setIsPriceInputVisible(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter agreed price (₱)"
                  placeholderTextColor={colors.inkLight}
                  keyboardType="numeric"
                  value={priceInput}
                  onChangeText={setPriceInput}
                  autoFocus
                />
                <View style={styles.priceActionsRow}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1, marginTop: 0 }]}
                    onPress={() => {
                      const price = parseFloat(priceInput);
                      if (isNaN(price) || price <= 0) {
                        showAlert('Invalid Price', 'Please enter a valid price in Pesos.');
                        return;
                      }
                      handleAction(
                        'confirm',
                        () => applicationsApi.confirmHire(Number(card_data?.application_id), price),
                        [
                          ['application', Number(card_data?.application_id)],
                          ['applications'],
                          ['conversations'],
                          ['job'],
                          ['jobs'],
                          ['myJobs'],
                          ['jobApplications'],
                          ['my-applications'],
                        ],
                      );
                    }}
                    disabled={!!loadingAction}
                  >
                    {loadingAction === 'confirm' ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Confirm Hire</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelPriceBtn}
                    onPress={() => setIsPriceInputVisible(false)}
                    disabled={!!loadingAction}
                  >
                    <Text style={styles.cancelPriceBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  }

  // 3. ACCEPT OR REJECT
  if (card_type === 'accept_or_reject') {
    const isOfferResolved =
      card_resolved ||
      ['accepted', 'completed', 'rejected', 'cancelled'].includes(applicationStatus || '');

    if (isOfferResolved) {
      if (applicationStatus === 'rejected' || applicationStatus === 'cancelled') {
        return renderEtchedCard(
          'Job Offer Declined',
          `Offer of ${formatCurrency(card_data?.price)} was declined.`,
          'close-circle-outline',
          'Declined',
          colors.error,
          '#FEE2E2',
        );
      }
      return renderEtchedCard(
        'Job Offer Accepted',
        `Agreed Price: ${formatCurrency(card_data?.price)}`,
        'checkmark-done-circle-outline',
        'Accepted',
        colors.success,
        '#DCFCE7',
      );
    }

    if (currentUserRole === 'employer') {
      return (
        <View style={styles.frostedWaitingPill}>
          <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
          <Text style={styles.frostedWaitingText}>
            Offer of {formatCurrency(card_data?.price)} sent — Waiting for worker response...
          </Text>
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
            <Text style={styles.title}>Job Offer Received</Text>
            <Text style={styles.subtitle}>
              Agreed price:{' '}
              <Text style={styles.priceHighlight}>{formatCurrency(card_data?.price)}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.rowButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
            onPress={() =>
              handleAction(
                'accept',
                () =>
                  apiClient(`/applications/${String(card_data?.application_id)}/accept`, {
                    method: 'PATCH',
                  }),
                [
                  ['application', Number(card_data?.application_id)],
                  ['applications'],
                  ['conversations'],
                  ['job'],
                  ['jobs'],
                  ['myJobs'],
                  ['jobApplications'],
                  ['my-applications'],
                ],
              )
            }
            disabled={!!loadingAction}
          >
            {loadingAction === 'accept' ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionBtnText}>Accept Offer</Text>
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
                  onPress: () =>
                    handleAction(
                      'reject',
                      () =>
                        apiClient(`/applications/${String(card_data?.application_id)}/reject`, {
                          method: 'PATCH',
                        }),
                      [
                        ['application', Number(card_data?.application_id)],
                        ['applications'],
                        ['conversations'],
                        ['job'],
                        ['jobs'],
                        ['myJobs'],
                        ['jobApplications'],
                        ['my-applications'],
                      ],
                    ),
                },
              ]);
            }}
            disabled={!!loadingAction}
          >
            {loadingAction === 'reject' ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionBtnText}>Decline</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 4. CANCEL HIRE
  if (card_type === 'cancel_hire') {
    if (currentUserRole === 'worker') return null;

    if (card_resolved || applicationStatus === 'cancelled') {
      return renderEtchedCard(
        'Hiring Cancelled',
        'This hiring was cancelled.',
        'close-circle-outline',
        'Cancelled',
        colors.error,
        '#FEE2E2',
      );
    }

    if (['accepted', 'completed'].includes(applicationStatus || '')) {
      return null;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="close-circle-outline" size={20} color={colors.error} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>Cancel Hire</Text>
            <Text style={styles.subtitle}>You can cancel this hire before the worker accepts.</Text>
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
                      apiClient(`/applications/${String(card_data?.application_id)}/cancel-hire`, {
                        method: 'PATCH',
                      }),
                    [
                      ['application', Number(card_data?.application_id)],
                      ['applications'],
                      ['conversations'],
                      ['job'],
                      ['jobs'],
                      ['myJobs'],
                      ['jobApplications'],
                      ['my-applications'],
                    ],
                  ),
              },
            ]);
          }}
          disabled={!!loadingAction}
        >
          {loadingAction === 'cancel' ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={styles.outlineButtonErrorText}>Cancel Hire</Text>
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
            <Text style={styles.title}>Employer Contact</Text>
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
            <Text style={styles.title}>Worker Contact</Text>
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

  // 7. MARK COMPLETE
  if (card_type === 'mark_complete') {
    if (currentUserRole === 'worker') return null;

    const isCompleteResolved =
      card_resolved || applicationStatus === 'completed' || conversationStatus === 'locked';

    if (isCompleteResolved) {
      return renderEtchedCard(
        'Job Marked Complete',
        'Work has been completed and verified.',
        'checkmark-done-circle',
        'Completed',
        colors.success,
        '#DCFCE7',
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>Mark Job as Complete</Text>
            <Text style={styles.subtitle}>Tap when the work has been fully finished.</Text>
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
                  handleAction('complete', () => jobsApi.markJobComplete(targetJobId), [
                    ['application', Number(card_data?.application_id)],
                    ['applications'],
                    ['conversations'],
                    ['job', targetJobId],
                    ['jobs'],
                    ['myJobs'],
                    ['jobApplications'],
                    ['my-applications'],
                  ]);
                },
              },
            ]);
          }}
          disabled={!!loadingAction}
        >
          {loadingAction === 'complete' ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Mark Complete</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // 8. FLAG OFFLINE
  if (card_type === 'flag_offline') {
    if (currentUserRole === 'employer') return null;

    if (card_resolved || applicationStatus === 'completed') {
      return null;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBadge, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="flag-outline" size={20} color={colors.warning} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>Flag as Done / Offline</Text>
            <Text style={styles.subtitle}>
              Use this if the job is done but the employer hasn't confirmed yet.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.warning }]}
          onPress={() => {
            showAlert('Flag Complete', 'Are you sure you want to flag this job as complete?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes, Flag as Done',
                onPress: () =>
                  handleAction(
                    'flag',
                    () =>
                      apiClient(`/jobs/${String(card_data?.job_id)}/flag-offline`, {
                        method: 'POST',
                      }),
                    [
                      ['application', Number(card_data?.application_id)],
                      ['applications'],
                      ['conversations'],
                      ['job'],
                      ['jobs'],
                      ['myJobs'],
                      ['jobApplications'],
                      ['my-applications'],
                    ],
                  ),
              },
            ]);
          }}
          disabled={!!loadingAction}
        >
          {loadingAction === 'flag' ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Flag as Done</Text>
          )}
        </TouchableOpacity>
      </View>
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
  etchedCard: {
    marginHorizontal: 16,
    marginVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.75)',
    gap: 10,
  },
  etchedIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etchedContent: {
    flex: 1,
  },
  etchedTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  etchedSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 1,
  },
  etchedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
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
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.70)',
  },
  guideTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primary,
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
});

export default ActionCard;
