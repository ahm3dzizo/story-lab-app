import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text } from 'react-native';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { shadows } from '../../lib/theme/tailwind';
import type { Theme } from '../../lib/theme/types';

interface StyledInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export function StyledInput({
  label,
  error,
  containerStyle,
  style,
  ...props
}: StyledInputProps) {
  const { theme } = useTheme();
  const currentStyles = styles(theme);
  return (
    <View style={[currentStyles.container, containerStyle]}>
      {label && (
        <Text style={currentStyles.label}>{label}</Text>
      )}
      <View style={[
        currentStyles.inputContainer,
        error ? currentStyles.errorBorder : currentStyles.normalBorder,
        shadows.small
      ]}>
        <TextInput
          style={[currentStyles.input, style]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          {...props}
        />
      </View>
      {error && (
        <Text style={currentStyles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
    overflow: 'hidden',
  },
  input: {
    fontSize: 16,
    color: theme.colors.onSurface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  normalBorder: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  error: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: 4,
  },
});

export default StyledInput;