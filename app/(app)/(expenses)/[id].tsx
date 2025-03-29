import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Text, Card, Button, Divider, useTheme, IconButton, Surface } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface Expense {
  id: number;
  description: string;
  amount: number;
  category_id: number;
  expense_date: string;
  partner_id: number | null;
  notes?: string;
  created_at: string;
  partner?: {
    id: number;
    full_name: string;
  };
  category?: {
    id: number;
    name: string;
    icon?: string;
  };
}

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const theme = useTheme();
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchExpenseDetails(Number(id));
    }
  }, [id]);

  const fetchExpenseDetails = async (expenseId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*, partner:partner-id (*), category:category_id (*)')
        .eq('id', expenseId)
        .single();

      if (error) throw error;
      
      // TypeScript needs help to understand this is an Expense
      setExpense(data as unknown as Expense);
    } catch (error) {
      console.error('Error fetching expense details:', error);
      Alert.alert('Error', 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMMM d, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  const handleEditExpense = () => {
    router.push({
      pathname: "/(app)/(expenses)",
      params: { id: expense?.id.toString() },
    });
  };

  const handleDeleteExpense = async () => {
    if (!expense) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expense.id);

              if (error) throw error;
              Alert.alert('Success', 'Expense deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading expense details...</Text>
        </View>
      </AppLayout>
    );
  }

  if (!expense) {
    return (
      <AppLayout>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert" size={40} color={theme.colors.error} />
          <Text style={styles.errorText}>Expense not found</Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView style={styles.container}>
        <Surface style={styles.amountCard} elevation={2}>
          <View style={styles.amountContent}>
            <View style={styles.amountLeftContent}>
              <Text variant="labelLarge" style={styles.amountLabel}>
                TOTAL AMOUNT
              </Text>
              <Text variant="headlineLarge" style={styles.amountValue}>
                {formatCurrency(expense.amount)}
              </Text>
            </View>
            
            <View style={styles.actionButtons}>
              <IconButton
                icon="pencil-outline"
                mode="contained"
                size={20}
                onPress={handleEditExpense}
                style={styles.editButton}
              />
              <IconButton
                icon="trash-can-outline"
                mode="contained"
                size={20}
                onPress={handleDeleteExpense}
                iconColor={theme.colors.error}
                containerColor={theme.colors.errorContainer}
                style={styles.deleteButton}
              />
            </View>
          </View>
        </Surface>

        <Card style={styles.detailCard} elevation={1}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.headerSection}>
              <Text variant="titleLarge" style={styles.title}>
                {expense.description}
              </Text>
              <View style={styles.dateContainer}>
                <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.primary} />
                <Text style={styles.dateText}>{formatDate(expense.expense_date)}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <MaterialCommunityIcons
                      name={(expense.category?.icon || 'shape-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Category</Text>
                    <Text style={styles.infoValue}>
                      {expense.category?.name || 'Uncategorized'}
                    </Text>
                  </View>
                </View>

                {expense.partner && (
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <MaterialCommunityIcons
                        name="account"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Partner</Text>
                      <Text style={styles.infoValue}>
                        {expense.partner.full_name}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {expense.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Surface style={styles.notesSurface}>
                    <Text style={styles.notesText}>{expense.notes}</Text>
                  </Surface>
                </View>
              )}
            </View>

            <View style={styles.metaInfo}>
              <Text variant="bodySmall" style={styles.metaText}>
                Created {formatDate(expense.created_at)}
              </Text>
              <Text variant="bodySmall" style={styles.metaText}>
                ID: {expense.id}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonsContainer}>
          <Button 
            mode="outlined" 
            onPress={() => router.back()} 
            icon="arrow-left" 
            style={styles.backButton}
          >
            Back to Expenses
          </Button>
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginVertical: 20,
  },
  amountCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  amountContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  amountLeftContent: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
    opacity: 0.7,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editButton: {
    margin: 0,
  },
  deleteButton: {
    margin: 0,
  },
  detailCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 4,
  },
  headerSection: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    marginLeft: 6,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  infoSection: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 150,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  notesSurface: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaInfo: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  metaText: {
    opacity: 0.6,
    marginBottom: 4,
  },
  buttonsContainer: {
    marginTop: 8,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  backButton: {
    borderRadius: 10,
  },
}); 