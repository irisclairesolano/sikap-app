import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { JobPost } from '../../types';
import { useReactToJob } from '../../hooks/useReactToJob';
import { getShareLink } from '../../api/jobs';
import { ReportJobSheet } from './ReportJobSheet';
import { triggerHaptic } from '../../utils/haptics';

interface JobCardProps {
  job: JobPost;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export const getCategoryStyles = (category?: string) => {
  switch (category) {
    case 'Construction':
      return { icon: 'hammer', bg: colors.peach, color: colors.primary };
    case 'Domestic':
      return { icon: 'home', bg: colors.mint, color: colors.mintDeep };
    case 'Agriculture':
      return { icon: 'leaf', bg: colors.paperCream, color: colors.inkSoft };
    case 'Skilled Trade':
      return { icon: 'construct', bg: colors.sky, color: colors.skyDeep };
    default:
      return { icon: 'briefcase', bg: colors.paperCream, color: colors.inkSoft };
  }
};

export const getRelativeTime = (dateString?: string) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
};

export const formatRateUnit = (rateUnit?: string, durationType?: string): string => {
  if (rateUnit === 'per_day') return 'day';
  if (rateUnit === 'per_hour') return 'hour';
  if (rateUnit === 'per_project') return 'project';
  if (rateUnit === 'per_piece') return 'piece';
  if (durationType === 'daily') return 'day';
  return 'day';
};

