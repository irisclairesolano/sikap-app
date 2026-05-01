export const colors = {
  // Primary palette (Teal)
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#CCFBF1',
  primaryBG: '#F0FDFA',
  
  // Text colors
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  
  // Neutral colors
  border: '#E7E5E4',
  white: '#FFFFFF',
  
  // Status colors
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  star: '#FBBF24',
  
  // Status badge backgrounds
  status: {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    accepted: { bg: '#DCFCE7', text: '#16A34A' },
    completed: { bg: '#DCFCE7', text: '#16A34A' },
    rejected: { bg: '#FEE2E2', text: '#DC2626' },
    withdrawn: { bg: '#FEE2E2', text: '#DC2626' },
    pending_negotiation: { bg: '#CCFBF1', text: '#0D9488' },
    employer_confirmed: { bg: '#CCFBF1', text: '#0D9488' },
  },
} as const;

export type ThemeColors = typeof colors;
