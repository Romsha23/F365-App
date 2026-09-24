import { StyleSheet } from 'react-native';
import Colors from './colors';

export const fonts = {
  heading: {
    regular: 'Inter_400Regular' as const,
    medium: 'Inter_500Medium' as const,
    semiBold: 'Inter_600SemiBold' as const,
    bold: 'Inter_700Bold' as const,
  },
  body: {
    regular: 'Inter_400Regular' as const,
    medium: 'Inter_500Medium' as const,
    semiBold: 'Inter_600SemiBold' as const,
    bold: 'Inter_700Bold' as const,
  },
};

export const gradients = {
  header: ['rgba(147, 51, 234, 0.15)', 'rgba(147, 51, 234, 0.1)', 'rgba(147, 51, 234, 0.08)'] as const,
  button: ['#F43F5E', '#9333EA'] as const,
  buttonHover: ['#FB7185', '#A855F7'] as const,
  moonPhase: ['#F5F0FF', '#F5E6FF', '#E8D5F0'] as const,
  textCosmic: ['#F43F5E', '#9333EA', '#C084FC'] as const,
  textRose: ['#F43F5E', '#9333EA'] as const,
  cosmic: ['#F43F5E', '#9333EA'] as const,
  roseGold: ['#F43F5E', '#9333EA'] as const,
  purple: ['#9333EA', '#581C87'] as const,
  teal: ['#22B8A8', '#14b8a6'] as const,
};

export const theme = {
  colors: Colors,
  fonts,
  gradients,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 36,
      fontFamily: fonts.heading.bold,
      color: Colors.foreground,
      letterSpacing: 0.5,
    },
    h2: {
      fontSize: 28,
      fontFamily: fonts.heading.bold,
      color: Colors.foreground,
      letterSpacing: 0.5,
    },
    h3: {
      fontSize: 24,
      fontFamily: fonts.heading.semiBold,
      color: Colors.foreground,
      letterSpacing: 0.4,
    },
    h4: {
      fontSize: 20,
      fontFamily: fonts.heading.medium,
      color: Colors.foreground,
      letterSpacing: 0.3,
    },
    phaseTitle: {
      fontSize: 20,
      fontFamily: fonts.heading.medium,
      color: Colors.foreground,
    },
    dayNumber: {
      fontSize: 36,
      fontFamily: fonts.heading.semiBold,
      color: Colors.foreground,
    },
    body: {
      fontSize: 16,
      fontFamily: fonts.body.regular,
      color: Colors.text,
    },
    bodyMedium: {
      fontSize: 16,
      fontFamily: fonts.body.medium,
      color: Colors.text,
    },
    bodySmall: {
      fontSize: 14,
      fontFamily: fonts.body.regular,
      color: Colors.subtext,
    },
    label: {
      fontSize: 12,
      fontFamily: fonts.body.regular,
      color: Colors.textMuted,
    },
    caption: {
      fontSize: 12,
      fontFamily: fonts.body.regular,
      color: Colors.textMuted,
    },
    button: {
      fontSize: 14,
      fontFamily: fonts.body.medium,
      color: Colors.foreground,
    },
  },
  shadows: {
    small: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 5,
    },
    large: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
    },
    glow: {
      shadowColor: Colors.moonLight,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 40,
      elevation: 4,
    },
  },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...theme.shadows.small,
  },
  glassCard: {
    backgroundColor: Colors.glass,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(184, 86, 214, 0.5)',
    ...theme.shadows.medium,
  },
  gradientCard: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(184, 86, 214, 0.6)',
    overflow: 'hidden' as const,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  moonCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.moonLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  cycleBar: {
    width: 8,
    height: 32,
    borderRadius: 4,
    backgroundColor: Colors.muted,
  },
  cycleBarPrimary: {
    backgroundColor: Colors.primary,
  },
  cycleBarAccent: {
    backgroundColor: Colors.accent,
  },
  cycleBarSecondary: {
    backgroundColor: Colors.secondary,
  },
  primaryButton: {
    borderRadius: theme.borderRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
});