import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomTheme } from './types';

export type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => Promise<void>;
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => Promise<void>;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => Promise<void>;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => Promise<void>;
  theme: CustomTheme;
}

const FONT_SIZE_KEY = '@font_size_preference';
const COMPACT_MODE_KEY = '@compact_mode_preference';
const REDUCED_MOTION_KEY = '@reduced_motion_preference';
const HIGH_CONTRAST_KEY = '@high_contrast_preference';

const ThemeContext = createContext<ThemeContextType>({
  fontSize: 'medium',
  setFontSize: async () => {},
  compactMode: false,
  setCompactMode: async () => {},
  reducedMotion: false,
  setReducedMotion: async () => {},
  highContrast: false,
  setHighContrast: async () => {},
  theme: {} as CustomTheme,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colorScheme } = useColorScheme();
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [compactMode, setCompactModeState] = useState(false);
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [highContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [
        savedFontSize,
        savedCompactMode,
        savedReducedMotion,
        savedHighContrast
      ] = await Promise.all([
        AsyncStorage.getItem(FONT_SIZE_KEY),
        AsyncStorage.getItem(COMPACT_MODE_KEY),
        AsyncStorage.getItem(REDUCED_MOTION_KEY),
        AsyncStorage.getItem(HIGH_CONTRAST_KEY)
      ]);

      if (savedFontSize) setFontSizeState(savedFontSize as FontSize);
      if (savedCompactMode) setCompactModeState(savedCompactMode === 'true');
      if (savedReducedMotion) setReducedMotionState(savedReducedMotion === 'true');
      if (savedHighContrast) setHighContrastState(savedHighContrast === 'true');
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }
  };

  const setFontSize = async (size: FontSize) => {
    setFontSizeState(size);
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, size);
    } catch (error) {
      console.warn('Failed to save font size preference:', error);
    }
  };

  const setCompactMode = async (enabled: boolean) => {
    setCompactModeState(enabled);
    try {
      await AsyncStorage.setItem(COMPACT_MODE_KEY, enabled.toString());
    } catch (error) {
      console.warn('Failed to save compact mode preference:', error);
    }
  };

  const setReducedMotion = async (enabled: boolean) => {
    setReducedMotionState(enabled);
    try {
      await AsyncStorage.setItem(REDUCED_MOTION_KEY, enabled.toString());
    } catch (error) {
      console.warn('Failed to save reduced motion preference:', error);
    }
  };

  const setHighContrast = async (enabled: boolean) => {
    setHighContrastState(enabled);
    try {
      await AsyncStorage.setItem(HIGH_CONTRAST_KEY, enabled.toString());
    } catch (error) {
      console.warn('Failed to save high contrast preference:', error);
    }
  };

  // Adjust theme based on preferences
  const theme: CustomTheme = {
    ...require('./theme')[colorScheme],
    fonts: {
      ...require('./theme')[colorScheme].fonts,
      // Adjust font sizes based on preference
      bodyLarge: {
        ...require('./theme')[colorScheme].fonts.bodyLarge,
        fontSize: fontSize === 'large' ? 18 : fontSize === 'small' ? 14 : 16,
      },
      bodyMedium: {
        ...require('./theme')[colorScheme].fonts.bodyMedium,
        fontSize: fontSize === 'large' ? 16 : fontSize === 'small' ? 12 : 14,
      },
      bodySmall: {
        ...require('./theme')[colorScheme].fonts.bodySmall,
        fontSize: fontSize === 'large' ? 14 : fontSize === 'small' ? 10 : 12,
      },
    },
    // Adjust spacing based on compact mode
    spacing: {
      ...require('./theme')[colorScheme].spacing,
      small: compactMode ? 4 : 8,
      medium: compactMode ? 8 : 16,
      large: compactMode ? 16 : 24,
    },
  };

  return (
    <ThemeContext.Provider
      value={{
        fontSize,
        setFontSize,
        compactMode,
        setCompactMode,
        reducedMotion,
        setReducedMotion,
        highContrast,
        setHighContrast,
        theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}; 