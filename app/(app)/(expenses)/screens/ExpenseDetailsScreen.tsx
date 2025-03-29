import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type Expense = Database['public']['Tables']['expenses']['Row'];

type ExpenseWithRelations = Expense & {
  category: { name: string } | null;
  employee: { full_name: string } | null;
  status?: 'pending' | 'approved' | 'rejected';
  expense_date: string;
};

interface ExpenseDetailsScreenProps {
  id: string;
}

export function ExpenseDetailsScreen({ id }: ExpenseDetailsScreenProps) {
  const [expense, setExpense] = useState<ExpenseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenseDetails();
  }, [id]);

  const loadExpenseDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(name),
          employee:employees(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setExpense(data);
    } catch (error) {
      console.error('Error loading expense details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Expense not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Expense Details
      </Text>
      
      <View style={styles.section}>
        <Text variant="titleMedium">Description</Text>
        <Text>{expense.description}</Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium">Amount</Text>
        <Text>${expense.amount.toFixed(2)}</Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium">Category</Text>
        <Text>{expense.category?.name}</Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium">Date</Text>
        <Text>{new Date(expense.expense_date).toLocaleDateString()}</Text>
      </View>

      {expense.employee && (
        <View style={styles.section}>
          <Text variant="titleMedium">Submitted By</Text>
          <Text>{expense.employee.full_name}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text variant="titleMedium">Status</Text>
        <Text style={styles.status}>{expense.status || 'pending'}</Text>
      </View>
    </View>
  );
}

export default ExpenseDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 12,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 24,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  status: {
    textTransform: 'capitalize',
  },
}); 