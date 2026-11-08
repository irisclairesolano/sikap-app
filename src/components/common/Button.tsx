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
import { triggerHaptic } from '../../utils/haptics';

export interface ButtonProps extends TouchableOpacityProps {
  label?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'soft';
  size?: 'sm' | 'base' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  icon?: any;
  iconPosition?: 'left' | 'right';
  style?: any;
  labelStyle?: TextStyle;
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
  labelStyle: customLabelStyle,
  testID,
  ...rest
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
      ? styles.primaryShadow
      : variant === 'secondary' && !disabled
        ? styles.secondaryShadow
        : undefined;

  const lastPressTime = React.useRef(0);

  const handlePress = (e: any) => {
    const now = Date.now();
    if (now - lastPressTime.current < 350) {
      return;
    }
    lastPressTime.current = now;
    triggerHaptic('light');
    onPress?.(e);
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        size === 'sm' && styles.sm,
        size === 'lg' && styles.lg,
        variantStyle,
        shadowStyle,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel || displayLabel}
      accessibilityRole="button"
      testID={testID}
      {...rest}
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
          <Text
            style={[
              styles.label,
              size === 'sm' && styles.labelSm,
              size === 'lg' && styles.labelLg,
              labelStyle,
              customLabelStyle,
            ]}
          >
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
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    flexShrink: 1,
  },
  sm: {
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  lg: {
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.55,
  },
  primaryBg: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  primaryShadow: {
    shadowColor: '#0D1B3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryBg: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.80)',
  },
  secondaryShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  outlineBg: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghostBg: {
    backgroundColor: 'transparent',
    borderWidth: 0,
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
    fontSize: 14.5,
    textAlign: 'center',
    flexShrink: 1,
  },
  labelSm: {
    fontSize: 13,
    textAlign: 'center',
  },
  labelLg: {
    fontSize: 15,
    textAlign: 'center',
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
