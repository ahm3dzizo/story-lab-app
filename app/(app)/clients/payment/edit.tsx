import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { ClientPaymentForm, type PaymentInsert, type Payment } from './components/PaymentForm';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { routes } from '@/app/routes';
import { AppLayout } from '@/components/layout/AppLayout';

type Client = {
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

export default function EditPaymentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadClients(), loadPayment()]);
  }, [id]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company_name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadPayment = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_payments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPayment(data);
    } catch (error) {
      console.error('Error loading payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (paymentData: PaymentInsert) => {
    if (!id) return;
    
    try {
      // Add payment_month field derived from payment_date
      const paymentDate = new Date(paymentData.payment_date);
      const paymentMonth = String(paymentDate.getMonth() + 1).padStart(2, '0');
      
      const { error } = await supabase
        .from('client_payments')
        .update({
          ...paymentData,
          payment_month: paymentMonth
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Navigate back to clients list
      router.replace('/(app)/clients');
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </AppLayout>
    );
  }

  if (!payment) {
    return (
      <AppLayout>
        <View style={[styles.container, styles.loadingContainer]}>
          <Text style={styles.errorText}>Payment not found</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>Edit Payment</Text>
        <ClientPaymentForm 
          onSubmit={handleSubmit} 
          clients={clients}
          initialData={payment}
          onClose={() => router.back()}
        />
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  title: {
    marginBottom: 24,
    fontWeight: '600',
  },
}); 