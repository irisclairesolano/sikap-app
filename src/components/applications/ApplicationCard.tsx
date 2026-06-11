import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { Application } from '../../types';

interface ApplicationCardProps {
  application: Application;
  onPress: () => void;
}

const getCategoryStyles = (category: string) => {
  switch (category) {
    case 'Construction': return { icon: 'hammer', bg: colors.peach, color: colors.primary };
    case 'Domestic': return { icon: 'home', bg: colors.mint, color: colors.mintDeep };
    case 'Agriculture': return { icon: 'leaf', bg: colors.paperCream, color: colors.inkSoft };
    case 'Skilled Trade': return { icon: 'construct', bg: colors.sky, color: colors.skyDeep };
    default: return { icon: 'briefcase', bg: colors.paperCream, color: colors.inkSoft };
  }
};

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onPress }) => {
  const { job, status } = application;
  const catStyles = getCategoryStyles(job.category);

  // Derive simple badge content based on status
  // Statuses: pending, employer_confirmed, accepted, completed, rejected, withdrawn
  let badgeLabel = 'Pending';
  let badgeIcon: any = 'time-outline';
  let badgeBg: string = colors.paperCream;
  let badgeColor: string = colors.inkSoft;
  
  if (status === 'accepted') {
    badgeLabel = 'Active';
    badgeIcon = 'play';
    badgeBg = colors.mint;
    badgeColor = colors.mintDeep;
  } else if (status === 'employer_confirmed') {
    badgeLabel = 'Offer';
    badgeIcon = 'alert-circle';
    badgeBg = '#FEE2E2'; // urgent light red
    badgeColor = '#DC2626'; // urgent dark red
  } else if (status === 'completed') {
    badgeLabel = 'Done';
    badgeIcon = 'checkmark-circle';
    badgeBg = colors.inkFaint;
    badgeColor = colors.inkMuted;
  } else if (status === 'rejected' || status === 'withdrawn') {
    badgeLabel = 'Closed';
    badgeIcon = 'close-circle';
    badgeBg = colors.inkFaint;
    badgeColor = colors.inkMuted;
  }

  const isActive = status === 'accepted';

  return (
    <TouchableOpacity 
      style={[styles.jobCard, isActive && styles.activeCardBorder]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={[styles.jobIcon, { backgroundColor: catStyles.bg }]}>
          <Ionicons name={catStyles.icon as any} size={20} color={catStyles.color} />
        </View>
        <View style={styles.jobText}>
          <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.bodySm} numberOfLines={1}>{job.employer?.name || 'Unknown'} · {job.municipality}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Ionicons name={badgeIcon} size={10} color={badgeColor} style={{ marginRight: 3 }} />
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
      </View>

      {isActive && (
        <View style={styles.activeInfoBox}>
          <Ionicons name="hourglass-outline" size={18} color={colors.mintDeep} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.activeDayText}>Day <Text style={styles.num}>1</Text> of <Text style={styles.num}>{job.slots || 1}</Text></Text>
            <Text style={styles.activeSubText}>In progress</Text>
          </View>
        </View>
      )}

      {isActive && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.btnSoft}>
            <Ionicons name="call-outline" size={14} color={colors.ink} />
            <Text style={styles.btnSoftText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnSoft, { marginLeft: 10 }]}>
            <Ionicons name="flag-outline" size={14} color={colors.error} />
            <Text style={[styles.btnSoftText, { color: colors.error }]}>Report</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  jobCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  activeCardBorder: {
    borderWidth: 1.5,
    borderColor: colors.mintDeep,
    padding: 16, // match the HTML mockup
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  jobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.ink,
    marginBottom: 2,
  },
  bodySm: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeInfoBox: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDayText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.mintDeep,
  },
  num: {
    fontFamily: fonts.numericBold,
  },
  activeSubText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.mintDeep,
    opacity: 0.85,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  btnSoft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paperCream,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  btnSoftText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
  },
});
