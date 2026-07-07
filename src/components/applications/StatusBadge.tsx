import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme';
import { Application } from '../../types';

interface StatusBadgeProps {
  application: Application;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ application }) => {
  const { status, references_revealed, contact_revealed } = application;

  let label = '';
  let colorConfig: { bg: string; text: string } = { bg: colors.inkFaint, text: colors.inkSoft };

  if (status === 'pending') {
    if (references_revealed || contact_revealed) {
      label = 'Employer interested';
      colorConfig = colors.status.pending_negotiation; // Using a warm color for Stage 2
    } else {
      label = 'Pending';
      colorConfig = colors.status.pending;
    }
  } else if (status === 'employer_confirmed') {
    label = 'Offer · action needed';
    colorConfig = colors.status.employer_confirmed;
  } else if (status === 'accepted') {
    label = 'Hired';
    colorConfig = colors.status.accepted;
  } else if (status === 'completed') {
    label = 'Completed';
    colorConfig = colors.status.completed;
  } else if (status === 'rejected') {
    label = 'Not selected';
    colorConfig = colors.status.rejected;
  } else if (status === 'withdrawn') {
    label = 'Withdrawn';
    colorConfig = colors.status.withdrawn;
  } else {
    label = status;
  }

  return (
    <View style={[styles.badge, { backgroundColor: colorConfig.bg }]}>
      <Text style={[styles.text, { color: colorConfig.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
  },
});
