import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FormField } from '@/app/features/shared/components/forms/FormField';
import { SelectField } from '@/app/features/shared/components/forms/SelectField';
import { DatePickerInput } from '@/app/features/shared/components/forms/DatePickerInput';
import { Partner, ProfitDistribution } from '@/types/partner.types';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface ProfitDistributionFormProps {
  partners: Partner[];
  onSubmit: (data: ProfitDistribution) => Promise<void>;
  onClose?: () => void;
}

const paymentMethods = [
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Cash', value: 'cash' },
  { label: 'Check', value: 'check' },
  { label: 'Digital Wallet', value: 'digital_wallet' },
];

function ProfitDistributionForm({ partners = [], onSubmit, onClose }: ProfitDistributionFormProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partnerId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.partnerId) {
      newErrors.partnerId = 'Partner is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const distributionData: ProfitDistribution = {
        partner_id: Number(formData.partnerId),
        distribution_amount: Number(formData.amount),
        distribution_date: formData.date,
        payment_method: formData.paymentMethod,
      };
      await onSubmit(distributionData);
    } catch (error) {
      console.error('Error submitting distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Partner Selection Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Partner Selection</Text>
          </View>
          <SelectField
            label="Partner"
            value={formData.partnerId}
            onValueChange={handleChange('partnerId')}
            options={(partners || []).map(p => ({
              label: p.full_name,
              value: p.id.toString(),
            }))}
            required
            error={errors.partnerId}
          />
        </Card.Content>
      </Card>

      {/* Distribution Details Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cash" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Distribution Details</Text>
          </View>
          <FormField
            label="Amount"
            value={formData.amount}
            onChangeText={handleChange('amount')}
            error={errors.amount}
            required
            placeholder="Enter amount"
            keyboardType="decimal-pad"
            leftIcon="currency-usd"
          />
          <DatePickerInput
            label="Date"
            value={formData.date}
            onChange={handleChange('date')}
            error={errors.date}
            required
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

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
        >
          Record Distribution
        </Button>
        {onClose && (
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

export function DistributionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active partners from the database
      const { data, error } = await supabase
        .from('partners')
        .select(`
          id,
          full_name,
          email,
          status,
          join_date,
          shares_percentage,
          phone_number,
          specialization
        `)
        .eq('status', 'active');

      if (error) throw error;

      // Sort partners by name for better UX
      const sortedPartners = (data || []).sort((a, b) => 
        a.full_name.localeCompare(b.full_name)
      );
      
      setPartners(sortedPartners);
    } catch (err) {
      console.error('Error loading partners:', err);
      setError(err instanceof Error ? err.message : 'Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handleDistributionSubmit = async (distributionData: ProfitDistribution) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('partner_profit_distributions')
        .insert(distributionData);

      if (error) throw error;

      // Navigate back to partners screen on success
      router.replace('/(app)/(partners)');
    } catch (err) {
      console.error('Error recording distribution:', err);
      setError(err instanceof Error ? err.message : 'Failed to record distribution');
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading && partners.length === 0) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.statusText}>Loading partners...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadPartners} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      );
    }

    if (partners.length === 0) {
      return (
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="account-alert" size={48} color={theme.colors.primary} />
          <Text style={styles.statusText}>No active partners found</Text>
          <Button mode="contained" onPress={() => router.push('/(app)/(partners)/new')} style={styles.actionButton}>
            Add Partner
          </Button>
        </View>
      );
    }

    return (
      <ProfitDistributionForm 
        partners={partners} 
        onSubmit={handleDistributionSubmit} 
        onClose={() => router.back()}
      />
    );
  };

  return (
    <AppLayout>
      <View style={styles.screenContainer}>
        <View style={styles.headerContainer}>
          <Text variant="headlineMedium" style={styles.pageTitle}>
            Profit Distribution
          </Text>
          <Text variant="bodyMedium" style={styles.pageSubtitle}>
            Record profit distributions to partners
          </Text>
        </View>
        {renderContent()}
      </View>
    </AppLayout>
  );
}

export { ProfitDistributionForm };
export default DistributionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  screenContainer: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    marginBottom: 24,
  },
  pageTitle: {
    fontWeight: '600',
  },
  pageSubtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
    paddingBottom: 60,
  },
  submitButton: {
    flex: 1,
    maxWidth: 160,
  },
  cancelButton: {
    flex: 1,
    maxWidth: 160,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  actionButton: {
    marginTop: 16,
  }
}); 