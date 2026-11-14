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
  success: '#166534',
  warning: '#92400E',
  error: '#991B1B',
  gold: '#A16207',

  // Backward compatible aliases
  textPrimary: '#0F172A', // alias for ink
  textSecondary: '#334155', // alias for inkSoft
  primaryLight: '#2C5E7A', // alias for primarySoft
  border: '#E2E8F0', // alias for inkFaint
  primaryBg: '#0D1B3D', // alias for primary
  primaryBG: '#0D1B3D', // alias for primaryTint
  // End of aliases
  status: {
    pending: { bg: '#FEF3C7', text: '#92400E' },
    info: { bg: '#DBEAFE', text: '#1D4ED8' },
    shortlisted: { bg: '#CCFBF1', text: '#0F766E' },
    offer: { bg: '#DBEAFE', text: '#1D4ED8' },
    accepted: { bg: '#DCFCE7', text: '#166534' },
    completed: { bg: '#DCFCE7', text: '#166534' },
    rejected: { bg: '#FEE2E2', text: '#991B1B' },
    closed: { bg: '#F1F5F9', text: '#475569' },
    withdrawn: { bg: '#FFEDD5', text: '#9A3412' },
    pending_negotiation: { bg: '#CCFBF1', text: '#0F766E' },
    employer_confirmed: { bg: '#DBEAFE', text: '#1D4ED8' },
  },
} as const;

export const getCategoryBadgeStyle = (category?: string) => {
  switch (category) {
    case 'Construction':
      return { icon: 'hammer' as const, bg: '#DBEAFE', color: '#1D4ED8' };
    case 'Domestic':
      return { icon: 'home' as const, bg: '#DCFCE7', color: '#166534' };
    case 'Agriculture':
      return { icon: 'leaf' as const, bg: '#FEF3C7', color: '#92400E' };
    case 'Skilled Trade':
      return { icon: 'construct' as const, bg: '#CCFBF1', color: '#0F766E' };
    default:
      return { icon: 'briefcase' as const, bg: '#EBF0F6', color: '#0D1B3D' };
  }
};

export const getPipelineStageBadgeStyle = (status: string): { bg: string; text: string } => {
  switch (status) {
    case 'pending':
      return { bg: '#FEF3C7', text: '#92400E' };
    case 'shortlisted':
    case 'employer_requested':
    case 'pending_negotiation':
      return { bg: '#CCFBF1', text: '#0F766E' };
    case 'employer_confirmed':
      return { bg: '#DBEAFE', text: '#1D4ED8' };
    case 'accepted':
    case 'hired':
    case 'completed':
      return { bg: '#DCFCE7', text: '#166534' };
    case 'withdrawn':
      return { bg: '#FFEDD5', text: '#9A3412' };
    case 'rejected':
      return { bg: '#FEE2E2', text: '#991B1B' };
    default:
      return { bg: '#F1F5F9', text: '#475569' };
  }
};

export type ThemeColors = typeof colors;
