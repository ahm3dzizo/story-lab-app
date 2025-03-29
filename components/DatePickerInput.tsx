import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, HelperText, Portal, Modal, Surface, Button, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DatePickerInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  error,
  required,
}) => {
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (value) {
      return new Date(value);
    }
    return new Date();
  });

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  // Generate years, months and days arrays for picker
  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return { label: year.toString(), value: year };
  });
  
  const months = [
    { label: 'January', value: 0 },
    { label: 'February', value: 1 },
    { label: 'March', value: 2 },
    { label: 'April', value: 3 },
    { label: 'May', value: 4 },
    { label: 'June', value: 5 },
    { label: 'July', value: 6 },
    { label: 'August', value: 7 },
    { label: 'September', value: 8 },
    { label: 'October', value: 9 },
    { label: 'November', value: 10 },
    { label: 'December', value: 11 },
  ];

  // Generate days based on selected month and year
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }, 
    (_, i) => ({ label: (i + 1).toString(), value: i + 1 })
  );

  // Date picker methods
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = () => {
    // Format date as YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split('T')[0];
    onChange(formattedDate);
    hideDatePicker();
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(month);
    
    // Make sure we don't end up with invalid dates (e.g., Feb 30)
    const daysInNewMonth = getDaysInMonth(newDate.getFullYear(), month);
    if (newDate.getDate() > daysInNewMonth) {
      newDate.setDate(daysInNewMonth);
    }
    
    setSelectedDate(newDate);
  };

  const handleDayChange = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={required ? `${label} *` : label}
        value={value ? formatDate(value) : ""}
        onFocus={showDatePicker}
        error={!!error}
        right={<TextInput.Icon icon="calendar" onPress={showDatePicker} />}
      />
      {error && <HelperText type="error">{error}</HelperText>}

      {/* Date Picker Modal */}
      <Portal>
        <Modal
          visible={datePickerVisible}
          onDismiss={hideDatePicker}
          contentContainerStyle={styles.modalContent}
        >
          <Surface style={styles.modalSurface}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={styles.modalTitle}>Select Date</Text>
              <Button 
                mode="text" 
                onPress={hideDatePicker}
                icon="close"
                textColor="#ffffff"
              >
                Close
              </Button>
            </View>
            
            <View style={styles.datePickerContainer}>
              {/* Year Picker */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Year</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {years.map(year => (
                    <TouchableOpacity
                      key={year.value}
                      style={[
                        styles.datePickerItem,
                        selectedDate.getFullYear() === year.value && styles.datePickerItemSelected
                      ]}
                      onPress={() => handleYearChange(year.value)}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedDate.getFullYear() === year.value && styles.datePickerItemTextSelected
                      ]}>
                        {year.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Month Picker */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Month</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {months.map(month => (
                    <TouchableOpacity
                      key={month.value}
                      style={[
                        styles.datePickerItem,
                        selectedDate.getMonth() === month.value && styles.datePickerItemSelected
                      ]}
                      onPress={() => handleMonthChange(month.value)}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedDate.getMonth() === month.value && styles.datePickerItemTextSelected
                      ]}>
                        {month.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Day Picker */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Day</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {days.map(day => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.datePickerItem,
                        selectedDate.getDate() === day.value && styles.datePickerItemSelected
                      ]}
                      onPress={() => handleDayChange(day.value)}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedDate.getDate() === day.value && styles.datePickerItemTextSelected
                      ]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <Button
                mode="contained"
                onPress={handleDateConfirm}
                style={styles.confirmButton}
              >
                Confirm
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
    color: "#000000",
  },
  modalContent: {
    margin: 20,
    maxHeight: '80%',
  },
  modalSurface: {
    borderRadius: 16,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  datePickerContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  datePickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  datePickerLabel: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
    color: '#ffffff',
  },
  datePickerScroll: {
    maxHeight: 200,
  },
  datePickerItem: {
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  datePickerItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
  },
  datePickerItemText: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  datePickerItemTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'center',
  },
  confirmButton: {
    minWidth: 120,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
});

// Add default export for Expo Router compatibility
export default DatePickerInput; 