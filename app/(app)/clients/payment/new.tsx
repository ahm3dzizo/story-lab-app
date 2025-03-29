import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { ClientPaymentForm, type PaymentInsert } from './components/PaymentForm';
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

export default function NewPaymentScreen() {
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (clientId && clients.length > 0) {
      const client = clients.find(c => c.id.toString() === clientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [clientId, clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company_name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (paymentData: PaymentInsert) => {
    try {
      // Add payment_month field derived from payment_date
      const paymentDate = new Date(paymentData.payment_date);
      const paymentMonth = String(paymentDate.getMonth() + 1).padStart(2, '0');
      
      const { error } = await supabase.from('client_payments').insert({
        ...paymentData,
        payment_month: paymentMonth
      });
      
      if (error) {
        throw error;
      }
      
      // Navigate back to clients list
      router.replace(routes.app.clients.root);
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading clients...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>New Payment</Text>
        <ClientPaymentForm 
          onSubmit={handleSubmit} 
          clients={clients}
          initialData={selectedClient ? {
            id: -1, // Temporary ID for new payment
            client_id: Number(clientId),
            amount: selectedClient.monthly_subscription,
            payment_date: new Date().toISOString().split('T')[0],
            payment_type: 'subscription',
            description: `Monthly subscription payment for ${selectedClient.company_name}`,
            payment_method: 'bank_transfer'
          } : undefined}
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
  title: {
    marginBottom: 24,
    fontWeight: '600',
  },
}); 