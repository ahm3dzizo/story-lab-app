import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Text, HelperText, Portal, Modal, Button, useTheme, Surface, Divider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MaterialCommunityIcons as IconType } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface SelectOption {
  label: string;
  value: string;
  id?: number;
  icon?: string;
  description?: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  loading?: boolean;
  leftIcon?: keyof typeof IconType.glyphMap;
  searchable?: boolean;
  multiple?: boolean;
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onValueChange,
  options,
  error,
  required,
  loading,
  leftIcon,
  searchable = true,
  multiple = false,
  placeholder,
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(value ? [value] : []);

  const selectedOption = options.find(option => option.value === value);
  
  const filteredOptions = searchQuery
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = useCallback((optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      setSelectedValues(newValues);
      onValueChange(newValues.join(','));
    } else {
      onValueChange(optionValue);
      setModalVisible(false);
    }
  }, [multiple, selectedValues, onValueChange]);

  const handleDone = useCallback(() => {
    if (multiple) {
      onValueChange(selectedValues.join(','));
    }
    setModalVisible(false);
  }, [multiple, selectedValues, onValueChange]);

  const renderOption = useCallback((option: SelectOption) => (
    <TouchableOpacity
      key={option.id || option.value}
      style={[
        styles.option,
        (multiple ? selectedValues.includes(option.value) : option.value === value) && 
        styles.selectedOption
      ]}
      onPress={() => handleSelect(option.value)}
      activeOpacity={0.7}
    >
      <View style={styles.optionContent}>
        {option.icon && (
          <MaterialCommunityIcons
            name={option.icon as any}
            size={24}
            color={theme.colors.primary}
            style={styles.optionIcon}
          />
        )}
        <View style={styles.optionText}>
          <Text style={[
            styles.optionLabel,
            (multiple ? selectedValues.includes(option.value) : option.value === value) && 
            styles.selectedOptionText
          ]}>
            {option.label}
          </Text>
          {option.description && (
            <Text style={styles.optionDescription}>{option.description}</Text>
          )}
        </View>
      </View>
      {(multiple ? selectedValues.includes(option.value) : option.value === value) && (
        <MaterialCommunityIcons
          name={multiple ? "checkbox-marked" : "check"}
          size={24}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  ), [value, selectedValues, multiple, theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        style={[
          styles.selectButton,
          error && styles.errorBorder,
          { borderColor: error ? theme.colors.error : theme.colors.outline }
        ]}
        disabled={loading}
      >
        {leftIcon && (
          <MaterialCommunityIcons
            name={leftIcon}
            size={20}
            color="#000000"
            style={styles.leftIcon}
          />
        )}
        <Text style={[
          styles.selectedText,
          !selectedOption && styles.placeholderText,
          leftIcon && styles.textWithIcon
        ]}>
          {loading ? "Loading..." : selectedOption?.label || placeholder || `Select ${label}`}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={24}
          color="#000000"
        />
      </TouchableOpacity>
      {error && <HelperText type="error">{error}</HelperText>}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Surface style={styles.modalSurface}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={styles.modalTitle}>{label}</Text>
              <IconButton
                icon="close"
                onPress={() => setModalVisible(false)}
              />
            </View>
            
            {searchable && (
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder="Search..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <ScrollView style={styles.optionsList}>
              {filteredOptions.map(renderOption)}
            </ScrollView>

            {multiple && (
              <View style={styles.modalFooter}>
                <Button
                  mode="contained"
                  onPress={handleDone}
                  style={styles.doneButton}
                >
                  Done ({selectedValues.length} selected)
                </Button>
              </View>
            )}
          </Surface>
        </Modal>
      </Portal>
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
    marginBottom: 8,
  },
  required: {
    color: '#FF0000',
    fontWeight: '600',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectedText: {
    fontSize: 16,
    flex: 1,
    color: "#000000",
  },
  placeholderText: {
    color: '#666666',
  },
  errorBorder: {
    borderColor: '#dc2626',
  },
  modalContent: {
    margin: 20,
    maxHeight: '80%',
  },
  modalSurface: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    backgroundColor: '#f5f5f5',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  selectedOptionText: {
    color: '#000000',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  doneButton: {
    borderRadius: 8,
  },
  leftIcon: {
    marginRight: 12,
  },
  textWithIcon: {
    marginLeft: 8,
  },
});

export default SelectField; 