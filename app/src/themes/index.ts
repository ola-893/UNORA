export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  accentHighlight: string;
  border: string;
  borderHover: string;
  cardBg: string;
  navBg: string;
  footerBg: string;
  footerText: string;
  gradient: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
}

export const theme: ThemeColors = {
  bg: '#FAFAFA',
  bgSecondary: '#FFFFFF',
  text: '#111111',
  textSecondary: '#555555',
  textMuted: '#999999',
  accent: '#7C3AED',
  accentSecondary: '#8B5CF6',
  accentHighlight: '#A78BFA',
  border: '#E5E5E5',
  borderHover: '#111111',
  cardBg: '#FFFFFF',
  navBg: 'rgba(250, 250, 250, 0.85)',
  footerBg: '#2D1B69',
  footerText: '#A78BFA',
  gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA, #C084FC)',
  gradientFrom: '#7C3AED',
  gradientVia: '#A78BFA',
  gradientTo: '#C084FC',
};
