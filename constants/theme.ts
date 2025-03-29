import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

const baseLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563EB',
    secondary: '#3B82F6',
    tertiary: '#60A5FA',
    error: '#DC2626',
    background: '#FFFFFF',
    surface: '#F8FAFC',
  },
  roundness: 8,
};

const baseDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3B82F6',
    secondary: '#60A5FA',
    tertiary: '#93C5FD',
    error: '#EF4444',
    background: '#0F172A',
    surface: '#1E293B',
  },
  roundness: 8,
};

export const lightTheme = {
  ...baseLightTheme,
  custom: {
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
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
    },
  },
};

export const darkTheme = {
  ...baseDarkTheme,
  custom: lightTheme.custom,
};

export type AppTheme = typeof lightTheme;

declare global {
  namespace ReactNativePaper {
    interface Theme extends AppTheme {}
  }
} 