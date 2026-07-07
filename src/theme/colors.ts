export const colors = {
  // Primary palette (Terracotta)
  primary: '#E8744A',
  primaryDark: '#C9572D',
  primarySoft: '#FCD9C5',
  primaryTint: '#FFEADB',

  // Text colors
  ink: '#2B1F15',
  inkSoft: '#4F3D2D',
  inkMuted: '#8C7B6A',
  inkLight: '#C2B5A4',

  // Neutral colors
  inkFaint: '#E8DFCE',
  white: '#FFFFFF',
  paper: '#FDF8F0',
  paperCream: '#F7EFE3',
  paperBright: '#FFFFFF',

  // Accents
  peach: '#FCE4D2',
  peachBright: '#FFCCA8',
  butter: '#FFE9B0',
  butterBright: '#FFD66B',
  mint: '#D8EBDC',
  mintDeep: '#5A9168',
  sky: '#DCE9F2',
  skyDeep: '#5A8AA8',

  // Status & semantic
  urgent: '#E8744A',
  urgentSoft: '#FFE0D2',

  // Status colors
  success: '#6BA475',
  warning: '#E89C2D',
  error: '#C04830',
  gold: '#F4B73E',

  // Backward compatible aliases
  textPrimary: '#2B1F15', // alias for ink
  textSecondary: '#4F3D2D', // alias for inkSoft
  primaryLight: '#FCD9C5', // alias for primarySoft
  border: '#E8DFCE', // alias for inkFaint
  primaryBg: '#E8744A', // alias for primary
  primaryBG: '#FFEADB', // alias for primaryTint
  // End of aliases
  status: {
    pending: { bg: '#FEF3C7', text: '#E89C2D' },
    accepted: { bg: '#DCFCE7', text: '#6BA475' },
    completed: { bg: '#DCFCE7', text: '#6BA475' },
    rejected: { bg: '#FEE2E2', text: '#C04830' },
    withdrawn: { bg: '#FEE2E2', text: '#C04830' },
    pending_negotiation: { bg: '#FFEADB', text: '#E8744A' },
    employer_confirmed: { bg: '#FFEADB', text: '#E8744A' },
  },
} as const;

export type ThemeColors = typeof colors;
