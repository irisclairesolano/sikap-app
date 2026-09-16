import { ViewStyle } from 'react-native';

export const glass = {
  // Translucent frosted surface fills
  surfaceUltraLight: 'rgba(255, 255, 255, 0.65)',
  surfaceLight: 'rgba(255, 255, 255, 0.78)',
  surfaceMedium: 'rgba(255, 255, 255, 0.88)',
  surfaceStrong: 'rgba(255, 255, 255, 0.94)',
  surfaceSolid: '#FFFFFF',

  // Frosted borders — keep very understated
  border: 'rgba(255, 255, 255, 0.35)',
  borderLight: 'rgba(255, 255, 255, 0.20)',
  borderStrong: 'rgba(255, 255, 255, 0.55)',
  borderSubtle: 'rgba(226, 232, 240, 0.60)',

  // Ambient backdrop glow tints (soft pastels)
  glowPeach: 'rgba(255, 197, 208, 0.28)',
  glowSky: 'rgba(176, 226, 255, 0.28)',
  glowMint: 'rgba(152, 251, 152, 0.24)',
  glowGold: 'rgba(253, 242, 137, 0.28)',
  glowRose: 'rgba(244, 63, 94, 0.14)',

  // Major surface preset — used for form card wrappers, modal sheets
  // Soft translucency + very faint border, ambient depth via shadow only
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.40)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  } as ViewStyle,

  // Pill / badge — now flat/clean, no glass box
  pill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  } as ViewStyle,

  // Input — clean white, neutral border
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.80)',
  } as ViewStyle,

  // Bottom tab bar — frosted, kept for navigation only
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.60)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 8,
  } as ViewStyle,
};

export type GlassTokens = typeof glass;
