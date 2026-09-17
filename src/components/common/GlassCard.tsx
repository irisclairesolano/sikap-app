import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { glass } from '../../theme';

export interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  ambientGlow?: 'peach' | 'sky' | 'mint' | 'gold' | 'rose' | 'none';
  glowPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  ambientGlow = 'none',
  glowPosition = 'top-right',
  intensity = 40,
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
        return { top: -14, left: -10 };
      case 'bottom-right':
        return { bottom: -14, right: -10 };
      case 'bottom-left':
        return { bottom: -14, left: -10 };
      case 'top-right':
      default:
        return { top: -14, right: -10 };
    }
  };

  const cardContent = (
    <BlurView intensity={intensity} tint="light" style={[styles.blurContainer, style]} {...props}>
      {children}
    </BlurView>
  );

  if (ambientGlow !== 'none') {
    return (
      <View style={styles.wrapper}>
        <View
          style={[styles.ambientGlow, getGlowPosStyle(), { backgroundColor: getGlowColor() }]}
          pointerEvents="none"
        />
        {cardContent}
      </View>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  ambientGlow: {
    position: 'absolute',
    width: 160,
    height: 140,
    borderRadius: 70,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.70)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
});

export default GlassCard;
