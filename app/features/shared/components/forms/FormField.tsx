import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { TextInput, Text, useTheme, HelperText } from 'react-native-paper';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  style?: ViewStyle;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  error,
  required = false,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  style,
  editable = true,
  autoCapitalize = 'sentences',
  leftIcon,
}) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666666"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        error={!!error}
        style={[styles.input, !editable && styles.disabledInput, multiline && styles.multilineInput]}
        editable={editable}
        outlineColor={error ? '#dc2626' : '#cbd5e1'}
        activeOutlineColor={error ? '#dc2626' : theme.colors.primary}
        textColor="#000000"
        dense
        autoCapitalize={autoCapitalize}
        left={leftIcon ? <TextInput.Icon icon={leftIcon} /> : undefined}
      />
      {error && <HelperText type="error">{error}</HelperText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    opacity: 0.8,
  },
  multilineInput: {
    minHeight: 100,
  },
  errorText: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
    color: '#dc2626',
  },
});

export default FormField; 