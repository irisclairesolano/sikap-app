import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { Application } from '../../types';

export interface ApplicationCardProps {
  application: Application;
  onPress: () => void;
  onReviewOffer?: (application: Application) => void;
  onRateEmployer?: (application: Application) => void;
}

export const getCategoryStyles = (category?: string) => {
  switch (category) {
    case 'Construction':
      return { icon: 'hammer', bg: colors.peach, color: colors.primary };
    case 'Domestic':
      return { icon: 'home', bg: colors.mint, color: colors.mintDeep };
    case 'Agriculture':
      return { icon: 'leaf', bg: colors.butter, color: colors.warning };
    case 'Skilled Trade':
      return { icon: 'construct', bg: colors.sky, color: colors.skyDeep };
    default:
      return { icon: 'briefcase', bg: colors.primaryTint, color: colors.primary };
  }
};

export const getApplicationStageInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        stage: 1,
        badgeLabel: 'Under Review',
        badgeIcon: 'hourglass-outline' as const,
        badgeBg: '#FEF3C7',
        badgeColor: '#D97706',
        stepLabel: 'Step 1 of 5: Under Review',
        nextStep: 'Waiting for the employer to review your application.',
        isUrgent: false,
      };
    case 'shortlisted':
    case 'pending_negotiation':
    case 'employer_requested':
      return {
        stage: 2,
        badgeLabel: 'Shortlisted',
        badgeIcon: 'chatbubble-ellipses-outline' as const,
        badgeBg: '#F3E8FF',
        badgeColor: '#7E22CE',
        stepLabel: 'Step 2 of 5: Discussion & Chat',
        nextStep: 'Employer shortlisted you! Tap to chat and discuss job details.',
        isUrgent: false,
      };
    case 'employer_confirmed':
      return {
        stage: 3,
        badgeLabel: 'Offer Received',
        badgeIcon: 'flash-outline' as const,
        badgeBg: '#FFE4E6',
        badgeColor: '#E11D48',
        stepLabel: 'Step 3 of 5: Formal Offer Ready',
        nextStep: 'Action required: Employer sent you a price offer! Tap to review and accept.',
        isUrgent: true,
      };
    case 'accepted':
    case 'hired':
      return {
        stage: 4,
        badgeLabel: 'Hired · Active',
        badgeIcon: 'checkmark-circle' as const,
        badgeBg: '#DCFCE7',
        badgeColor: '#15803D',
        stepLabel: 'Step 4 of 5: Job in Progress',
        nextStep: 'You are hired! Proceed to the job location on the agreed schedule.',
        isUrgent: false,
      };
    case 'completed':
      return {
        stage: 5,
        badgeLabel: 'Completed',
        badgeIcon: 'ribbon-outline' as const,
        badgeBg: '#E0F2FE',
        badgeColor: '#0369A1',
        stepLabel: 'Step 5 of 5: Job Finished',
        nextStep: 'Job complete! Please rate your employer to help the community.',
        isUrgent: true,
      };
    case 'withdrawn':
      return {
        stage: 0,
        badgeLabel: 'Withdrawn',
        badgeIcon: 'arrow-undo-outline' as const,
        badgeBg: '#FFEDD5',
        badgeColor: '#EA580C',
        stepLabel: 'Application Withdrawn',
        nextStep: 'You withdrew this application.',
        isUrgent: false,
      };
    case 'rejected':
      return {
        stage: 0,
        badgeLabel: 'Closed',
        badgeIcon: 'close-circle-outline' as const,
        badgeBg: '#F1F5F9',
        badgeColor: '#64748B',
        stepLabel: 'Position Filled',
        nextStep: 'This position was filled or is no longer available.',
        isUrgent: false,
      };
    default:
      return {
        stage: 1,
        badgeLabel: 'Submitted',
        badgeIcon: 'document-text-outline' as const,
        badgeBg: '#FEF3C7',
        badgeColor: '#D97706',
        stepLabel: 'Step 1 of 5: Submitted',
        nextStep: 'Application submitted to employer.',
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

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onPress,
  onReviewOffer,
  onRateEmployer,
}) => {
  const { job, status } = application;
  const stageInfo = getApplicationStageInfo(status);
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
    : job?.compensation_type
      ? `/${job.compensation_type.replace('_', ' ')}`
      : '/day';

  // Location display
  const locationText = job?.barangay
    ? `${job.barangay}, ${job.municipality || 'Bulan'}`
    : job?.municipality || 'Bulan';

  const timeText = formatRelativeTime(application.applied_at || application.created_at);

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
                color="#22C55E"
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

      {/* Glanceable Info Chips (Pay, Location, Time) */}
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

        {timeText ? (
          <View style={styles.metaChip}>
            <Ionicons
              name="time-outline"
              size={12}
              color={colors.inkMuted}
              style={{ marginRight: 3 }}
            />
            <Text style={styles.metaChipText}>{timeText}</Text>
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

              let fillColor = colors.inkFaint;
              if (isPassedOrCurrent) {
                if (stageInfo.stage === 3)
                  fillColor = '#E11D48'; // Urgent Offer
                else if (stageInfo.stage === 4)
                  fillColor = '#15803D'; // Active Hire
                else if (stageInfo.stage === 5)
                  fillColor = '#0369A1'; // Completed
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
            <Text style={styles.quickActionBtnUrgentText}>Review Offer</Text>
          </TouchableOpacity>
        )}

        {stageInfo.stage === 5 && (
          <TouchableOpacity
            style={styles.quickActionBtnPrimary}
            onPress={() => (onRateEmployer ? onRateEmployer(application) : onPress())}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionBtnPrimaryText}>Rate Employer</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardUrgent: {
    borderColor: '#F43F5E',
    borderWidth: 1.5,
    backgroundColor: '#FFFBFB',
  },
  cardActive: {
    borderColor: '#22C55E',
    borderWidth: 1.5,
    backgroundColor: '#FBFCFB',
  },
  cardWithdrawn: {
    borderColor: colors.inkFaint,
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
    backgroundColor: '#FFF1F2',
    borderLeftWidth: 3,
    borderLeftColor: '#E11D48',
  },
  nextStepBoxActive: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#15803D',
  },
  nextStepBoxDone: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0369A1',
  },
  nextStepText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 16,
  },
  nextStepTextUrgent: {
    color: '#9F1239',
    fontFamily: fonts.bodyBold,
  },
  nextStepTextActive: {
    color: '#166534',
  },
  nextStepTextDone: {
    color: '#075985',
  },
  quickActionBtnUrgent: {
    backgroundColor: '#E11D48',
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
});
