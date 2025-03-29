import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Surface, Portal, Modal, ActivityIndicator, useTheme, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpenseEntryForm } from '../components/forms/ExpenseEntryForm';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';

type Expense = {
  id: number;
  description: string;
  amount: number;
  category_id: number;
  expense_date: string;
  partner_id: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
    description: string;
  };
  partner?: {
    id: number;
    full_name: string;
    email: string;
  };
};

export const ExpenseProfileScreen: React.FC = () => {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const theme = useTheme();

  const loadExpense = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(id, name, description)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Expense not found');
      
      setExpense(data);
    } catch (error: any) {
      console.error('Error loading expense:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpense();
  }, [id]);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      router.back();
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense. Please try again.');
    }
  };

  const handleUpdate = async (data: Partial<Expense>) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setIsEditing(false);
      loadExpense();
    } catch (error) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', 'Failed to update expense. Please try again.');
    }
  };

  const getCategoryIcon = (categoryName: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    const icons: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap } = {
      'office_supplies': 'office-building',
      'equipment': 'desktop-classic',
      'travel': 'airplane',
      'marketing': 'bullhorn',
      'software': 'laptop',
      'utilities': 'lightning-bolt',
      'rent': 'home',
      'other': 'dots-horizontal',
    };
    return icons[categoryName] || 'cash';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !expense) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || 'Expense not found'}</Text>
        <Button mode="contained" onPress={loadExpense} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <AppLayout>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Surface style={styles.header} elevation={0}>
            <View style={styles.headerTop}>
              <View style={styles.categoryIcon}>
                <MaterialCommunityIcons 
                  name={getCategoryIcon(expense.category?.name || 'other')}
                  size={32}
                  color="#fff"
                />
              </View>
              <Text variant="headlineMedium" style={styles.title}>
                Expense Details
              </Text>
            </View>

            <View style={styles.headerActions}>
              <Button
                mode="outlined"
                onPress={() => setIsEditing(true)}
                icon="pencil"
                style={styles.actionButton}
                textColor="#fff"
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowDeleteDialog(true)}
                icon="trash-can-outline"
                style={styles.actionButton}
                textColor="#ef4444"
              >
                Delete
              </Button>
            </View>
          </Surface>

          <Surface style={styles.card} elevation={0}>
            <View style={styles.amountSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Amount</Text>
              <Text variant="headlineLarge" style={styles.amount}>
                ${expense.amount.toLocaleString()}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailsSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{expense.description}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category</Text>
                <View style={styles.categoryBadge}>
                  <MaterialCommunityIcons 
                    name={getCategoryIcon(expense.category?.name || 'other')}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.categoryText}>
                    {expense.category?.name || 'Uncategorized'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(expense.expense_date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.partnerSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Partner Information</Text>
              
              {expense.partner ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>{expense.partner.full_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{expense.partner.email}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.noPartnerText}>No partner assigned</Text>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.metadataSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Metadata</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {new Date(expense.created_at).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated</Text>
                <Text style={styles.detailValue}>
                  {new Date(expense.updated_at).toLocaleString()}
                </Text>
              </View>
            </View>
          </Surface>
        </ScrollView>

        <Portal>
          <Modal
            visible={isEditing}
            onDismiss={() => setIsEditing(false)}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text variant="titleLarge">Edit Expense</Text>
              <Button
                mode="text"
                onPress={() => setIsEditing(false)}
                icon="close"
              >
                Close
              </Button>
            </View>
            <ExpenseEntryForm
              onSubmit={handleUpdate}
              initialData={expense}
            />
          </Modal>

          <Modal
            visible={showDeleteDialog}
            onDismiss={() => setShowDeleteDialog(false)}
            contentContainerStyle={styles.deleteDialog}
          >
            <Text variant="titleLarge" style={styles.deleteTitle}>Delete Expense</Text>
            <Text style={styles.deleteMessage}>
              Are you sure you want to delete this expense? This action cannot be undone.
            </Text>
            <View style={styles.deleteActions}>
              <Button
                mode="outlined"
                onPress={() => setShowDeleteDialog(false)}
                style={styles.deleteButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleDelete}
                style={styles.deleteButton}
                buttonColor="#ef4444"
              >
                Delete
              </Button>
            </View>
          </Modal>
        </Portal>
      </SafeAreaView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  card: {
    margin: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  amountSection: {
    padding: 20,
    alignItems: 'center',
  },
  amount: {
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 8,
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    marginBottom: 16,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
  },
  partnerSection: {
    padding: 20,
  },
  noPartnerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  metadataSection: {
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  deleteDialog: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 8,
  },
  deleteTitle: {
    marginBottom: 12,
  },
  deleteMessage: {
    marginBottom: 24,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  deleteButton: {
    minWidth: 100,
  },
  retryButton: {
    marginTop: 16,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
  },
});

export default ExpenseProfileScreen; 