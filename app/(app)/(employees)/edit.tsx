import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeRegistrationForm } from './new';

// Import types from new.tsx
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
};

type EmployeeInsert = {
  first_name: string;
  last_name: string;
  email: string;
  department_id: number | null;
  position_id: number | null;
  hire_date: string;
  phone_number: string | null;
  employment_status: 'active' | 'terminated' | 'on_leave' | 'suspended';
  base_salary: number | null;
  user_id: null;
  reports_to: null;
  employee_code?: string;
  office_location?: string;
  work_schedule?: string;
};

export default function EditEmployeeScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const id = parseInt(idParam || '0', 10);

  useEffect(() => {
    if (id && !isNaN(id)) {
      loadEmployeeData();
    } else {
      Alert.alert('Error', 'Invalid employee ID');
      router.back();
    }
  }, [id]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments:department_id(id, name),
          positions:position_id(id, title)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        Alert.alert('Error', 'Employee not found');
        router.back();
        return;
      }

      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee:', error);
      Alert.alert('Error', 'Failed to load employee data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: EmployeeInsert) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          department_id: data.department_id,
          position_id: data.position_id,
          hire_date: data.hire_date,
          phone_number: data.phone_number,
          base_salary: data.base_salary,
          employment_status: data.employment_status
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Success', 'Employee information updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating employee:', error);
      Alert.alert('Error', 'Failed to update employee information. Please try again.');
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

  return (
    <AppLayout>
      <EmployeeRegistrationForm
        onSubmit={handleSubmit}
        onClose={() => router.back()}
        mode="edit"
        initialData={employee || undefined}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 