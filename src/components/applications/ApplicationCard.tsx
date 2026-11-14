import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, getCategoryBadgeStyle } from '../../theme';
import { Application } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export interface ApplicationCardProps {
  application: Application;
  onPress: () => void;
  onReviewOffer?: (application: Application) => void;
  onRateEmployer?: (application: Application) => void;
}

export const getCategoryStyles = (category?: string) => getCategoryBadgeStyle(category);

export const getApplicationStageInfo = (
  status: string,
  hasReviewed?: boolean,
  t?: (key: any) => string,
) => {
  switch (status) {
    case 'pending':
      return {
        stage: 1,
        badgeLabel: t ? t('status_under_review') : 'Under Review',
        badgeIcon: 'hourglass-outline' as const,
        badgeBg: '#FEF3C7',
        badgeColor: '#92400E',
        stepLabel: t ? t('my_apps_stage_applied') : 'Step 1 of 5: Under Review',
        nextStep: t
          ? t('my_apps_next_waiting_review')
          : 'Waiting for the employer to review your application.',
        isUrgent: false,
      };
    case 'shortlisted':
    case 'pending_negotiation':
    case 'employer_requested':
      return {
        stage: 2,
        badgeLabel: t ? t('status_shortlisted') : 'Shortlisted',
        badgeIcon: 'chatbubble-ellipses-outline' as const,
        badgeBg: '#CCFBF1',
        badgeColor: '#0F766E',
        stepLabel: t ? t('my_apps_stage_shortlisted') : 'Step 2 of 5: Discussion & Chat',
        nextStep: t
          ? t('my_apps_next_under_consideration')
          : 'Employer shortlisted you! Tap to chat and discuss job details.',
        isUrgent: false,
      };
    case 'employer_confirmed':
      return {
        stage: 3,
        badgeLabel: t ? t('status_job_offer') : 'Offer Received',
        badgeIcon: 'document-text-outline' as const,
        badgeBg: '#DBEAFE',
        badgeColor: '#1D4ED8',
        stepLabel: t ? t('my_apps_stage_Offer_Received') : 'Step 3 of 5: Formal Offer Ready',
        nextStep: t
          ? t('my_apps_next_accept_or_decline')
          : 'Action required: Employer sent you a price offer! Tap to review and accept.',
        isUrgent: true,
      };
    case 'accepted':
    case 'hired':
      return {
        stage: 4,
        badgeLabel: t ? t('status_hired') : 'Hired · Active',
        badgeIcon: 'checkmark-circle' as const,
        badgeBg: '#DCFCE7',
        badgeColor: '#166534',
        stepLabel: t ? t('my_apps_stage_hired') : 'Step 4 of 5: Job in Progress',
        nextStep: t
          ? t('my_apps_next_job_in_progress')
          : 'You are hired! Proceed to the job location on the agreed schedule.',
        isUrgent: false,
      };
    case 'completed':
      return {
        stage: 5,
        badgeLabel: t
          ? hasReviewed
            ? `${t('status_completed')} · Rated`
            : t('status_completed')
          : hasReviewed
            ? 'Done · Rated'
            : 'Done',
        badgeIcon: hasReviewed ? ('checkmark-circle' as const) : ('ribbon-outline' as const),
        badgeBg: hasReviewed ? '#DCFCE7' : '#DBEAFE',
        badgeColor: hasReviewed ? '#166534' : '#1D4ED8',
        stepLabel: t
          ? t('my_apps_stage_completed')
          : hasReviewed
            ? 'Step 5 of 5: Done & Rated'
            : 'Step 5 of 5: Done',
        nextStep: hasReviewed
          ? t
            ? t('my_apps_stage_completed')
            : 'Job finished and rated. Thank you for your feedback!'
          : t
            ? t('my_apps_next_leave_review')
            : 'Job done! Please rate your employer to help the community.',
        isUrgent: !hasReviewed,
      };
    case 'withdrawn':
      return {
        stage: 0,
        badgeLabel: t ? t('status_withdrawn') : 'Withdrawn',
        badgeIcon: 'arrow-undo-outline' as const,
        badgeBg: '#FFEDD5',
        badgeColor: '#9A3412',
        stepLabel: t ? t('my_apps_stage_withdrawn') : 'Application Withdrawn',
        nextStep: t ? t('my_apps_next_withdrawn') : 'You withdrew this application.',
        isUrgent: false,
      };
    case 'rejected':
      return {
        stage: 0,
        badgeLabel: t ? t('status_declined') : 'Closed',
        badgeIcon: 'close-circle-outline' as const,
        badgeBg: '#F1F5F9',
        badgeColor: '#475569',
        stepLabel: t ? t('my_apps_stage_not_selected') : 'Position Filled',
        nextStep: t
          ? t('my_apps_next_reviewed_all')
          : 'This position was filled or is no longer available.',
        isUrgent: false,
      };
    default:
      return {
        stage: 1,
        badgeLabel: t ? t('status_under_review') : 'Submitted',
        badgeIcon: 'document-text-outline' as const,
        badgeBg: '#FEF3C7',
        badgeColor: '#92400E',
        stepLabel: t ? t('my_apps_stage_applied') : 'Step 1 of 5: Submitted',
        nextStep: t ? t('my_apps_next_waiting_review') : 'Application submitted to employer.',
        isUrgent: false,
      };
  }
};

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const formatAppliedDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onPress,
  onReviewOffer,
  onRateEmployer,
}) => {
  const { t } = useLanguage();
  const { job, status } = application;
  const stageInfo = getApplicationStageInfo(status, application.has_reviewed, t);
  const catStyles = getCategoryStyles(job?.categories?.[0] || job?.category || 'Other');

  // Compensation display
  const hasAgreedPrice =
    application.final_agreed_price != null && Number(application.final_agreed_price) > 0;
  const displayPrice = hasAgreedPrice
    ? `₱${Number(application.final_agreed_price).toLocaleString()}`
    : job?.compensation
      ? `₱${Number(job.compensation).toLocaleString()}`
      : null;

  const priceType = hasAgreedPrice
    ? 'Agreed'
    : job?.duration_unit
      ? `/${job.duration_unit}`
      : '/day';

  // Location display
  const locationText = job?.barangay
    ? `${job.barangay}, ${job.municipality || 'Bulan'}`
    : job?.municipality || 'Bulan';

  const appliedDateRaw = application.applied_at || application.created_at;
  const appliedRelative = formatRelativeTime(appliedDateRaw);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        stageInfo.isUrgent && styles.cardUrgent,
        status === 'accepted' && styles.cardActive,
        status === 'withdrawn' && styles.cardWithdrawn,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={[styles.catIconBox, { backgroundColor: catStyles.bg }]}>
          <Ionicons name={catStyles.icon as any} size={22} color={catStyles.color} />
        </View>

        <View style={styles.titleCol}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {job?.title || 'Job Post Unavailable'}
          </Text>
          <View style={styles.employerRow}>
            <Text style={styles.employerName} numberOfLines={1}>
              {job?.employer?.name || 'Employer'}
            </Text>
            {job?.employer?.verification_badge && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.success}
                style={{ marginLeft: 3 }}
              />
            )}
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: stageInfo.badgeBg }]}>
          <Ionicons
            name={stageInfo.badgeIcon}
            size={11}
            color={stageInfo.badgeColor}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.badgeText, { color: stageInfo.badgeColor }]}>
            {stageInfo.badgeLabel}
          </Text>
        </View>
      </View>

      {/* Glanceable Info Chips (Pay, Location, Applied Time) */}
      <View style={styles.metaRow}>
        {displayPrice && (
          <View
            style={[styles.metaChip, hasAgreedPrice ? styles.metaChipAgreed : styles.metaChipWage]}
          >
            <Text style={[styles.metaWageText, hasAgreedPrice && styles.metaWageTextAgreed]}>
              {displayPrice}
            </Text>
            <Text style={[styles.metaWageSub, hasAgreedPrice && styles.metaWageSubAgreed]}>
              {priceType}
            </Text>
          </View>
        )}

        <View style={styles.metaChip}>
          <Ionicons
            name="location-outline"
            size={12}
            color={colors.inkMuted}
            style={{ marginRight: 3 }}
          />
          <Text style={styles.metaChipText} numberOfLines={1}>
            {locationText}
          </Text>
        </View>

        {appliedRelative ? (
          <View style={[styles.metaChip, styles.metaChipApplied]}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={colors.primarySoft}
              style={{ marginRight: 3 }}
            />
            <Text style={styles.metaChipAppliedText}>Applied {appliedRelative}</Text>
          </View>
        ) : null}
      </View>

      {/* 5-Stage Visual Stepper (Only for active pipeline stages) */}
      {stageInfo.stage > 0 && (
        <View style={styles.stepperContainer}>
          <View style={styles.stepperBarRow}>
            {[1, 2, 3, 4, 5].map((s) => {
              const isPassedOrCurrent = s <= stageInfo.stage;
              const isCurrent = s === stageInfo.stage;

              let fillColor: string = colors.inkFaint;
              if (isPassedOrCurrent) {
                if (stageInfo.stage === 3)
                  fillColor = '#1D4ED8'; // Formal Offer Ready
                else if (stageInfo.stage === 4)
                  fillColor = '#166534'; // Active Hire
                else if (stageInfo.stage === 5)
                  fillColor = application.has_reviewed ? '#166534' : '#1D4ED8'; // Completed / Rated
                else fillColor = colors.primary; // Step 1 & 2
              }

              return (
                <View
                  key={s}
                  style={[
                    styles.stepperSegment,
                    { backgroundColor: fillColor },
                    isCurrent && styles.stepperSegmentActive,
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.stepperLabelRow}>
            <Text style={[styles.stepperStageLabel, { color: stageInfo.badgeColor }]}>
              {stageInfo.stepLabel}
            </Text>
          </View>
        </View>
      )}

      {/* Next Step Micro-Banner & Actions */}
      <View
        style={[
          styles.nextStepBox,
          stageInfo.stage === 3 && styles.nextStepBoxUrgent,
          stageInfo.stage === 4 && styles.nextStepBoxActive,
          stageInfo.stage === 5 && styles.nextStepBoxDone,
        ]}
      >
        <Text
          style={[
            styles.nextStepText,
            stageInfo.stage === 3 && styles.nextStepTextUrgent,
            stageInfo.stage === 4 && styles.nextStepTextActive,
            stageInfo.stage === 5 && styles.nextStepTextDone,
          ]}
          numberOfLines={2}
        >
          {stageInfo.nextStep}
        </Text>

        {/* Quick action buttons (Strictly text-only, no icons!) */}
        {stageInfo.stage === 3 && (
          <TouchableOpacity
            style={styles.quickActionBtnUrgent}
            onPress={() => (onReviewOffer ? onReviewOffer(application) : onPress())}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionBtnUrgentText}>{t('review_offer')}</Text>
          </TouchableOpacity>
        )}

        {stageInfo.stage === 5 && !application.has_reviewed && (
          <TouchableOpacity
            style={styles.quickActionBtnPrimary}
            onPress={() => (onRateEmployer ? onRateEmployer(application) : onPress())}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionBtnPrimaryText}>{t('rate_review_partner')}</Text>
          </TouchableOpacity>
        )}

        {stageInfo.stage === 5 && application.has_reviewed && (
          <View style={styles.reviewedBadgeRow}>
            <Ionicons name="checkmark-circle" size={14} color="#15803D" />
            <Text style={styles.reviewedBadgeText}>
              Rated{' '}
              {application.user_review?.overall_rating
                ? `★ ${Number(application.user_review.overall_rating).toFixed(1)}`
                : 'Submitted'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.65)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUrgent: {
    borderColor: 'rgba(244, 63, 94, 0.35)',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 251, 251, 0.95)',
  },
  cardActive: {
    borderColor: 'rgba(34, 197, 94, 0.35)',
    borderWidth: 1,
    backgroundColor: 'rgba(251, 252, 251, 0.95)',
  },
  cardWithdrawn: {
    borderColor: 'rgba(226, 232, 240, 0.60)',
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleCol: {
    flex: 1,
  },
  jobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
    marginBottom: 2,
  },
  employerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employerName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaChipWage: {
    backgroundColor: colors.butterBright,
    borderColor: '#FDE047',
    borderWidth: 0.5,
  },
  metaChipAgreed: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 0.5,
  },
  metaWageText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
  },
  metaWageTextAgreed: {
    color: '#15803D',
  },
  metaWageSub: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkSoft,
    marginLeft: 3,
  },
  metaWageSubAgreed: {
    color: '#15803D',
    fontFamily: fonts.bodyBold,
  },
  metaChipText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
  },
  stepperContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  stepperBarRow: {
    flexDirection: 'row',
    gap: 4,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepperSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  stepperSegmentActive: {
    height: 5,
    top: -0.5,
  },
  stepperLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  stepperStageLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  nextStepBox: {
    backgroundColor: colors.paper,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  nextStepBoxUrgent: {
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 3,
    borderLeftColor: '#1D4ED8',
  },
  nextStepBoxActive: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#166534',
  },
  nextStepBoxDone: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#1D4ED8',
  },
  nextStepText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 16,
  },
  nextStepTextUrgent: {
    color: '#1E3A8A',
    fontFamily: fonts.bodyBold,
  },
  nextStepTextActive: {
    color: '#166534',
  },
  nextStepTextDone: {
    color: '#075985',
  },
  quickActionBtnUrgent: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  quickActionBtnUrgentText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.white,
  },
  quickActionBtnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  quickActionBtnPrimaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.white,
  },
  metaChipApplied: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  metaChipAppliedText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkSoft,
  },
  reviewedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 5,
    alignSelf: 'flex-start',
  },
  reviewedBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11.5,
    color: '#15803D',
  },
});
