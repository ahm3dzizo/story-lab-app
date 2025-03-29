import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenLayout({ children, style }: ScreenLayoutProps) {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
} 