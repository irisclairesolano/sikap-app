export const colors = {
  // Primary palette (Midnight Navy from Logo)
  primary: '#0D1B3D',
  primaryDark: '#060C1B',
  primarySoft: '#2C5E7A',
  primaryTint: '#EBF0F6',

  // Text colors (High contrast slates)
  ink: '#0F172A',
  inkSoft: '#334155',
  inkMuted: '#64748B',
  inkLight: '#94A3B8',

  // Neutral colors (Cool-grey/blue backgrounds)
  inkFaint: '#E2E8F0',
  white: '#FFFFFF',
  paper: '#F4F7FC',
  paperCream: '#E2E8F0',
  paperBright: '#FFFFFF',

  // Accents (Improved contrast pastels)
  peach: '#FFC5D0',
  peachBright: '#FFDBE2',
  butter: '#FDF289',
  butterBright: '#FEF7C3',
  mint: '#98FB98',
  mintDeep: '#1E4D2B',
  sky: '#B0E2FF',
  skyDeep: '#1D4ED8',

  // Status & semantic
  urgent: '#E11D48',
  urgentSoft: '#FFE4E6',

  // Status colors
  success: '#15803D',
  warning: '#D97706',
  error: '#B91C1C',
  gold: '#EAB308',

  // Backward compatible aliases
  textPrimary: '#0F172A', // alias for ink
  textSecondary: '#334155', // alias for inkSoft
  primaryLight: '#2C5E7A', // alias for primarySoft
  border: '#E2E8F0', // alias for inkFaint
  primaryBg: '#0D1B3D', // alias for primary
  primaryBG: '#0D1B3D', // alias for primaryTint
  // End of aliases
  status: {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    accepted: { bg: '#DCFCE7', text: '#15803D' },
    completed: { bg: '#DCFCE7', text: '#15803D' },
    rejected: { bg: '#FEE2E2', text: '#B91C1C' },
    withdrawn: { bg: '#FFEDD5', text: '#EA580C' },
    pending_negotiation: { bg: '#F3E8FF', text: '#7E22CE' },
    employer_confirmed: { bg: '#F3E8FF', text: '#7E22CE' },
  },
} as const;

export type ThemeColors = typeof colors;
