import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  count?: number;
}

export const Chip: React.FC<ChipProps> = ({ label, active, onPress, count }) => {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, active && styles.labelActive]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <Text style={[styles.count, active && styles.countActive]}>
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.inkSoft,
  },
  labelActive: {
    color: colors.white,
  },
  count: {
    fontFamily: fonts.numericBold,
    fontSize: 12,
    color: colors.primary,
    marginLeft: 6,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  countActive: {
    color: colors.white,
    backgroundColor: colors.primaryDark,
  },
});
