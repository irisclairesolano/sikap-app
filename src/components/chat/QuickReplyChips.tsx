import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';

interface QuickReplyChipsProps {
  userRole?: 'worker' | 'employer' | 'admin';
  onSelectChip: (text: string) => void;
  disabled?: boolean;
  onDismiss?: () => void;
}

const WORKER_QUICK_REPLIES = [
  { label: 'Available tomorrow', text: 'I am available to start tomorrow.' },
  { label: 'Exact location?', text: 'Where is the exact address or landmark?' },
  {
    label: 'Have my own tools 🔨',
    text: 'I have my own tools and equipment for the job.',
  },
  { label: 'Can I call?', text: 'May I give you a call to discuss the details?' },
  {
    label: 'Agreed! 👍',
    text: 'I agree with the proposed rate and schedule. Thank you!',
  },
];

const EMPLOYER_QUICK_REPLIES = [
  { label: 'When can you start?', text: 'When is the earliest you can start the job?' },
  {
    label: 'Are you nearby?',
    text: 'Are you currently located nearby or in a neighboring barangay?',
  },
  { label: 'Do you have tools?', text: 'Do you have your own tools or equipment for this job?' },
  {
    label: 'Check the offer',
    text: 'Please check the official hiring offer in the card above.',
  },
  { label: 'Thank you!', text: 'Thank you for the prompt response!' },
];

export const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({
  userRole = 'worker',
  onSelectChip,
  disabled = false,
  onDismiss,
}) => {
  if (disabled) return null;

  const chips = userRole === 'employer' ? EMPLOYER_QUICK_REPLIES : WORKER_QUICK_REPLIES;

  const handleChipPress = (text: string) => {
    triggerHaptic('light');
    onSelectChip(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <Ionicons name="flash-outline" size={13} color={colors.primary} />
          <Text style={styles.promptLabel}>Quick replies</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              triggerHaptic('light');
              onDismiss();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Remove quick replies"
          >
            <Ionicons name="close" size={15} color={colors.inkMuted} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.chip}
            activeOpacity={0.7}
            onPress={() => handleChipPress(item.text)}
          >
            <Text style={styles.chipText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    backgroundColor: colors.paperBright,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  closeBtn: {
    padding: 2,
    borderRadius: 12,
  },
  promptLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.primaryTint,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 116, 74, 0.25)',
  },
  chipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.primaryDark,
  },
});

export default QuickReplyChips;
