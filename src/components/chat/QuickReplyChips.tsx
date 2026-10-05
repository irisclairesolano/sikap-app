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
  { label: 'Available bukas', text: 'Available po ako bukas magsimula.' },
  { label: 'Exact location?', text: 'Saan po ang exact address o landmark sa Bulan?' },
  {
    label: 'May sariling gamit 🔨',
    text: 'May sarili po akong mga gamit at tools para sa trabaho.',
  },
  { label: 'Puwede tumawag?', text: 'Puwede po ba kayo tawagan para mapag-usapan ang detalye?' },
  {
    label: 'Deal po! 👍',
    text: 'Sang-ayon po ako sa napagkasunduang presyo at iskedyul. Salamat!',
  },
];

const EMPLOYER_QUICK_REPLIES = [
  { label: 'Kailan puwede?', text: 'Kailan ka pinakamaagang puwede magsimula sa trabaho?' },
  { label: 'Nasa Bulan ka ba?', text: 'Nasa Bulan, Sorsogon ka ba ngayon o kalapit na barangay?' },
  { label: 'May gamit ka ba?', text: 'May sarili ka bang gamit o tools para sa trabaho na ito?' },
  {
    label: 'Tingnan ang offer',
    text: 'Paki-check po ang pinadala kong hiring offer sa card sa itaas.',
  },
  { label: 'Salamat!', text: 'Salamat sa mabilis na tugon!' },
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
