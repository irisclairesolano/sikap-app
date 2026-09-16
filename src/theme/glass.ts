import { ViewStyle } from 'react-native';

export const glass = {
  // Translucent frosted surface fills
  surfaceUltraLight: 'rgba(255, 255, 255, 0.65)',
  surfaceLight: 'rgba(255, 255, 255, 0.78)',
  surfaceMedium: 'rgba(255, 255, 255, 0.85)',
  surfaceStrong: 'rgba(255, 255, 255, 0.92)',
  surfaceSolid: '#FFFFFF',

  // Specular frosted borders
  border: 'rgba(255, 255, 255, 0.85)',
  borderLight: 'rgba(255, 255, 255, 0.60)',
  borderStrong: '#FFFFFF',
  borderSubtle: 'rgba(226, 232, 240, 0.80)',

  // Ambient backdrop glow tints (soft pastels)
  glowPeach: 'rgba(255, 197, 208, 0.28)',
  glowSky: 'rgba(176, 226, 255, 0.28)',
  glowMint: 'rgba(152, 251, 152, 0.24)',
  glowGold: 'rgba(253, 242, 137, 0.28)',
  glowRose: 'rgba(244, 63, 94, 0.14)',

  // Card preset
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  } as ViewStyle,

  // Pill / badge preset
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderTopColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  } as ViewStyle,

  // Input preset
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
  } as ViewStyle,

  // Bottom tab bar preset
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 8,
  } as ViewStyle,
};

export type GlassTokens = typeof glass;
