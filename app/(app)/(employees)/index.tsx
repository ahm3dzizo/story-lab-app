import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Text, Card, Button, Searchbar, Menu, Divider, List, Avatar, useTheme, IconButton, Surface, Portal, Dialog, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { routes } from '@/app/routes';

// Temporary type definitions until we restore the employees schema
type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  employee_code: string;
  department_id: number | null;
  position_id: number | null;
  employment_status: 'active' | 'terminated' | 'on_leave' | 'suspended';
  department?: { name: string };
  position?: { title: string };
  base_salary?: number;
  hire_date?: string;
  salary_payments?: Array<{
    amount: number;
    payment_date: string;
    payment_type: string;
  }>;
};

type FilterStatus = 'all' | 'active' | 'on_leave' | 'terminated' | 'suspended';
type SortField = 'name' | 'department' | 'position' | 'hire_date';
type SortOrder = 'asc' | 'desc';

const EmployeeManagementScreen = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const params = useLocalSearchParams<{ selectForSalary?: string }>();
  const selectForSalary = params.selectForSalary === 'true';
  const theme = useTheme();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          position:positions(title),
          base_salary,
          salary_payments(
            amount,
            payment_date,
            payment_type
          )
        `);

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('employment_status', filterStatus);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`
          first_name.ilike.%${searchQuery}%,
          last_name.ilike.%${searchQuery}%,
          email.ilike.%${searchQuery}%,
          employee_code.ilike.%${searchQuery}%
        `);
      }

      // Apply sorting
      switch (sortField) {
        case 'name':
          query = query.order('first_name', { ascending: sortOrder === 'asc' });
          break;
        case 'department':
          query = query.order('department_id', { ascending: sortOrder === 'asc' });
          break;
        case 'position':
          query = query.order('position_id', { ascending: sortOrder === 'asc' });
          break;
        case 'hire_date':
          query = query.order('hire_date', { ascending: sortOrder === 'asc' });
          break;
      }

      console.log('Fetching employees with query:', query);
      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Fetched employees data:', data);
      console.log('First employee salary payments:', data?.[0]?.salary_payments);
      
      setEmployees(data as Employee[]);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [filterStatus, sortField, sortOrder, searchQuery]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchEmployees();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.primary;
      case 'on_leave':
        return theme.colors.secondary;
      case 'terminated':
        return theme.colors.error;
      case 'suspended':
        return theme.colors.tertiary;
      default:
        return theme.colors.surfaceDisabled;
    }
  };

  const getSalaryStatus = (employee: Employee) => {
    console.log('Calculating salary status for employee:', employee.id);
    console.log('Salary payments:', employee.salary_payments);
    console.log('Base salary:', employee.base_salary);

    if (!employee.salary_payments || !employee.base_salary) {
      console.log('No salary payments or base salary found');
      return { status: 'DUE', color: '#f59e0b' }; // Amber color for due
    }

    const currentDate = new Date();
    const lastPayment = employee.salary_payments[0];
    
    if (!lastPayment) {
      console.log('No last payment found');
      return { status: 'DUE', color: '#f59e0b' };
    }

    console.log('Last payment:', lastPayment);

    const lastPaymentDate = new Date(lastPayment.payment_date);
    const monthDiff = (currentDate.getFullYear() - lastPaymentDate.getFullYear()) * 12 + 
                     (currentDate.getMonth() - lastPaymentDate.getMonth());

    console.log('Months since last payment:', monthDiff);

    if (monthDiff > 1) {
      console.log('Payment is overdue (more than 1 month)');
      return { status: 'DUE', color: '#f59e0b' };
    }

    const totalPaid = employee.salary_payments
      .filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate.getMonth() === currentDate.getMonth() &&
               paymentDate.getFullYear() === currentDate.getFullYear();
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    console.log('Total paid this month:', totalPaid);

    if (totalPaid > employee.base_salary) {
      console.log('Employee is overpaid');
      return { status: 'OVERPAID', color: '#0ea5e9' }; // Sky blue for overpaid
    } else if (totalPaid === employee.base_salary) {
      console.log('Employee is paid');
      return { status: 'PAID', color: '#22c55e' }; // Green for paid
    } else {
      console.log('Employee payment is due');
      return { status: 'DUE', color: '#f59e0b' }; // Amber for due
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    // Prevent multiple delete attempts
    if (isDeleting) {
      console.log('Delete operation already in progress');
      return;
    }

    console.log('Starting delete process for employee:', {
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      email: employee.email
    });

    setEmployeeToDelete(employee);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      setIsDeleting(true);
      console.log('User confirmed deletion, proceeding...');

      // Try to delete salary records first
      console.log('Attempting to delete salary records...');
      const { error: salaryError } = await supabase
        .from('salary_payments')
        .delete()
        .eq('employee_id', employeeToDelete.id)
        .select();

      if (salaryError && salaryError.code !== 'PGRST116') {
        console.error('Error deleting salary records:', salaryError);
        throw salaryError;
      }

      console.log('Salary records handled, deleting employee...');
      const { error: employeeError } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeToDelete.id)
        .select();

      if (employeeError) {
        console.error('Error deleting employee:', employeeError);
        throw employeeError;
      }

      console.log('Employee deleted successfully, updating UI...');
      setEmployees(prevEmployees => prevEmployees.filter(e => e.id !== employeeToDelete.id));
      setShowDeleteDialog(false);
      setEmployeeToDelete(null);

      // Show success dialog
      setShowSuccessDialog(true);

    } catch (error: any) {
      console.error('Delete operation failed:', error);
      
      let message = 'Failed to delete employee.';
      if (error.code === '23503') {
        message = 'Cannot delete employee due to existing records.';
      } else if (error.message) {
        message = error.message;
      }

      setErrorMessage(message);
      setShowErrorDialog(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('User cancelled deletion');
    setShowDeleteDialog(false);
    setEmployeeToDelete(null);
    setIsDeleting(false);
  };

  const getAvatarGradient = (status: string): [string, string] => {
    switch (status) {
      case 'active':
        return ['#3b82f6', '#1d4ed8'];
      case 'on_leave':
        return ['#8b5cf6', '#6d28d9'];
      case 'terminated':
        return ['#ef4444', '#b91c1c'];
      case 'suspended':
        return ['#6366f1', '#4338ca'];
      default:
        return ['#6b7280', '#4b5563'];
    }
  };

  // Handle salary payment navigation
  const handlePaySalary = (employee: Employee) => {
    router.push(`/(app)/(employees)/salary?employee_id=${employee.id}`);
  };

  const renderEmployeeCard = (employee: Employee) => {
    console.log('Rendering card for employee:', employee.id);
    const { status: salaryStatus, color: salaryColor } = getSalaryStatus(employee);
    
    return (
      <View style={styles.cardWrapper}>
        <Pressable
          onPress={() => {
            if (selectForSalary) {
              handlePaySalary(employee);
            } else {
              router.push({
                pathname: '/(app)/(employees)/[id]',
                params: { id: employee.id }
              })
            }
          }}
          style={({ pressed }) => [
            styles.cardPressable,
            pressed && { opacity: 0.7 }
          ]}
        >
          <Surface style={styles.card} elevation={2}>
            <View style={styles.cardContent}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={getAvatarGradient(employee.employment_status)}
                  style={styles.avatarGradient}
                >
                  <Avatar.Text 
                    size={60} 
                    label={`${employee.first_name[0]}${employee.last_name[0]}`}
                    color="#ffffff"
                    style={{ backgroundColor: 'transparent' }}
                  />
                </LinearGradient>
              </View>

              <View style={styles.employeeInfo}>
                <View style={styles.nameRow}>
                  <Text variant="titleMedium" style={styles.employeeName}>
                    {employee.first_name} {employee.last_name}
                  </Text>
                  <Chip 
                    mode="outlined"
                    textStyle={{ color: getStatusColor(employee.employment_status) }}
                    style={{ borderColor: getStatusColor(employee.employment_status) }}
                  >
                    {employee.employment_status.replace('_', ' ')}
                  </Chip>
                </View>

                <View style={styles.detailsRow}>
                  <MaterialCommunityIcons name="email-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={styles.detailText}>{employee.email}</Text>
                </View>
                
                {employee.position && (
                  <View style={styles.detailsRow}>
                    <MaterialCommunityIcons name="briefcase-outline" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodyMedium" style={styles.detailText}>{employee.position.title}</Text>
                  </View>
                )}
                
                {employee.department && (
                  <View style={styles.detailsRow}>
                    <MaterialCommunityIcons name="domain" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodyMedium" style={styles.detailText}>{employee.department.name}</Text>
                  </View>
                )}
                
                {employee.base_salary && (
                  <View style={styles.detailsRow}>
                    <MaterialCommunityIcons name="cash-multiple" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      ${employee.base_salary.toFixed(2)} 
                      <Text variant="bodySmall" style={{ color: salaryColor }}>
                        ({salaryStatus})
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.cardActions}>
              {selectForSalary ? (
                <Button 
                  mode="contained" 
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePaySalary(employee);
                  }}
                  icon="cash-multiple"
                >
                  Pay Salary
                </Button>
              ) : (
                <>
                  <IconButton
                    icon="pencil"
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({
                        pathname: '/(app)/(employees)/edit',
                        params: { id: employee.id }
                      });
                    }}
                  />
                  <IconButton
                    icon="cash-multiple"
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({
                        pathname: '/(app)/(employees)/salary',
                        params: { employee_id: employee.id }
                      });
                    }}
                  />
                  <IconButton
                    icon="trash-can-outline"
                    iconColor={theme.colors.error}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteEmployee(employee);
                    }}
                  />
                </>
              )}
            </View>
          </Surface>
        </Pressable>
      </View>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        {/* Header with page title and action buttons */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons 
              name="account-group" 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text variant="headlineMedium" style={styles.title}>
              {selectForSalary ? 'Select Employee for Salary Payment' : 'Employees'}
            </Text>
          </View>
          
          {!selectForSalary && (
            <Button 
              mode="contained"
              onPress={() => router.push(routes.app.employees.new)}
              icon="account-plus"
            >
              Add Employee
            </Button>
          )}

          {/* If in selection mode, show a cancel button */}
          {selectForSalary && (
            <Button 
              mode="outlined"
              onPress={() => router.back()}
              icon="close"
            >
              Cancel
            </Button>
          )}
        </View>

        {/* Search, filter and sort controls */}
        <View style={styles.controlsContainer}>
            <Searchbar
              placeholder="Search employees..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            inputStyle={{ fontSize: 16 }}
            />
          
          <View style={styles.filterSortContainer}>
              <Menu
                visible={showFilterMenu}
                onDismiss={() => setShowFilterMenu(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setShowFilterMenu(true)}
                    icon="filter-variant"
                    style={styles.filterButton}
                  >
                  {filterStatus === 'all' ? 'All Status' : filterStatus.replace('_', ' ')}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setFilterStatus('all');
                    setShowFilterMenu(false);
                  }}
                title="All Status" 
                />
              <Divider />
                <Menu.Item
                  onPress={() => {
                    setFilterStatus('active');
                    setShowFilterMenu(false);
                  }}
                  title="Active"
                />
                <Menu.Item
                  onPress={() => {
                    setFilterStatus('on_leave');
                    setShowFilterMenu(false);
                  }}
                  title="On Leave"
                />
                <Menu.Item
                  onPress={() => {
                    setFilterStatus('suspended');
                    setShowFilterMenu(false);
                  }}
                  title="Suspended"
                />
                <Menu.Item
                  onPress={() => {
                    setFilterStatus('terminated');
                    setShowFilterMenu(false);
                  }}
                  title="Terminated"
                />
              </Menu>

              <Menu
                visible={showSortMenu}
                onDismiss={() => setShowSortMenu(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setShowSortMenu(true)}
                    icon="sort"
                  style={styles.sortButton}
                  >
                  Sort: {sortField} {sortOrder === 'asc' ? '▲' : '▼'}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setSortField('name');
                  setSortOrder('asc');
                    setShowSortMenu(false);
                  }}
                title="Name (A-Z)" 
                leadingIcon="sort-alphabetical-ascending"
              />
              <Menu.Item 
                onPress={() => {
                  setSortField('name');
                  setSortOrder('desc');
                  setShowSortMenu(false);
                }} 
                title="Name (Z-A)" 
                leadingIcon="sort-alphabetical-descending"
              />
              <Divider />
                <Menu.Item
                  onPress={() => {
                    setSortField('department');
                  setSortOrder('asc');
                    setShowSortMenu(false);
                  }}
                title="Department (A-Z)" 
                leadingIcon="domain"
                />
                <Menu.Item
                  onPress={() => {
                    setSortField('position');
                  setSortOrder('asc');
                    setShowSortMenu(false);
                  }}
                title="Position (A-Z)" 
                leadingIcon="briefcase-outline"
                />
              <Divider />
                <Menu.Item
                  onPress={() => {
                    setSortField('hire_date');
                  setSortOrder('desc');
                    setShowSortMenu(false);
                  }}
                title="Newest First" 
                leadingIcon="clock-time-nine-outline"
              />
              <Menu.Item 
                onPress={() => {
                  setSortField('hire_date');
                  setSortOrder('asc');
                  setShowSortMenu(false);
                }} 
                title="Oldest First" 
                leadingIcon="clock-time-three-outline"
                />
              </Menu>
            </View>
          </View>

        {/* Employee list */}
            <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <Text>Loading employees...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button mode="contained" onPress={onRefresh} style={styles.retryButton}>
                Retry
              </Button>
            </View>
          ) : employees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-search" size={64} color={theme.colors.surfaceDisabled} />
              <Text style={styles.emptyText}>No employees found</Text>
              {!searchQuery && filterStatus === 'all' && (
              <Button
                mode="contained"
                onPress={() => router.push(routes.app.employees.new)}
                  style={styles.addButton}
                icon="account-plus"
              >
                  Add First Employee
              </Button>
              )}
            </View>
          ) : (
            <View style={styles.employeesList}>
              {employees.map(employee => (
                <React.Fragment key={employee.id}>
                  {renderEmployeeCard(employee)}
                </React.Fragment>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Delete confirmation dialog */}
      <Portal>
          <Dialog
            visible={showDeleteDialog}
            onDismiss={handleCancelDelete}
            style={styles.dialog}
          >
            <Dialog.Title>Confirm Deletion</Dialog.Title>
          <Dialog.Content>
              <Text variant="bodyMedium">
                Are you sure you want to delete{' '}
                {employeeToDelete ? `${employeeToDelete.first_name} ${employeeToDelete.last_name}` : 'this employee'}?
                This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancelDelete}>Cancel</Button>
              <Button onPress={handleConfirmDelete} textColor={theme.colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>

          <Dialog
            visible={showSuccessDialog}
            onDismiss={() => setShowSuccessDialog(false)}
          >
          <Dialog.Title>Success</Dialog.Title>
          <Dialog.Content>
              <Text variant="bodyMedium">
                Employee deleted successfully.
              </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSuccessDialog(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>

          <Dialog
            visible={showErrorDialog}
            onDismiss={() => setShowErrorDialog(false)}
          >
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
              <Text variant="bodyMedium">{errorMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowErrorDialog(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 80,
  },
  content: {
    flex: 1,
  },
  header: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    padding: 12,
  },
  searchContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    borderRadius: 20,
  },
  filterButtonContent: {
    height: 40,
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  actionButtonsScroll: {
    paddingVertical: 8,
    gap: 12,
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    minWidth: 90,
    borderWidth: 1,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    height: 36,
  },
  list: {
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoSection: {
    flex: 1,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  positionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  salaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  salaryText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  statusChip: {
    borderRadius: 12,
    height: 24,
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    marginVertical: 1,
  },
  salaryStatusChip: {
    borderRadius: 12,
    height: 24,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salaryStatusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    marginVertical: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  actionIcon: {
    margin: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
  },
  emptyButton: {
    marginTop: 24,
  },
  cardPressable: {
    width: '100%',
  },
  employeeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeInfo: {
    flex: 1,
    padding: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  filterSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButton: {
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  dialog: {
    backgroundColor: '#1e293b',
  },
  addButton: {
    marginTop: 24,
  },
  employeesList: {
    width: '100%',
  },
});

export default EmployeeManagementScreen; 