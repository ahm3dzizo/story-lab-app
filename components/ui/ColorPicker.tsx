import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ColorPicker as RNColorPicker, fromHsv } from 'react-native-color-picker';
import { withAlpha } from '@/lib/theme/colors';

interface ColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

export function ColorPicker({ color, onColorChange, disabled }: ColorPickerProps) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      opacity: disabled ? 0.5 : 1,
    },
    colorPreview: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.colors.outline,
    },
    colorValue: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.onSurface,
      fontFamily: theme.fonts.bodyMedium.fontFamily,
    },
    modalContent: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      color: theme.colors.onSurface,
      fontFamily: theme.fonts.titleMedium.fontFamily,
    },
    closeButton: {
      padding: 8,
    },
    pickerContainer: {
      flex: 1,
      marginBottom: 24,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: withAlpha(theme.colors.background, 0.5),
    },
  });

  return (
    <View>
      <TouchableOpacity
        style={styles.container}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <View style={[styles.colorPreview, { backgroundColor: color }]} />
        <Text style={styles.colorValue}>{color.toUpperCase()}</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        transparent
      >
        <Pressable 
          style={styles.overlay} 
          onPress={() => setModalVisible(false)}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pick a Color</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <RNColorPicker
              color={color}
              onColorChange={(color) => {
                const hexColor = fromHsv(color);
                onColorChange(hexColor);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
} 