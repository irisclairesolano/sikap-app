import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';

interface BadgeProps {
  label: string;
  variant: 'urgent' | 'verified' | 'neutral';
  icon?: keyof typeof Ionicons.glyphMap;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant, icon }) => {
  let backgroundColor: string = colors.inkFaint;
  let textColor: string = colors.inkSoft;
  let defaultIcon: keyof typeof Ionicons.glyphMap | undefined = undefined;

  switch (variant) {
    case 'urgent':
      backgroundColor = colors.peach;
      textColor = colors.primaryDark;
      defaultIcon = 'flame';
      break;
    case 'verified':
      backgroundColor = colors.mint;
      textColor = colors.success; // We might want a mintDark, but success works
      defaultIcon = 'checkmark-circle';
      break;
    case 'neutral':
    default:
      break;
  }

  const iconName = icon || defaultIcon;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {iconName && (
        <Ionicons name={iconName} size={14} color={textColor} style={styles.icon} />
      )}
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100, // fully rounded
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '600',
  },
});
