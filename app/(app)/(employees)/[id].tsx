import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Button, Portal, Dialog, useTheme, Chip, IconButton, Divider, Menu } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';

type SalaryPayment = {
  id: number;
  employee_id: number;
  amount: number;
  payment_date: string;
  payment_type: string;
  description?: string;
};

type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  employee_code: string;
  department_id: number | null;
  position_id: number | null;
  employment_status: 'active' | 'terminated' | 'on_leave' | 'suspended';
  phone_number: string | null;
  office_location: string | null;
  work_schedule: string | null;
  hire_date: string | null;
  user_id: number | null;
  reports_to: number | null;
  created_at: string;
  updated_at: string;
  base_salary: number | null;
  department?: { name: string };
  position?: { title: string };
  salary_payments?: SalaryPayment[];
};

export const EmployeeProfileScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SalaryPayment | null>(null);
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);
  const [paymentMenuPosition, setPaymentMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (id) {
      loadEmployeeData();
    }
  }, [id]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          position:positions(title),
          salary_payments(
            id,
            amount,
            payment_date,
            payment_type,
            description
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee:', error);
      Alert.alert('Error', 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      const { error } = await supabase
        .from('salary_payments')
        .delete()
        .eq('id', selectedPayment.id);

      if (error) throw error;

      // Refresh employee data
      await loadEmployeeData();
      Alert.alert('Success', 'Salary payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      Alert.alert('Error', 'Failed to delete salary payment');
    } finally {
      setShowDeleteDialog(false);
      setSelectedPayment(null);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <Text>Loading employee data...</Text>
        </View>
      </AppLayout>
    );
  }

  if (!employee) {
    return (
      <AppLayout>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Employee not found</Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </AppLayout>
    );
  }

  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
  const gradientColors = getAvatarGradient(employee.employment_status);

  return (
    <AppLayout>
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <Surface style={styles.header} elevation={2}>
          <View style={styles.headerContent}>
            <LinearGradient
              colors={gradientColors}
              style={styles.avatarContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>

            <View style={styles.headerInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>
                  {employee.first_name} {employee.last_name}
                </Text>
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: getStatusColor(employee.employment_status) }]}
                >
                  {employee.employment_status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>

              <Text style={styles.position}>
                {employee.position?.title || 'No position'} • {employee.department?.name || 'No department'}
              </Text>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="email" size={16} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.detailText}>{employee.email}</Text>
                </View>
                {employee.phone_number && (
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="phone" size={16} color="rgba(255, 255, 255, 0.7)" />
                    <Text style={styles.detailText}>{employee.phone_number}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Button
              mode="contained"
              onPress={() => router.push({
                pathname: "/(app)/(employees)/edit",
                params: { id: employee.id }
              })}
              icon="pencil"
              style={styles.actionButton}
            >
              Edit Profile
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push({
                pathname: "/(app)/(employees)/salary",
                params: { employee_id: employee.id }
              })}
              icon="cash-plus"
              style={styles.actionButton}
            >
              Pay Salary
            </Button>
          </View>
        </Surface>

        {/* Salary Information */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cash" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Salary Information</Text>
          </View>
          <Divider style={styles.divider} />
          
          <View style={styles.salaryInfo}>
            <View style={styles.salaryDetail}>
              <Text style={styles.salaryLabel}>Base Salary</Text>
              <Text style={styles.salaryAmount}>
                ${employee.base_salary?.toLocaleString() || '0'}
              </Text>
            </View>
            <View style={styles.salaryDetail}>
              <Text style={styles.salaryLabel}>Total Payments (Current Month)</Text>
              <Text style={styles.salaryAmount}>
                ${employee.salary_payments
                  ?.filter(payment => {
                    const paymentDate = new Date(payment.payment_date);
                    const now = new Date();
                    return paymentDate.getMonth() === now.getMonth() &&
                           paymentDate.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum, payment) => sum + payment.amount, 0)
                  .toLocaleString() || '0'}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Payment History */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="history" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Salary History</Text>
          </View>
          <Divider style={styles.divider} />

          {employee.salary_payments && employee.salary_payments.length > 0 ? (
            employee.salary_payments
              .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
              .map(payment => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentInfo}>
                    <View style={styles.paymentHeader}>
                      <Text style={styles.paymentAmount}>
                        ${payment.amount.toLocaleString()}
                      </Text>
                      <Chip mode="flat" style={styles.paymentTypeChip}>
                        {payment.payment_type}
                      </Chip>
                    </View>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.payment_date)}
                    </Text>
                    {payment.description && (
                      <Text style={styles.paymentDescription}>
                        {payment.description}
                      </Text>
                    )}
                  </View>
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={(e) => {
                      setSelectedPayment(payment);
                      setPaymentMenuPosition({
                        x: e.nativeEvent.pageX,
                        y: e.nativeEvent.pageY
                      });
                      setShowPaymentMenu(true);
                    }}
                  />
                </View>
              ))
          ) : (
            <View style={styles.emptyPayments}>
              <Text style={styles.emptyText}>No salary payments found</Text>
            </View>
          )}
        </Surface>
      </ScrollView>

      {/* Payment Actions Menu */}
      <Portal>
        <Menu
          visible={showPaymentMenu}
          onDismiss={() => setShowPaymentMenu(false)}
          anchor={paymentMenuPosition}
        >
          <Menu.Item
            onPress={() => {
              setShowPaymentMenu(false);
              if (selectedPayment) {
                router.push({
                  pathname: "/(app)/(employees)/salary",
                  params: { 
                    id: selectedPayment.id,
                    employee_id: employee.id,
                    mode: 'edit'
                  }
                });
              }
            }}
            title="Edit Payment"
            leadingIcon="pencil"
          />
          <Menu.Item
            onPress={() => {
              setShowPaymentMenu(false);
              setShowDeleteDialog(true);
            }}
            title="Delete Payment"
            leadingIcon="delete"
          />
        </Menu>

        {/* Delete Payment Dialog */}
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Payment</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this salary payment?</Text>
            {selectedPayment && (
              <View style={styles.deleteDialogDetails}>
                <Text>Amount: ${selectedPayment.amount.toLocaleString()}</Text>
                <Text>Date: {formatDate(selectedPayment.payment_date)}</Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleDeletePayment}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginBottom: 80,
  },
  header: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerContent: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
    gap: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusChip: {
    height: 24,
  },
  position: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  actionButton: {
    flex: 1,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  salaryInfo: {
    padding: 16,
    gap: 16,
  },
  salaryDetail: {
    gap: 4,
  },
  salaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  salaryAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    
  },
  paymentInfo: {
    flex: 1,
    gap: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  paymentTypeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  paymentDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  emptyPayments: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
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
    marginBottom: 16,
  },
  deleteDialogDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    gap: 4,
    paddingBottom: 40,
  },
});

export default EmployeeProfileScreen; 