import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import type { CustomTheme } from './types';

const baseSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const baseTypography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 14,
  },
};

export const light: CustomTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.light.primary,
    secondary: Colors.light.secondary,
    tertiary: Colors.light.accent,
    error: Colors.light.error,
    background: Colors.light.background,
    surface: '#F8FAFC',
    surfaceVariant: '#F1F5F9',
    onSurface: Colors.light.text,
    onSurfaceVariant: '#64748B',
    outline: '#CBD5E1',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F8FAFC',
      level3: '#F1F5F9',
      level4: '#E2E8F0',
      level5: '#CBD5E1',
    },
  },
  spacing: baseSpacing,
  typography: baseTypography,
};

export const dark: CustomTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.dark.primary,
    secondary: Colors.dark.secondary,
    tertiary: Colors.dark.accent,
    error: Colors.dark.error,
    background: Colors.dark.background,
    surface: '#1E293B',
    surfaceVariant: '#334155',
    onSurface: Colors.dark.text,
    onSurfaceVariant: '#94A3B8',
    outline: '#475569',
    elevation: {
      level0: 'transparent',
      level1: '#0F172A',
      level2: '#1E293B',
      level3: '#334155',
      level4: '#475569',
      level5: '#64748B',
    },
  },
  spacing: baseSpacing,
  typography: baseTypography,
}; 