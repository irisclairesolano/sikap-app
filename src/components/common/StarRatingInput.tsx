import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';

interface StarRatingInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

export const StarRatingInput: React.FC<StarRatingInputProps> = ({
  label,
  value,
  onChange,
  size = 32,
}) => {
  const handleSelect = (star: number) => {
    triggerHaptic('light');
    onChange(star);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleSelect(star)}
            activeOpacity={0.7}
            style={styles.starBtn}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={size}
              color={star <= value ? colors.gold : colors.inkFaint}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starBtn: {
    padding: 2,
  },
});

export default StarRatingInput;
