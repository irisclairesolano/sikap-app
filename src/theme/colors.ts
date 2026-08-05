export const colors = {
  // Primary palette (Terracotta)
  primary: '#E8744A',
  primaryDark: '#C9572D',
  primarySoft: '#FFB6C1',
  primaryTint: '#DDA0DD',

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
  peach: '#FFB6C1',
  peachBright: '#FFCCA8',
  butter: '#F0E68C',
  butterBright: '#FFD66B',
  mint: '#90EE90',
  mintDeep: '#3E7648',
  sky: '#87CEEB',
  skyDeep: '#3B718F',

  // Status & semantic
  urgent: '#E8744A',
  urgentSoft: '#FFE0D2',

  // Status colors
  success: '#3E7648',
  warning: '#A88414',
  error: '#B82E1E',
  gold: '#F4B73E',

  // Backward compatible aliases
  textPrimary: '#2B1F15', // alias for ink
  textSecondary: '#4F3D2D', // alias for inkSoft
  primaryLight: '#FFB6C1', // alias for primarySoft
  border: '#E8DFCE', // alias for inkFaint
  primaryBg: '#E8744A', // alias for primary
  primaryBG: '#DDA0DD', // alias for primaryTint
  // End of aliases
  status: {
    pending: { bg: '#F0E68C', text: '#8A731F' },
    accepted: { bg: '#90EE90', text: '#2C5A34' },
    completed: { bg: '#90EE90', text: '#2C5A34' },
    rejected: { bg: '#FFB6C1', text: '#9B2C24' },
    withdrawn: { bg: '#FFEADB', text: '#EA580C' }, // A little orange
    pending_negotiation: { bg: '#DDA0DD', text: '#6D2C6D' },
    employer_confirmed: { bg: '#DDA0DD', text: '#6D2C6D' },
  },
} as const;

export type ThemeColors = typeof colors;
