import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import Button from './Button';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  // Fallback for simple text-only (empty filter)
  message?: string;
  onReset?: () => void;
  resetLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  subtitle, 
  icon, 
  iconColor = colors.primary, 
  iconBgColor = colors.primaryTint, 
  actionLabel, 
  onAction,
  message,
  onReset,
  resetLabel = "Show all"
}) => {
  if (message && !title) {
    return (
      <View style={styles.simpleContainer}>
        <Text style={styles.simpleText}>{message}</Text>
        {onReset && (
          <Text style={styles.resetText} onPress={onReset}>
            {resetLabel}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {icon && (
        <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
          <Ionicons name={icon} size={32} color={iconColor} />
        </View>
      )}
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <View style={styles.actionWrapper}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 64, // push it down a bit from header
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  actionWrapper: {
    marginTop: 24,
    width: '100%',
    maxWidth: 200,
  },
  simpleContainer: {
    padding: 32,
    alignItems: 'center',
  },
  simpleText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  resetText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.primary,
    marginTop: 12,
  },
});
