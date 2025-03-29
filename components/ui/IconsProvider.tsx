import React, { useEffect, useState, ReactNode } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { emergencyIconFix } from '@/lib/utils/IconsSupport';
import { useTheme } from 'react-native-paper';

interface IconsProviderProps {
  children: ReactNode;
}

/**
 * A wrapper component that ensures all icon fonts are loaded before rendering children
 * This helps prevent missing icons in React Native Paper components
 */
export const IconsProvider = ({ children }: IconsProviderProps) => {
  const [iconsReady, setIconsReady] = useState(false);
  const theme = useTheme();
  
  useEffect(() => {
    // Apply emergency icon fix immediately at component mount
    emergencyIconFix()
      .then(() => {
        console.log('IconsProvider: Icons successfully loaded');
        setIconsReady(true);
      })
      .catch(error => {
        console.error('IconsProvider: Failed to load icons:', error);
        // Continue anyway
        setIconsReady(true);
      });
  }, []);

  if (!iconsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.onSurface }}>Loading icons...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

export default IconsProvider; 