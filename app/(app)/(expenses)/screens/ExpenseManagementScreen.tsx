import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable, Alert, ScrollView } from 'react-native';
import { Text, Portal, Modal, Button, Surface, ActivityIndicator, Chip, useTheme, Searchbar, Menu, Dialog, Card, Divider, SegmentedButtons, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { routes } from '@/app/routes';
import type { Database } from '@/types/database.types';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { ResponsiveDataTable } from '@/components/tables/ResponsiveDataTable';
import { createResponsiveStyles } from '@/app/styles/responsive';
import { getGridColumns, responsiveSpacing, responsiveFontSize } from '@/app/utils/responsive';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

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

type ActiveForm = 'expense' | 'budget' | null;
type SortField = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

// Expense routes
const EXPENSE_NEW_ROUTE = '/(app)/(expenses)/new';
const EXPENSE_BUDGET_ROUTE = '/(app)/(expenses)/budget';

// Extend the responsive styles with custom styles for this screen
const extendedStyles = (theme: any) => {
  const baseStyles = createResponsiveStyles(theme);
  return {
    ...baseStyles,
    searchContainer: {
      marginBottom: responsiveSpacing(16),
    },
    filterContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: responsiveSpacing(16),
      flexWrap: 'wrap' as const,
      gap: responsiveSpacing(8),
    },
    filterChips: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: responsiveSpacing(8),
    },
    chip: {
      marginRight: responsiveSpacing(8),
      marginBottom: responsiveSpacing(8),
    },
    sortButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    sortText: {
      marginRight: responsiveSpacing(4),
      fontSize: 14,
    },
    expenseCard: {
      marginBottom: responsiveSpacing(12),
      borderRadius: responsiveSpacing(8),
      overflow: 'hidden' as 'hidden',
      backgroundColor: '#0f172a',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    expenseHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    expenseTitle: {
      fontSize: responsiveFontSize(16),
      fontWeight: '600' as const,
    },
    expenseAmount: {
      fontSize: responsiveFontSize(16),
      fontWeight: '600' as const,
    },
    expenseDetails: {
      marginTop: responsiveSpacing(8),
    },
    expenseDate: {
      color: theme.colors.onSurfaceVariant,
      fontSize: responsiveFontSize(14),
    },
    expenseCategory: {
      marginTop: responsiveSpacing(4),
    },
    noExpensesText: {
      textAlign: 'center' as const,
      marginTop: responsiveSpacing(24),
      color: theme.colors.onSurfaceVariant,
    },
    fabContainer: {
      position: 'absolute' as const,
      bottom: responsiveSpacing(16),
      right: responsiveSpacing(16),
      flexDirection: 'row' as const,
      gap: responsiveSpacing(8),
    },
    retryButton: {
      marginTop: responsiveSpacing(8),
    },
    summaryContainer: {
      marginBottom: responsiveSpacing(16),
      flexDirection: 'row' as const,
      gap: 12,
    },
    summaryCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      backgroundColor: '#0f172a',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    summaryInner: {
      alignItems: 'center' as const,
      gap: 8,
    },
    summaryTitle: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center' as const,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: '#fff',
      textAlign: 'center' as const,
    },
    periodSelector: {
      marginBottom: responsiveSpacing(16),
    },
    categoryBadge: {
      borderRadius: responsiveSpacing(4),
      paddingHorizontal: responsiveSpacing(8),
      paddingVertical: responsiveSpacing(2),
      alignSelf: 'flex-start' as const,
    },
    categoryText: {
      fontSize: responsiveFontSize(12),
      fontWeight: '500' as const,
    },
    expenseCardContent: {
      padding: responsiveSpacing(12),
    },
    expenseActions: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
      marginTop: responsiveSpacing(8),
    },
    deleteDialog: {
      borderRadius: responsiveSpacing(12),
    },
    deleteDialogContent: {
      paddingVertical: responsiveSpacing(8),
    },
    deleteDialogActions: {
      paddingHorizontal: responsiveSpacing(16),
      paddingBottom: responsiveSpacing(16),
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center' as 'center',
      alignItems: 'center' as 'center',
      padding: responsiveSpacing(16),
    },
  };
};

// New type for time period selection
type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

