import { useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ColorScheme = 'light' | 'dark';
type ThemePreference = 'system' | ColorScheme;

const THEME_PREFERENCE_KEY = '@theme_preference';

export function useColorScheme() {
  const systemColorScheme = useNativeColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedPreference();
  }, []);

  const loadSavedPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
      if (savedPreference) {
        setThemePreference(savedPreference as ThemePreference);
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setColorScheme = async (preference: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
      setThemePreference(preference);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const toggleColorScheme = async () => {
    const currentScheme = colorScheme;
    const newPreference: ThemePreference = currentScheme === 'light' ? 'dark' : 'light';
    await setColorScheme(newPreference);
  };

  const colorScheme: ColorScheme = themePreference === 'system' 
    ? (systemColorScheme ?? 'light')
    : themePreference;

  return {
    colorScheme,
    themePreference,
    isLoading,
    setColorScheme,
    toggleColorScheme,
  };
}
