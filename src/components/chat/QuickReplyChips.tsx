import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';

import { useLanguage } from '../../contexts/LanguageContext';

interface QuickReplyChipsProps {
  userRole?: 'worker' | 'employer' | 'admin';
  onSelectChip: (text: string) => void;
  disabled?: boolean;
  onDismiss?: () => void;
}

export const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({
  userRole = 'worker',
  onSelectChip,
  disabled = false,
  onDismiss,
}) => {
  const { t } = useLanguage();

  if (disabled) return null;

  const workerReplies = [
    { label: t('qr_worker_available_label'), text: t('qr_worker_available_text') },
    { label: t('qr_worker_location_label'), text: t('qr_worker_location_text') },
    { label: t('qr_worker_tools_label'), text: t('qr_worker_tools_text') },
    { label: t('qr_worker_call_label'), text: t('qr_worker_call_text') },
    { label: t('qr_worker_agreed_label'), text: t('qr_worker_agreed_text') },
  ];

  const employerReplies = [
    { label: t('qr_employer_start_label'), text: t('qr_employer_start_text') },
    { label: t('qr_employer_nearby_label'), text: t('qr_employer_nearby_text') },
    { label: t('qr_employer_tools_label'), text: t('qr_employer_tools_text') },
    { label: t('qr_employer_offer_label'), text: t('qr_employer_offer_text') },
    { label: t('qr_employer_thanks_label'), text: t('qr_employer_thanks_text') },
  ];

  const chips = userRole === 'employer' ? employerReplies : workerReplies;

  const handleChipPress = (text: string) => {
    triggerHaptic('light');
    onSelectChip(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <Ionicons name="flash-outline" size={13} color={colors.primary} />
          <Text style={styles.promptLabel}>{t('quick_replies')}</Text>
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
