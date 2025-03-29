import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface GradientButtonProps {
  onPress: () => void;
  title: string;
  gradient?: [string, string];
  style?: ViewStyle;
  disabled?: boolean;
}

export function GradientButton({ onPress, title, gradient, style, disabled }: GradientButtonProps) {
  const { theme } = useTheme();

  const defaultGradient: [string, string] = [theme.colors.primary, theme.colors.primaryContainer];

  const styles = StyleSheet.create({
    button: {
      borderRadius: 8,
      overflow: 'hidden',
      opacity: disabled ? 0.5 : 1,
    },
    gradient: {
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontFamily: theme.fonts.labelLarge.fontFamily,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradient || defaultGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
} 