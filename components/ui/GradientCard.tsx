import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';

interface GradientCardProps {
  gradient?: [string, string] | [string, string, ...string[]];
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

export function GradientCard({ gradient, children, style, onPress, disabled }: GradientCardProps) {
  const theme = useTheme();
  const defaultGradient = [theme.colors.surfaceVariant, theme.colors.surface] as [string, string];

  const styles = StyleSheet.create({
    container: {
      overflow: 'hidden',
      opacity: disabled ? 0.5 : 1,
    },
    gradient: {
      padding: 16,
      borderRadius: 12,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <LinearGradient
        colors={gradient || defaultGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default GradientCard; 