const formatCompensation = (amount: number | string | undefined | null): string => {
  if (amount == null) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return String(amount);
  return num.toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const JobCard = React.memo(function JobCard({
  job,
  onPress,
  onSave,
  isSaved,
}: JobCardProps) {
  const isUrgent = !!(job.is_urgent || job.urgent);
  const isVerified = job.employer?.verification_badge;
  const primaryCategory = job.categories?.[0] || job.category || 'Other';
  const catStyles = getCategoryStyles(primaryCategory);
  const isApplied = job.is_applied && !job.is_withdrawn;

  const totalSlots = job.slots || 1;
  const filledSlots = job.filled_slots ?? (job.accepted_count || 0);
  const remainingSlots = job.remaining_slots ?? Math.max(0, totalSlots - filledSlots);
  const isFilled =
    remainingSlots === 0 || job.status === 'completed' || job.status === 'closed_in_progress';

  const [reportSheetVisible, setReportSheetVisible] = useState(false);
  const { mutate: toggleReact, isPending: isReacting } = useReactToJob();

  // Extract banner media (if any)
  const bannerImage =
    (Array.isArray(job.photos) &&
    job.photos.length > 0 &&
    typeof job.photos[0] === 'string' &&
    job.photos[0].trim().length > 0
      ? job.photos[0]
      : null) ||
    (job as any).photo_url ||
    (job as any).imageUrl ||
    (job as any).image_url ||
    null;

  const handleReact = () => {
    triggerHaptic('light');
    toggleReact(job.id);
  };

  const handleSave = () => {
    triggerHaptic('light');
    onSave?.();
  };

  const handleShare = async () => {
    try {
      const result = await getShareLink(job.id);
      const payText = job.compensation ? ` (₱${Number(job.compensation).toLocaleString()})` : '';
      const locationText = [job.barangay, job.municipality].filter(Boolean).join(', ');
      const message = `Check out this job on SIKAP: ${job.title}${payText}${locationText ? ` in ${locationText}` : ''}!\n\nOpen in SIKAP App: sikap://jobs/${job.id}\nWeb Preview: ${result.share_link}`;

      await Share.share({
        title: job.title,
        message,
        url: result.share_link,
      });
    } catch {
      // Share title only — never expose raw internal IDs
      try {
        await Share.share({
          message: `Check out this job on SIKAP: ${job.title}`,
        });
      } catch (err) {
        console.warn('Share error:', err);
      }
    }
  };

  return (
    <View
      style={[
        styles.card,
        isApplied && styles.cardApplied,
        job.is_withdrawn && styles.cardWithdrawn,
      ]}
    >
      {/* Tint overlay for Applied / Withdrawn states */}
      {(isApplied || job.is_withdrawn) && (
        <View
          pointerEvents="none"
          style={[styles.tintOverlay, isApplied ? styles.tintApplied : styles.tintWithdrawn]}
        />
      )}

      {/* Top Banner Strip for Applied / Withdrawn */}
      {(isApplied || job.is_withdrawn) && (
        <View
          style={[
            styles.topBanner,
            isApplied ? styles.topBannerApplied : styles.topBannerWithdrawn,
          ]}
        >
          <Ionicons
            name={isApplied ? 'checkmark-circle' : 'remove-circle'}
            size={12}
            color={isApplied ? '#15803D' : '#92400E'}
          />
          <Text style={[styles.topBannerText, { color: isApplied ? '#15803D' : '#92400E' }]}>
            {isApplied ? 'Applied to this job' : 'Application Withdrawn'}
          </Text>
        </View>
      )}

      {/* Card Header & Content (Clickable) */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.cardPressable}>
        {/* Zone 1: Media Section (Top - Conditional) */}
        {bannerImage ? (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: bannerImage }}
              style={styles.bannerImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
            {Array.isArray(job.photos) && job.photos.length > 1 && (
              <View style={styles.photoCountBadge}>
                <Ionicons name="images" size={11} color="#FFFFFF" />
                <Text style={styles.photoCountText}>+{job.photos.length - 1}</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Zone 2: Card Content Area */}
        <View style={styles.contentArea}>
          {/* Header Row: Category Icon + Title + Verified Badge (Left) / Urgent + Bookmark (Right) */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.categoryIconCircle, { backgroundColor: catStyles.bg }]}>
                <Ionicons name={catStyles.icon as any} size={18} color={catStyles.color} />
              </View>
              <View style={styles.titleContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.jobTitle} numberOfLines={2}>
                    {job.title}
                  </Text>
                  {isVerified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color="#22C55E"
                      style={styles.verifiedIcon}
                    />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.headerRight}>
              {isUrgent && (
                <View style={[styles.badge, styles.badgeUrgent]}>
                  <Ionicons name="flame" size={10} color={colors.error} />
                  <Text style={[styles.badgeText, { color: colors.error }]}>URGENT</Text>
                </View>
              )}
              {onSave && (
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.saveBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={isSaved ? 'Remove from saved' : 'Save job'}
                >
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isSaved ? colors.primary : colors.inkSoft}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Meta Info Row: Location, Open Slots, Duration, Relative Time */}
          <View style={styles.metaRow}>
            <Ionicons name="location-sharp" size={12} color={colors.inkMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {job.municipality}
            </Text>
            <View style={styles.dot} />
            {isFilled ? (
              <Text style={[styles.metaText, styles.slotFilledText]}>
                Filled ({totalSlots}/{totalSlots})
              </Text>
            ) : totalSlots > 1 ? (
              filledSlots > 0 ? (
                <Text style={[styles.metaText, styles.slotLeftText]}>
                  {remainingSlots} of {totalSlots} slots left
                </Text>
              ) : (
                <Text style={styles.metaText}>{totalSlots} slots</Text>
              )
            ) : (
              <Text style={styles.metaText}>1 slot</Text>
            )}
            {job.duration ? (
              <>
                <View style={styles.dot} />
                <Text style={styles.metaText}>
                  {job.duration} {job.duration_unit || 'days'}
                </Text>
              </>
            ) : null}
            <View style={styles.dot} />
            <Text style={styles.metaText}>{getRelativeTime(job.created_at)}</Text>
          </View>

          {/* Truncated Description Snippet */}
          {job.description ? (
            <Text style={styles.descriptionSnippet} numberOfLines={2}>
              {job.description}
            </Text>
          ) : null}

          {/* Optional Tools Required Pill */}
          {job.tools_required ? (
            <View style={styles.toolsRow}>
              <Ionicons name="construct-outline" size={13} color={colors.primary} />
              <Text style={styles.toolsText} numberOfLines={1}>
                <Text style={styles.toolsLabel}>Tools required: </Text>
                {job.tools_required}
              </Text>
            </View>
          ) : null}

          {/* Pricing & Category Line */}
          <View style={styles.pricingRow}>
            <View style={styles.rateContainer}>
              <Text style={styles.currencySymbol}>₱</Text>
              <Text style={styles.rateAmount}>{formatCompensation(job.compensation)}</Text>
              <Text style={styles.rateUnit}>
                {' '}
                / {formatRateUnit(job.rate_unit, job.duration_type)}
              </Text>
            </View>

            <View style={[styles.categoryPill, { backgroundColor: catStyles.bg }]}>
              <Text style={[styles.categoryPillText, { color: catStyles.color }]}>
                {primaryCategory}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Zone 3: Bottom Action Footer */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleReact}
          disabled={isReacting}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Mark as interested"
        >
          <Ionicons
            name={job.user_has_reacted ? 'heart' : 'heart-outline'}
            size={16}
            color={job.user_has_reacted ? '#E85D75' : '#8C7B6A'}
          />
          <Text style={[styles.actionText, job.user_has_reacted && styles.actionTextActive]}>
            {job.reactions_count && job.reactions_count > 0 ? `${job.reactions_count} ` : ''}
            Interested
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleShare}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Share job"
        >
          <Ionicons name="share-social-outline" size={16} color="#8C7B6A" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setReportSheetVisible(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Report job"
        >
          <Ionicons name="flag-outline" size={16} color="#8C7B6A" />
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
      </View>

      <ReportJobSheet
        visible={reportSheetVisible}
        onClose={() => setReportSheetVisible(false)}
        jobId={job.id}
        jobTitle={job.title}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.75)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardApplied: {},
  cardWithdrawn: {},
  cardPressable: {
    width: '100%',
  },
  tintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1,
  },
  tintApplied: {
    backgroundColor: 'rgba(209, 250, 229, 0.45)',
  },
  tintWithdrawn: {
    backgroundColor: 'rgba(254, 243, 199, 0.45)',
  },
  topBanner: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    zIndex: 2,
  },
  topBannerApplied: {
    backgroundColor: '#DCFCE7',
    borderBottomWidth: 1,
    borderBottomColor: '#86EFAC',
  },
  topBannerWithdrawn: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  topBannerText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  mediaContainer: {
    width: '100%',
    height: 165,
    backgroundColor: colors.inkFaint,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  photoCountText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    color: '#FFFFFF',
  },
  contentArea: {
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  jobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 19,
    color: colors.ink,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    paddingTop: 2,
  },
  saveBtn: {
    padding: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  badgeUrgent: {
    backgroundColor: colors.status.rejected.bg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.inkMuted,
  },
  slotFilledText: {
    color: colors.error,
    fontFamily: fonts.bodyBold,
  },
  slotLeftText: {
    color: '#D97706',
    fontFamily: fonts.bodyBold,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.inkFaint,
    marginHorizontal: 2,
  },
  descriptionSnippet: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 8,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F6F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBE7DF',
    marginTop: 8,
  },
  toolsLabel: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  toolsText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    flex: 1,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontFamily: fonts.numericBold,
    fontSize: 14,
    color: colors.ink,
    marginRight: 1,
  },
  rateAmount: {
    fontFamily: fonts.numericBold,
    fontSize: 16.5,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  rateUnit: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#8C7B6A',
    fontFamily: fonts.bodyMedium,
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#E85D75',
    fontWeight: '600',
  },
});
