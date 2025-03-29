import { useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme } from './useColorScheme';

type ThemePreference = 'system' | ColorScheme;
const THEME_PREFERENCE_KEY = '@theme_preference';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const systemColorScheme = useNativeColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasHydrated(true);
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

  const colorScheme: ColorScheme = !hasHydrated 
    ? 'light'
    : themePreference === 'system'
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
