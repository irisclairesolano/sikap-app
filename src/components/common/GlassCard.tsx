import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { glass } from '../../theme';

export interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  ambientGlow?: 'peach' | 'sky' | 'mint' | 'gold' | 'rose' | 'none';
  glowPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  ambientGlow = 'none',
  glowPosition = 'top-right',
  ...props
}) => {
  const getGlowColor = () => {
    switch (ambientGlow) {
      case 'peach':
        return glass.glowPeach;
      case 'sky':
        return glass.glowSky;
      case 'mint':
        return glass.glowMint;
      case 'gold':
        return glass.glowGold;
      case 'rose':
        return glass.glowRose;
      default:
        return 'transparent';
    }
  };

  const getGlowPosStyle = (): ViewStyle => {
    switch (glowPosition) {
      case 'top-left':
        return { top: -12, left: -10 };
      case 'bottom-right':
        return { bottom: -12, right: -10 };
      case 'bottom-left':
        return { bottom: -12, left: -10 };
      case 'top-right':
      default:
        return { top: -12, right: -10 };
    }
  };

  if (ambientGlow !== 'none') {
    return (
      <View style={styles.wrapper}>
        <View
          style={[styles.ambientGlow, getGlowPosStyle(), { backgroundColor: getGlowColor() }]}
        />
        <View style={[styles.glassCard, style]} {...props}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.glassCard, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  ambientGlow: {
    position: 'absolute',
    width: 140,
    height: 120,
    borderRadius: 60,
  },
  glassCard: {
    ...glass.card,
  },
});

export default GlassCard;
