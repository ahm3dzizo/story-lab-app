import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { ExpenseEntryForm } from './components/forms/ExpenseEntryForm';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { routes } from '@/app/routes';
import { AppLayout } from '@/components/layout/AppLayout';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function NewExpenseScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleSubmit = async (expenseData: any) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();
      
      if (error) throw error;
      router.replace(routes.app.expenses.root);
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  return (
    <AppLayout>
      <View style={styles.header}>
        <MaterialCommunityIcons name="cash-plus" size={24} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={styles.title}>Add New Expense</Text>
      </View>
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.infoContent}>
            <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.infoText}>
              Track your business expenses quickly and easily. Add details, attach receipts, and categorize expenses for better financial management.
            </Text>
          </View>
        </Card.Content>
      </Card>
      <ExpenseEntryForm onSubmit={handleSubmit} />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    marginLeft: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    opacity: 0.7,
  }
}); 