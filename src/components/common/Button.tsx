import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';

export interface ButtonProps extends TouchableOpacityProps {
  label?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'soft';
  size?: 'base' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  icon?: any;
  iconPosition?: 'left' | 'right';
  style?: any;
}

const Button: React.FC<ButtonProps> = ({
  label,
  title,
  onPress,
  variant = 'primary',
  size = 'base',
  loading,
  disabled,
  fullWidth,
  accessibilityLabel,
  icon,
  iconPosition = 'left',
  style,
}) => {
  const displayLabel = label || title || '';
  const variantStyle: ViewStyle =
    variant === 'primary'
      ? styles.primaryBg
      : variant === 'danger'
        ? styles.dangerBg
        : variant === 'outline'
          ? styles.outlineBg
          : variant === 'ghost'
            ? styles.ghostBg
            : variant === 'soft'
              ? styles.softBg
              : styles.secondaryBg;

  const labelStyle: TextStyle =
    variant === 'outline'
      ? styles.labelOutline
      : variant === 'secondary'
        ? styles.labelSecondary
        : variant === 'ghost'
          ? styles.labelGhost
          : variant === 'soft'
            ? styles.labelSoft
            : styles.labelOnPrimary;

  const shadowStyle: ViewStyle | undefined =
    variant === 'primary' && !disabled
      ? shadows.color
      : variant === 'secondary' && !disabled
        ? shadows.sm
        : undefined;

  const lastPressTime = React.useRef(0);

  const handlePress = (e: any) => {
    const now = Date.now();
    if (now - lastPressTime.current < 800) {
      return;
    }
    lastPressTime.current = now;
    onPress?.(e);
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        size === 'lg' && styles.lg,
        variantStyle,
        shadowStyle,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityLabel={accessibilityLabel || displayLabel}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline' || variant === 'ghost'
              ? colors.primary
              : variant === 'secondary'
                ? colors.ink
                : colors.white
          }
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={size === 'lg' ? 20 : 18}
              color={labelStyle.color}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={[styles.label, size === 'lg' && styles.labelLg, labelStyle]}>
            {displayLabel}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={size === 'lg' ? 20 : 18}
              color={labelStyle.color}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 26,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.55,
  },
  primaryBg: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  secondaryBg: {
    backgroundColor: colors.white,
    borderColor: 'rgba(13, 27, 61, 0.08)', // Soft UI border outline
  },
  outlineBg: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghostBg: {
    backgroundColor: 'transparent',
  },
  dangerBg: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  softBg: {
    backgroundColor: colors.primaryTint,
    borderColor: 'rgba(13, 27, 61, 0.05)',
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  labelLg: {
    fontSize: 16,
  },
  labelOnPrimary: {
    color: colors.white,
  },
  labelSecondary: {
    color: colors.primary, // Navy text for high contrast on white bg
  },
  labelOutline: {
    color: colors.primary,
  },
  labelGhost: {
    color: colors.inkMuted,
  },
  labelSoft: {
    color: colors.primaryDark,
  },
});

export default Button;
