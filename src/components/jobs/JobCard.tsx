import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { JobPost } from '../../types';

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

export const JobCard: React.FC<JobCardProps> = ({ job, onPress, onSave, isSaved }) => {
  // Mock badges logic
  const isUrgent = false; // Mock logic
  const isVerified = job.employer?.verification_badge;
  const catStyles = getCategoryStyles(job.categories?.[0] || 'Other');
  const isApplied = job.is_applied && !job.is_withdrawn;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isApplied && styles.cardApplied,
        job.is_withdrawn && styles.cardWithdrawn,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isApplied && <View style={styles.appliedCorner} />}
      {job.is_withdrawn && <View style={styles.withdrawnCorner} />}
      <View style={[styles.jobIcon, { backgroundColor: catStyles.bg }]}>
        <Ionicons name={catStyles.icon as any} size={20} color={catStyles.color} />
      </View>

      <View style={styles.jobText}>
        {(isUrgent || isVerified) && (
          <View style={styles.jobBadges}>
            {isUrgent && (
              <View style={[styles.badge, styles.badgeUrgent]}>
                <Ionicons name="flame" size={10} color={colors.error} />
                <Text style={[styles.badgeText, { color: colors.error }]}>URGENT</Text>
              </View>
            )}
            {isVerified && (
              <View style={[styles.badge, styles.badgeVerified]}>
                <Ionicons name="checkmark-circle" size={10} color={colors.mintDeep} />
                <Text style={[styles.badgeText, { color: colors.mintDeep }]}>VERIFIED</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.jobTitle} numberOfLines={1}>
          {job.title}
        </Text>

        <View style={styles.jobMeta}>
          <Ionicons name="location" size={11} color={colors.inkMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {job.municipality}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{job.slots || 1} slots</Text>
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14, // var(--r-md)
    padding: 14,
    display: 'flex',
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1, // var(--shadow-sm) equivalent
  },
  cardApplied: {
    borderColor: colors.mintDeep,
    borderWidth: 1, // thinner border
    backgroundColor: colors.status.accepted.bg, // subtle green tint
  },
  cardWithdrawn: {
    borderColor: colors.status.withdrawn.text, // use themed withdrawn text color
    borderWidth: 1,
    backgroundColor: colors.status.withdrawn.bg, // use themed withdrawn background tint
  },
  appliedCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    backgroundColor: colors.mintDeep,
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 32,
    zIndex: 10,
  },
  withdrawnCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    backgroundColor: colors.warning,
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 32,
    zIndex: 10,
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
  badgeVerified: {
    backgroundColor: colors.mint,
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
});
