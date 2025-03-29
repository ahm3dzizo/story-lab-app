import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { FormField } from '@/app/features/shared/components/forms/FormField';
import { SelectField } from '@/app/features/shared/components/forms/SelectField';
import { DatePickerInput } from '@/app/features/shared/components/forms/DatePickerInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SalaryManagementFormProps {
  employeeId: number;
  onSubmit: (data: {
    amount: number;
    payment_date: string;
    payment_type: string;
    description?: string;
  }) => Promise<void>;
  onClose?: () => void;
  initialData?: {
    amount: number;
    payment_date: string;
    payment_type: string;
    description?: string;
  };
}

interface FormData {
  amount: string;
  payment_date: string;
  payment_type: string;
  description: string;
}

interface FormErrors {
  [key: string]: string;
}

const paymentTypes = [
  { label: 'Base Salary', value: 'base_salary' },
  { label: 'Bonus', value: 'bonus' },
  { label: 'Commission', value: 'commission' },
  { label: 'Overtime', value: 'overtime' },
  { label: 'Allowance', value: 'allowance' },
  { label: 'Deduction', value: 'deduction' },
];

export const SalaryManagementForm: React.FC<SalaryManagementFormProps> = ({
  onSubmit,
  onClose,
  initialData,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<FormData>({
    amount: initialData?.amount.toString() || '',
    payment_date: initialData?.payment_date || new Date().toISOString().split('T')[0],
    payment_type: initialData?.payment_type || 'base_salary',
    description: initialData?.description || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Add effect to update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        amount: initialData.amount.toString(),
        payment_date: initialData.payment_date,
        payment_type: initialData.payment_type,
        description: initialData.description || '',
      }));
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.amount) newErrors.amount = 'Amount is required';
    if (!formData.payment_date) newErrors.payment_date = 'Payment date is required';
    if (!formData.payment_type) newErrors.payment_type = 'Payment type is required';

    // Validate amount format
    if (formData.amount && !/^\d+(\.\d{0,2})?$/.test(formData.amount)) {
      newErrors.amount = 'Please enter a valid amount (up to 2 decimal places)';
    }

    // Validate date format
    if (formData.payment_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.payment_date)) {
      newErrors.payment_date = 'Please use YYYY-MM-DD format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_type: formData.payment_type,
        description: formData.description || undefined,
      });
    }
  };

  const handleChange = (field: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Payment Details</Text>
          <FormField
            label="Amount"
            value={formData.amount}
            onChangeText={handleChange('amount')}
            error={errors.amount}
            required
            placeholder="$0.00"
            keyboardType="decimal-pad"
          />
          <DatePickerInput
            label="Payment Date"
            value={formData.payment_date}
            onChange={handleChange('payment_date')}
            error={errors.payment_date}
            required
          />
          <SelectField
            label="Payment Type"
            value={formData.payment_type}
            onValueChange={handleChange('payment_type')}
            options={paymentTypes}
            required
            error={errors.payment_type}
          />
          <FormField
            label="Description"
            value={formData.description}
            onChangeText={handleChange('description')}
            placeholder="Enter payment description"
            multiline
            numberOfLines={3}
          />
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        {onClose && (
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.actionButton}
          >
            Cancel
          </Button>
        )}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.actionButton}
        >
          Save Payment
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 90, // Add space at the bottom for the fixed buttons
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '500',
  },
  actions: {
    position: 'absolute',
    bottom: 70, // Position above navbar
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 100,
  },
  actionButton: {
    minWidth: 120,
    flex: 1,
    marginHorizontal: 8,
  },
});

export default SalaryManagementForm; 