export const ExpenseManagementScreen: React.FC = () => {
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const { form } = useLocalSearchParams();
  const router = useRouter();
  
  // Get the theme for responsive styles
  const theme = useTheme();
  const responsiveStyles = extendedStyles(theme);
  const gridColumns = getGridColumns();

  useEffect(() => {
    if (form === 'budget') {
      setActiveForm('budget');
    }
    loadExpenses();
  }, [form]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(id, name, description)
        `)
        .order('expense_date', { ascending: false });

      if (fetchError) throw fetchError;
      setExpenses(data || []);
      setFilteredExpenses(data || []);
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!expenses.length) {
      return {
        total: 0,
        average: 0,
        count: 0,
        categories: {}
      };
    }

    // Get date range based on selected time period
    let startDate = new Date();
    switch (timePeriod) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = startOfMonth(new Date());
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Filter expenses by date
    const periodExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate >= startDate;
    });

    // Calculate statistics
    const total = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const average = periodExpenses.length ? total / periodExpenses.length : 0;
    
    // Group by category
    const categories: Record<string, number> = {};
    periodExpenses.forEach(expense => {
      const categoryName = expense.category?.name || 'uncategorized';
      categories[categoryName] = (categories[categoryName] || 0) + expense.amount;
    });

    return {
      total,
      average,
      count: periodExpenses.length,
      categories
    };
  }, [expenses, timePeriod]);

  const filterAndSortExpenses = () => {
    let filtered = [...expenses];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.description?.toLowerCase().includes(query) ||
        expense.category?.name?.toLowerCase().includes(query) ||
        expense.amount.toString().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter.length > 0) {
      filtered = filtered.filter(expense => 
        expense.category && categoryFilter.includes(expense.category.name)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
          break;
        case 'amount':
          comparison = b.amount - a.amount;
          break;
        case 'category':
          comparison = (a.category?.name || '').localeCompare(b.category?.name || '');
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    setFilteredExpenses(filtered);
  };

  useEffect(() => {
    filterAndSortExpenses();
  }, [searchQuery, expenses, sortField, sortOrder, categoryFilter]);

  const handleSubmit = async (expenseData: any) => {
    try {
      const { error } = await supabase.from('expenses').insert(expenseData);
      
      if (error) {
        console.error('Error creating expense:', error);
        throw error;
      }
      
      setActiveForm(null);
      loadExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      Alert.alert('Error', 'Failed to create expense. Please try again.');
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

  const confirmDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogVisible(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseToDelete.id);

      if (error) throw error;

      setDeleteDialogVisible(false);
      setExpenseToDelete(null);
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense. Please try again.');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    router.push(`/(app)/(expenses)/${expense.id}`);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
    setSortField(field);
      setSortOrder('desc');
    }
    setShowSortMenu(false);
  };

  const toggleCategoryFilter = (category: string) => {
    setCategoryFilter(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getCategoryColor = (categoryName: string): string => {
    const colors: { [key: string]: string } = {
      'office_supplies': '#4CAF50',
      'equipment': '#2196F3',
      'travel': '#FF9800',
      'marketing': '#E91E63',
      'software': '#9C27B0',
      'utilities': '#FFC107',
      'rent': '#795548',
      'other': '#607D8B',
    };
    return colors[categoryName] || '#9E9E9E';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <Pressable
      style={({ pressed }) => [
        responsiveStyles.expenseCard,
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
      ]}
      onPress={() => handleEditExpense(item)}
    >
      <View style={responsiveStyles.expenseCardContent}>
        <View style={responsiveStyles.expenseHeader}>
          <Text style={responsiveStyles.expenseTitle} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={responsiveStyles.expenseAmount}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
        
        <View style={responsiveStyles.expenseDetails}>
          <Text style={responsiveStyles.expenseDate}>
            {formatDate(item.expense_date)}
          </Text>
          
          {item.category && (
            <View 
              style={[
                responsiveStyles.categoryBadge, 
                { backgroundColor: getCategoryColor(item.category.name) + '20' }
              ]}
            >
              <Text 
                style={[
                  responsiveStyles.categoryText, 
                  { color: getCategoryColor(item.category.name) }
                ]}
              >
                {item.category.name.replace('_', ' ')}
              </Text>
            </View>
          )}
        </View>

        <View style={responsiveStyles.expenseActions}>
          <Button 
            mode="outlined"
            onPress={(e) => {
              e.stopPropagation();
              handleEditExpense(item);
            }}
            icon="pencil"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)', marginRight: 8 }}
            contentStyle={{ height: 36 }}
            labelStyle={{ fontSize: 13, color: '#fff' }}
          >
            Edit
          </Button>
          <Button 
            mode="outlined"
            onPress={(e) => {
              e.stopPropagation();
              confirmDeleteExpense(item);
            }}
            textColor={theme.colors.error}
            icon="delete"
            style={{ borderColor: theme.colors.error + '40' }}
            contentStyle={{ height: 36 }}
            labelStyle={{ fontSize: 13 }}
          >
            Delete
          </Button>
        </View>
      </View>
    </Pressable>
  );

  const renderContent = () => {
  if (loading) {
    return (
        <View style={responsiveStyles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: responsiveSpacing(16) }}>Loading expenses...</Text>
      </View>
    );
  }

  if (error) {
    return (
        <View style={responsiveStyles.centerContainer}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={loadExpenses} 
            style={responsiveStyles.retryButton}
          >
            Retry
          </Button>
      </View>
    );
  }

    return (
      <ScrollView>
        {/* Summary Section */}
        <View style={responsiveStyles.summaryContainer}>
          <Surface style={responsiveStyles.summaryCard}>
            <View style={responsiveStyles.summaryInner}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#22c55e" />
              <Text style={responsiveStyles.summaryTitle}>Total Expenses</Text>
              <Text style={responsiveStyles.summaryValue}>
                {formatCurrency(summary.total)}
              </Text>
            </View>
          </Surface>
          
          <Surface style={responsiveStyles.summaryCard}>
            <View style={responsiveStyles.summaryInner}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={24} color="#3b82f6" />
              <Text style={responsiveStyles.summaryTitle}>Average</Text>
              <Text style={responsiveStyles.summaryValue}>
                {formatCurrency(summary.average)}
              </Text>
            </View>
          </Surface>
          
          <Surface style={responsiveStyles.summaryCard}>
            <View style={responsiveStyles.summaryInner}>
              <MaterialCommunityIcons name="file-document-multiple" size={24} color="#8b5cf6" />
              <Text style={responsiveStyles.summaryTitle}>Total Count</Text>
              <Text style={responsiveStyles.summaryValue}>
                {summary.count}
              </Text>
            </View>
          </Surface>
        </View>

        {/* Search and Filter Section */}
        <View style={responsiveStyles.searchContainer}>
          <Searchbar
            placeholder="Search expenses..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={{ borderRadius: responsiveSpacing(8) }}
          />
        </View>

        <View style={responsiveStyles.filterContainer}>
          <View style={responsiveStyles.filterChips}>
            {expenses
              .reduce((categories: string[], expense) => {
                if (expense.category && !categories.includes(expense.category.name)) {
                  categories.push(expense.category.name);
                }
                return categories;
              }, [])
              .map((category) => (
              <Chip
                key={category}
                selected={categoryFilter.includes(category)}
                onPress={() => toggleCategoryFilter(category)}
                  style={[
                    responsiveStyles.chip,
                    categoryFilter.includes(category) && { backgroundColor: getCategoryColor(category) + '30' }
                  ]}
                  showSelectedCheck={false}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={getCategoryIcon(category)}
                      size={16}
                      color={categoryFilter.includes(category) ? getCategoryColor(category) : theme.colors.onSurfaceVariant}
                    />
                  )}
                >
                  {category.replace('_', ' ')}
              </Chip>
            ))}
          </View>
          
          <Menu
            visible={showSortMenu}
            onDismiss={() => setShowSortMenu(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setShowSortMenu(true)}
                style={responsiveStyles.sortButton}
                icon={sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'}
              >
                Sort
              </Button>
            }
          >
            <Menu.Item
              onPress={() => handleSort('date')}
              title="Date"
              leadingIcon={sortField === 'date' ? (sortOrder === 'asc' ? 'sort-calendar-ascending' : 'sort-calendar-descending') : 'calendar'}
            />
            <Menu.Item
              onPress={() => handleSort('amount')}
              title="Amount"
              leadingIcon={sortField === 'amount' ? (sortOrder === 'asc' ? 'sort-numeric-ascending' : 'sort-numeric-descending') : 'cash'}
            />
            <Menu.Item
              onPress={() => handleSort('category')}
              title="Category"
              leadingIcon={sortField === 'category' ? (sortOrder === 'asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending') : 'shape'}
            />
          </Menu>
        </View>

        {/* Expenses List */}
        {filteredExpenses.length > 0 ? (
          <FlatList
            data={filteredExpenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <Text style={responsiveStyles.noExpensesText}>
            No expenses found. Add a new expense to get started.
          </Text>
        )}
      </ScrollView>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={{ marginBottom: responsiveSpacing(16) }}>Expense Management</Text>
        <View style={styles.content}>
          {renderContent()}
        </View>
          <Button 
            mode="contained" 
            onPress={() => router.push(routes.app.expenses.new)}
            icon="plus" 
          >
            Add Expense
          </Button>
      </View>

      <Portal>
          <Dialog
            visible={deleteDialogVisible}
            onDismiss={() => setDeleteDialogVisible(false)}
            style={responsiveStyles.deleteDialog}
          >
            <Dialog.Title>Delete Expense</Dialog.Title>
            <Dialog.Content style={responsiveStyles.deleteDialogContent}>
              <Text>Are you sure you want to delete this expense?</Text>
              {expenseToDelete && (
                <Text style={{ fontWeight: 'bold', marginTop: responsiveSpacing(8) }}>
                  {expenseToDelete.description} ({formatCurrency(expenseToDelete.amount)})
                </Text>
              )}
            </Dialog.Content>
            <Dialog.Actions style={responsiveStyles.deleteDialogActions}>
              <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
              <Button onPress={handleDeleteExpense} textColor={theme.colors.error}>Delete</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
    </AppLayout>
  );
};

export default ExpenseManagementScreen; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#transparent',
    paddingBottom: 80,
  },
  content: {
    flex: 1,
    paddingBottom: 70,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 90,
    right: responsiveSpacing(16),
    flexDirection: 'row',
    gap: responsiveSpacing(8),
    zIndex: 1,
  },
  clientsList: {
    paddingTop: 8,
    paddingBottom: 90,
  },
});