import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { JobPost } from '../../types';
import { useReactToJob } from '../../hooks/useReactToJob';
import { getShareLink } from '../../api/jobs';
import { ReportJobSheet } from './ReportJobSheet';

interface JobCardProps {
  job: JobPost;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

const getCategoryStyles = (category: string) => {
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

const getRelativeTime = (dateString?: string) => {
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

export const JobCard = React.memo(function JobCard({
  job,
  onPress,
  onSave,
  isSaved,
}: JobCardProps) {
  const isUrgent = !!(job.is_urgent || job.urgent);
  const isVerified = job.employer?.verification_badge;
  const catStyles = getCategoryStyles(job.categories?.[0] || 'Other');
  const isApplied = job.is_applied && !job.is_withdrawn;

  const [reportSheetVisible, setReportSheetVisible] = useState(false);
  const { mutate: toggleReact, isPending: isReacting } = useReactToJob();

  const handleReact = () => {
    toggleReact(job.id);
  };

  const handleShare = async () => {
    try {
      const result = await getShareLink(job.id);
      await Share.share({
        message: `Check out this job on SIKAP!\n\n${result.job_title}\n${result.share_link}`,
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
      {/* Tint overlay — absolute, clipped to rounded corners independently of shadow */}
      {(isApplied || job.is_withdrawn) && (
        <View
          pointerEvents="none"
          style={[styles.tintOverlay, isApplied ? styles.tintApplied : styles.tintWithdrawn]}
        />
      )}

      {(isApplied || job.is_withdrawn) && (
        <View
          pointerEvents="none"
          style={[
            styles.statusChip,
            isApplied ? styles.statusChipApplied : styles.statusChipWithdrawn,
          ]}
        >
          <Ionicons
            name={isApplied ? 'checkmark-circle' : 'remove-circle'}
            size={11}
            color={isApplied ? '#15803D' : '#92400E'}
          />
          <Text style={[styles.statusChipText, { color: isApplied ? '#15803D' : '#92400E' }]}>
            {isApplied ? 'Applied' : 'Withdrawn'}
          </Text>
        </View>
      )}

      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={styles.topRow}>
          <View style={[styles.jobIcon, { backgroundColor: catStyles.bg }]}>
            <Ionicons name={catStyles.icon as any} size={20} color={catStyles.color} />
          </View>

          <View style={styles.jobText}>
            {isUrgent && (
              <View style={styles.jobBadges}>
                <View style={[styles.badge, styles.badgeUrgent]}>
                  <Ionicons name="flame" size={10} color={colors.error} />
                  <Text style={[styles.badgeText, { color: colors.error }]}>URGENT</Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.jobTitle, { flex: 1 }]} numberOfLines={2}>
                {job.title.length > 45 ? `${job.title.slice(0, 45)}...` : job.title}
              </Text>
              {isVerified && <Ionicons name="checkmark-circle" size={15} color="#22C55E" />}
            </View>

            <View style={styles.jobMeta}>
              <Ionicons name="location" size={11} color={colors.inkMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {job.municipality}
              </Text>
              <View style={styles.dot} />
              <Text style={styles.metaText}>{job.slots || 1} slots</Text>
              <View style={styles.dot} />
              <Text style={styles.metaText}>{getRelativeTime(job.created_at)}</Text>
            </View>
          </View>

          <View style={styles.rightContent}>
            {onSave && (
              <TouchableOpacity
                onPress={onSave}
                style={styles.saveBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isSaved ? colors.primary : colors.inkSoft}
                />
              </TouchableOpacity>
            )}
            <View style={styles.payContainer}>
              <Text style={styles.payValue}>₱{job.compensation}</Text>
              <Text style={styles.payUnit}>
                per {job.duration_type === 'daily' ? 'day' : 'project'}
              </Text>
            </View>
          </View>
        </View>

        {job.description ? (
          <Text style={styles.descriptionSnippet} numberOfLines={2}>
            {job.description.length > 85 ? `${job.description.slice(0, 85)}...` : job.description}
          </Text>
        ) : null}

        {job.tools_required ? (
          <View style={styles.toolsContainer}>
            <View style={styles.toolsSeparator} />
            <View style={styles.toolsRow}>
              <Ionicons name="construct-outline" size={13} color={colors.primary} />
              <Text style={styles.toolsText} numberOfLines={1}>
                <Text style={{ fontFamily: fonts.bodyBold, color: colors.ink }}>
                  Tools required:{' '}
                </Text>
                {job.tools_required}
              </Text>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Social Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleReact}
          disabled={isReacting}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={job.user_has_reacted ? 'heart' : 'heart-outline'}
            size={16}
            color={job.user_has_reacted ? '#E85D75' : '#8C7B6A'}
          />
          <Text style={[styles.actionText, job.user_has_reacted && styles.actionTextActive]}>
            {job.reactions_count && job.reactions_count > 0 ? job.reactions_count : ''} Interested
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleShare}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-social-outline" size={16} color="#8C7B6A" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setReportSheetVisible(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 10,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardApplied: {},
  cardWithdrawn: {},
  tintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tintApplied: {
    backgroundColor: 'rgba(209, 250, 229, 0.55)',
  },
  tintWithdrawn: {
    backgroundColor: 'rgba(254, 243, 199, 0.55)',
  },
  statusChip: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    zIndex: 10,
  },
  statusChipApplied: {
    backgroundColor: 'rgba(220, 252, 231, 0.9)',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusChipWithdrawn: {
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  statusChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  topRow: {
    flexDirection: 'row',
    gap: 14,
  },
  jobIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  jobText: {
    flex: 1,
  },
  jobBadges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 100, // var(--r-pill)
  },
  badgeText: {
    fontFamily: fonts.bodyBold, // assuming we use bold for badge
    fontSize: 9,
    letterSpacing: 0.5, // 0.05em
  },
  badgeUrgent: {
    backgroundColor: colors.status.rejected.bg,
  },
  jobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.ink,
    marginBottom: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.inkFaint,
    marginHorizontal: 2,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  saveBtn: {
    marginBottom: 8,
  },
  payContainer: {
    alignItems: 'flex-end',
  },
  payValue: {
    fontFamily: fonts.numericBold,
    fontSize: 16, // num-md
    color: colors.ink,
    letterSpacing: -0.5,
  },
  payUnit: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkSoft,
    marginTop: 2,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#8C7B6A',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#E85D75',
    fontWeight: '600',
  },
  descriptionSnippet: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  toolsContainer: {
    marginTop: 4,
  },
  toolsSeparator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 8,
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
  },
  toolsText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    flex: 1,
  },
});
