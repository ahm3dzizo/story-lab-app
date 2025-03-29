import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Button, Card, Text, useTheme, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FormField } from '@/app/features/shared/components/forms/FormField';
import { SelectField } from '@/app/features/shared/components/forms/SelectField';
import { DatePickerInput } from '@/app/features/shared/components/forms/DatePickerInput';
import { supabase } from '@/lib/supabase';
import { NotificationsService } from '@/lib/services/notifications';
import { useAuth, AuthProvider } from '@/lib/auth/AuthContext';

export type Client = {
  id: number;
  company_name: string;
  manager_name: string;
  phone_number: string | null;
  monthly_subscription: number;
  field_type: string | null;
  status: string;
  address: string | null;
  notes: string | null;
};

export type Payment = {
  id: number;
  client_id: number;
  amount: number;
  payment_date: string;
  payment_type: string;
  description: string | null;
  payment_method: string;
};

export type PaymentInsert = Omit<Payment, 'id'>;

export interface ClientPaymentFormProps {
  onSubmit: (data: PaymentInsert) => Promise<void>;
  clients: Client[];
  initialData?: Payment;
  onClose?: () => void;
  onRefresh?: () => Promise<void>;
}

interface FormData {
  clientId: string;
  amount: string;
  paymentDate: string;
  description: string;
  paymentType: string;
  paymentMethod: string;
}

export const paymentMethods = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Check', value: 'check' },
  { label: 'Mobile Payment', value: 'mobile_payment' },
  { label: 'Other', value: 'other' },
];

export const paymentTypes = [
  { label: 'Monthly Subscription', value: 'subscription' },
  { label: 'One-time Payment', value: 'one_time' },
  { label: 'Additional Service', value: 'additional' },
  { label: 'Invoice Payment', value: 'invoice_payment' },
  { label: 'Advance Payment', value: 'advance_payment' },
  { label: 'Partial Payment', value: 'partial_payment' },
  { label: 'Final Payment', value: 'final_payment' },
  { label: 'Refund', value: 'refund' },
  { label: 'Other', value: 'other' },
];

const PaymentFormContent: React.FC<ClientPaymentFormProps> = ({ onSubmit, clients, initialData, onClose, onRefresh }) => {
  const theme = useTheme();
  const { session } = useAuth();
  const [formData, setFormData] = useState<FormData>(() => ({
    clientId: initialData?.client_id.toString() || '',
    amount: initialData?.amount.toString() || '',
    paymentDate: initialData?.payment_date || new Date().toISOString().split('T')[0],
    description: initialData?.description || '',
    paymentType: initialData?.payment_type || '',
    paymentMethod: initialData?.payment_method || '',
  }));
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (initialData?.client_id) {
      setFormData(prev => ({
        ...prev,
        clientId: initialData.client_id.toString(),
        amount: initialData.amount.toString(),
        paymentDate: initialData.payment_date,
        description: initialData.description || '',
        paymentType: initialData.payment_type,
        paymentMethod: initialData.payment_method
      }));
    }
  }, [initialData]);

  const onRefreshContent = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        setRefreshing(false);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Please select a client';
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    if (!formData.paymentType) {
      newErrors.paymentType = 'Payment type is required';
    }
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        const errorMessages = Object.values(errors).join('\n');
        Alert.alert('Validation Error', errorMessages);
        return;
      }

      setLoading(true);
      const paymentData: PaymentInsert = {
        client_id: parseInt(formData.clientId),
        amount: parseFloat(formData.amount),
        payment_date: formData.paymentDate,
        payment_type: formData.paymentType,
        description: formData.description,
        payment_method: formData.paymentMethod,
      };

      console.log('Submitting payment:', paymentData);
      await onSubmit(paymentData);

      // Create notification for the payment
      if (session?.user?.id) {
        const client = clients.find(c => c.id.toString() === formData.clientId);
        const notificationsService = NotificationsService.getInstance();
        
        const notification = {
          user_id: session.user.id,
          type: 'success',
          title: 'Payment Recorded',
          message: `Payment of ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(parseFloat(formData.amount))} received from ${client?.company_name || 'client'}`,
          source: 'client',
          reference_id: formData.clientId,
          reference_type: 'client_payment',
          is_read: false
        };

        // Insert the notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notification);

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }
      
      // Show success message
      Alert.alert('Success', 'Payment recorded successfully');
      
      // Clear form
      setFormData({
        clientId: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        description: '',
        paymentType: '',
        paymentMethod: '',
      });
      
      // Close form if onClose is provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      Alert.alert(
        'Error',
        'Failed to record payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = clients.map(client => ({
    label: client.company_name,
    value: client.id.toString(),
  }));

  const handleChange = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user changes the value
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefreshContent}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Payment Details Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Payment Details</Text>
          </View>
          <SelectField
            label="Client"
            value={formData.clientId}
            onValueChange={handleChange('clientId')}
            options={clientOptions}
            required
            error={errors.clientId}
          />
          <FormField
            label="Amount"
            value={formData.amount}
            onChangeText={handleChange('amount')}
            error={errors.amount}
            required
            placeholder="Enter payment amount"
            keyboardType="decimal-pad"
            leftIcon="currency-usd"
          />
          
          <DatePickerInput
            label="Payment Date"
            value={formData.paymentDate}
            onChange={(value) => setFormData(prev => ({ ...prev, paymentDate: value }))}
            error={errors.paymentDate}
            required
          />
        </Card.Content>
      </Card>

      {/* Payment Type Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="credit-card-outline" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Payment Method</Text>
          </View>
          <SelectField
            label="Payment Type"
            value={formData.paymentType}
            onValueChange={handleChange('paymentType')}
            options={paymentTypes}
            required
            error={errors.paymentType}
          />
          <SelectField
            label="Payment Method"
            value={formData.paymentMethod}
            onValueChange={handleChange('paymentMethod')}
            options={paymentMethods}
            required
            error={errors.paymentMethod}
          />
        </Card.Content>
      </Card>

      {/* Description Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="text-box-outline" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Description</Text>
          </View>
          <FormField
            label="Payment Description"
            value={formData.description}
            onChangeText={handleChange('description')}
            error={errors.description}
            required
            placeholder="Enter payment description"
            multiline
            numberOfLines={3}
          />
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
          icon="cash-check"
        >
          Record Payment
        </Button>
        {onClose && (
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

export const ClientPaymentForm: React.FC<ClientPaymentFormProps> = (props) => {
  try {
    // Try to use useAuth to check if we're inside AuthProvider
    useAuth();
    // If successful, render content directly
    return <PaymentFormContent {...props} />;
  } catch (error) {
    // If useAuth fails, wrap content with AuthProvider
    return (
      <AuthProvider>
        <PaymentFormContent {...props} />
      </AuthProvider>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 66,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    fontWeight: '600',
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 8,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 8,
  },
}); 