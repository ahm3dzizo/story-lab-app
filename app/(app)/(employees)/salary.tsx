import React, { useEffect, useState } from 'react';
import { SalaryManagementForm } from './components/forms/SalaryManagementForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Alert, View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton, Card, Button, Divider, RadioButton, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { SelectField } from '@/app/features/shared/components/forms/SelectField';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  base_salary?: number;
  employment_status: string;
};

type PaymentMode = 'single' | 'all';

export default function SalaryManagement() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    id?: string;
    employee_id?: string;
    mode?: 'edit' | 'create';
  }>();
  
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [payment, setPayment] = useState<SalaryPayment | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('single');
  const [salaryHistory, setSalaryHistory] = useState<SalaryPayment[]>([]);
  const [allEmployeeSalaries, setAllEmployeeSalaries] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [defaultAmount, setDefaultAmount] = useState<number | null>(null);
  
  // Load initial data
  useEffect(() => {
    // If we're editing a payment, load it
    if (params.mode === 'edit' && params.id) {
      loadPayment();
    } else {
      // Otherwise, load employees
      loadEmployees();
    }
  }, [params.id, params.mode]);
  
  // When employee_id or payment mode changes, fetch salary data
  useEffect(() => {
    if (paymentMode === 'single' && selectedEmployee) {
      fetchEmployeeSalaryHistory(selectedEmployee.id);
      
      // Auto-populate amount field with employee's base salary if available
      if (selectedEmployee.base_salary) {
        setDefaultAmount(selectedEmployee.base_salary);
      } else {
        setDefaultAmount(null);
      }
    } else if (paymentMode === 'all') {
      fetchAllEmployeesSalaries();
      
      // Sum all employees' base salaries for bulk payment
      const totalBaseSalary = employees
        .filter(emp => emp.base_salary !== undefined && emp.base_salary !== null)
        .reduce((sum, emp) => sum + (emp.base_salary || 0), 0);
        
      if (totalBaseSalary > 0) {
        setDefaultAmount(totalBaseSalary);
      } else {
        setDefaultAmount(null);
      }
    }
  }, [selectedEmployee, paymentMode, employees]);
  
  // When employee_id changes, find and set the selected employee
  useEffect(() => {
    if (params.employee_id && employees.length > 0) {
      const employee = employees.find(e => e.id.toString() === params.employee_id);
      if (employee) {
        setSelectedEmployee(employee);
      }
    }
  }, [params.employee_id, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, base_salary, employment_status')
        .eq('employment_status', 'active')
        .order('first_name');
      
      if (error) throw error;
      
      setEmployees(data || []);
      
      // If employee_id was provided, set the selected employee
      if (params.employee_id) {
        const employee = data?.find(e => e.id.toString() === params.employee_id);
        if (employee) {
          setSelectedEmployee(employee);
        }
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeSalaryHistory = async (employeeId: number) => {
    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('salary_payments')
        .select('*')
        .eq('employee_id', employeeId)
        .order('payment_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setSalaryHistory(data || []);
    } catch (error) {
      console.error('Error fetching salary history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const fetchAllEmployeesSalaries = async () => {
    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          base_salary,
          salary_payments(amount, payment_date, payment_type)
        `)
        .eq('employment_status', 'active')
        .order('first_name');
      
      if (error) throw error;
      
      // Format the data for easier display
      const formattedData = (data || []).map(employee => {
        // Sort payments by date (newest first)
        const sortedPayments = [...(employee.salary_payments || [])].sort(
          (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        );
        
        const latestPayment = sortedPayments[0];
        
        return {
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
          baseSalary: employee.base_salary,
          latestPayment: latestPayment ? {
            amount: latestPayment.amount,
            date: latestPayment.payment_date,
            type: latestPayment.payment_type
          } : null,
          paymentCount: sortedPayments.length,
          totalPaid: sortedPayments.reduce((sum, p) => sum + p.amount, 0)
        };
      });
      
      setAllEmployeeSalaries(formattedData);
    } catch (error) {
      console.error('Error fetching all salaries:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadPayment = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salary_payments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setPayment(data);
      
      // Also load employees to get the selected employee
      await loadEmployees();
      
      // Set paymentMode to single when editing
      setPaymentMode('single');
    } catch (error) {
      console.error('Error loading payment:', error);
      Alert.alert('Error', 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleEmployeeSubmit = async (salaryData: any) => {
    try {
      if (params.mode === 'edit' && params.id) {
        // Update existing payment
        const { error } = await supabase
          .from('salary_payments')
          .update({
            amount: salaryData.amount,
            payment_date: salaryData.payment_date,
            payment_type: salaryData.payment_type,
            description: salaryData.description
          })
          .eq('id', params.id);

        if (error) throw error;
        Alert.alert('Success', 'Salary payment updated successfully!');
      } else {
        // Create new payment for a single employee
        if (!selectedEmployee) {
          throw new Error('Please select an employee');
        }

        const { error } = await supabase
          .from('salary_payments')
          .insert([{
            ...salaryData,
            employee_id: selectedEmployee.id
          }]);

        if (error) throw error;
        Alert.alert('Success', 'Salary payment recorded successfully!');
        
        // Refresh the salary history
        fetchEmployeeSalaryHistory(selectedEmployee.id);
      }

      router.back();
    } catch (error: any) {
      console.error('Error managing salary payment:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to manage salary payment. Please try again.'
      );
    }
  };

  const handleBulkPaymentSubmit = async (salaryData: any) => {
    try {
      if (!employees.length) {
        throw new Error('No active employees found');
      }

      // Create an array of payment records for all employees
      const bulkPayments = employees.map(employee => ({
        ...salaryData,
        employee_id: employee.id,
        // If using base salary, use the employee's base salary, otherwise use the entered amount
        amount: salaryData.payment_type === 'base_salary' && employee.base_salary
          ? employee.base_salary
          : parseFloat(salaryData.amount),
      }));

      const { error } = await supabase
        .from('salary_payments')
        .insert(bulkPayments);

      if (error) throw error;
      
      Alert.alert('Success', `Salary payments recorded for ${employees.length} employees!`);
      
      // Refresh the data
      fetchAllEmployeesSalaries();
      
      router.back();
    } catch (error: any) {
      console.error('Error processing bulk salary payments:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to process salary payments. Please try again.'
      );
    }
  };

  const handleSubmit = async (salaryData: any) => {
    if (paymentMode === 'single') {
      return handleSingleEmployeeSubmit(salaryData);
    } else {
      return handleBulkPaymentSubmit(salaryData);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 16 }}>Loading...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={() => router.back()}
          />
          <Text variant="headlineMedium">
            {params.mode === 'edit' ? 'Edit Salary Payment' : 'Record Salary Payment'}
          </Text>
        </View>
        
        {/* Payment Mode Selection - only show if not editing */}
        {!params.id && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Payment Mode</Text>
              <SegmentedButtons
                value={paymentMode}
                onValueChange={(value) => setPaymentMode(value as PaymentMode)}
                buttons={[
                  {
                    value: 'single',
                    label: 'Single Employee',
                    icon: 'account',
                  },
                  {
                    value: 'all',
                    label: 'All Employees',
                    icon: 'account-group',
                  },
                ]}
              />
              
              {paymentMode === 'single' && (
                <View style={{ marginTop: 16 }}>
                  <SelectField
                    label="Select Employee"
                    value={selectedEmployee ? selectedEmployee.id.toString() : ''}
                    onValueChange={(value) => {
                      const employee = employees.find(e => e.id.toString() === value);
                      setSelectedEmployee(employee || null);
                    }}
                    options={employees.map(employee => ({
                      label: `${employee.first_name} ${employee.last_name}`,
                      value: employee.id.toString(),
                      description: employee.base_salary 
                        ? `Base salary: ${formatCurrency(employee.base_salary)}`
                        : 'No base salary set',
                    }))}
                    required
                  />
                </View>
              )}
              
              {paymentMode === 'all' && (
                <View style={styles.infoContainer}>
                  <MaterialCommunityIcons name="information-outline" size={24} color="#3498db" />
                  <Text style={styles.infoText}>
                    This will create salary payments for all {employees.length} active employees.
                    {'\n\n'}
                    When using 'Base Salary' payment type, each employee's base salary will be used if available.
                    {'\n\n'}
                    Total base salary sum: {formatCurrency(employees.reduce((sum, emp) => sum + (emp.base_salary || 0), 0))}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
        
        {/* Salary management form */}
        {(params.mode === 'edit' || paymentMode === 'single' || paymentMode === 'all') && (
          <SalaryManagementForm 
            employeeId={selectedEmployee?.id || 0}
            onSubmit={handleSubmit}
            onClose={() => router.back()}
            initialData={payment || {
              amount: defaultAmount || 0,
              payment_date: new Date().toISOString().split('T')[0],
              payment_type: 'base_salary',
              description: paymentMode === 'all' 
                ? 'Bulk salary payment for all employees' 
                : selectedEmployee 
                  ? `Salary payment for ${selectedEmployee.first_name} ${selectedEmployee.last_name}` 
                  : ''
            }}
          />
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '500',
  },
  subsectionTitle: {
    marginBottom: 12,
    opacity: 0.8,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: '500',
  },
  infoValue: {
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
  },
  historyDate: {
    width: 80,
  },
  historyDateText: {
    opacity: 0.7,
  },
  historyDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyAmount: {
    fontWeight: '600',
  },
  historyType: {
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  emptyText: {
    opacity: 0.7,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
  },
  tableCell: {
    paddingRight: 8,
  },
}); 