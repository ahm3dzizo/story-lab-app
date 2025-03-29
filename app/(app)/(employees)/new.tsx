import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, useTheme, Portal, Modal, IconButton } from 'react-native-paper';
import { FormField } from '@/app/features/shared/components/forms/FormField';
import { SelectField } from '@/app/features/shared/components/forms/SelectField';
import DatePickerInput from '@/components/DatePickerInput';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { AppLayout } from '@/components/layout/AppLayout';

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
  phone_number: string | null;
  office_location: string | null;
  work_schedule: string | null;
  hire_date: string | null;
  user_id: number | null;
  reports_to: number | null;
  created_at: string;
  updated_at: string;
  base_salary: number | null;
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

interface EmployeeRegistrationFormProps {
  onSubmit: (data: EmployeeInsert) => Promise<void>;
  onClose?: () => void;
  mode?: 'create' | 'edit';
  initialData?: Employee;
}

interface FormData {
  fullName: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  phone: string;
  baseSalary: string;
}

interface FormErrors {
  [key: string]: string;
}

const departments = [
  { label: 'Engineering', value: 'engineering' },
  { label: 'Sales', value: 'sales' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'HR', value: 'hr' },
  { label: 'Operations', value: 'operations' },
  { label: 'Media Production', value: 'media_production' },
  { label: 'Digital Marketing', value: 'digital_marketing' },
  { label: 'Content Creation', value: 'content_creation' },
  { label: 'Advertising', value: 'advertising' },
  { label: 'Public Relations', value: 'public_relations' },
  { label: 'Social Media', value: 'social_media' },
  { label: 'Creative Design', value: 'creative_design' },
  { label: 'Video Production', value: 'video_production' },
  { label: 'Brand Management', value: 'brand_management' }
];

const positions = [
  { label: 'Manager', value: 'manager' },
  { label: 'Senior Developer', value: 'senior_developer' },
  { label: 'Developer', value: 'developer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Analyst', value: 'analyst' },
  { label: 'Coordinator', value: 'coordinator' },
  // Media & Advertising positions
  { label: 'Creative Director', value: 'creative_director' },
  { label: 'Art Director', value: 'art_director' },
  { label: 'Content Strategist', value: 'content_strategist' },
  { label: 'Social Media Manager', value: 'social_media_manager' },
  { label: 'Digital Marketing Specialist', value: 'digital_marketing_specialist' },
  { label: 'Media Planner', value: 'media_planner' },
  { label: 'Copywriter', value: 'copywriter' },
  { label: 'Video Editor', value: 'video_editor' },
  { label: 'Motion Graphics Designer', value: 'motion_graphics_designer' },
  { label: 'Brand Strategist', value: 'brand_strategist' },
  { label: 'Marketing Coordinator', value: 'marketing_coordinator' },
  { label: 'PR Specialist', value: 'pr_specialist' },
  { label: 'Account Manager', value: 'account_manager' },
  { label: 'Media Buyer', value: 'media_buyer' },
  { label: 'SEO Specialist', value: 'seo_specialist' },
  { label: 'Content Producer', value: 'content_producer' },
  { label: 'UX/UI Designer', value: 'ux_ui_designer' }
];

interface DepartmentOption {
  label: string;
  value: string;
  id: number;
}

interface PositionOption {
  label: string;
  value: string;
  id: number;
}

export const EmployeeRegistrationForm: React.FC<EmployeeRegistrationFormProps> = ({ 
  onSubmit,
  onClose,
  mode = 'create',
  initialData 
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState<FormData>({
    fullName: initialData ? `${initialData.first_name} ${initialData.last_name}` : '',
    email: initialData?.email || '',
    department: initialData?.department_id?.toString() || '',
    position: initialData?.position_id?.toString() || '',
    hireDate: initialData?.hire_date || new Date().toISOString().split('T')[0],
    phone: initialData?.phone_number || '',
    baseSalary: initialData?.base_salary?.toString() || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartmentsAndPositions();
  }, []);

  const loadDepartmentsAndPositions = async () => {
    try {
      setLoading(true);
      
      // Fetch departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (deptError) throw deptError;

      // Fetch positions
      const { data: posData, error: posError } = await supabase
        .from('positions')
        .select('id, title')
        .order('title');

      if (posError) throw posError;

      setDepartments(deptData.map(d => ({
        label: d.name,
        value: d.id.toString(),
        id: d.id
      })));

      setPositions(posData.map(p => ({
        label: p.title,
        value: p.id.toString(),
        id: p.id
      })));

    } catch (error) {
      console.error('Error loading departments and positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    const salaryRegex = /^\d+(\.\d{0,2})?$/;

    // Required fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.hireDate) newErrors.hireDate = 'Hire date is required';
    if (!formData.baseSalary) newErrors.baseSalary = 'Base salary is required';

    // Format validation
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.baseSalary && !salaryRegex.test(formData.baseSalary)) {
      newErrors.baseSalary = 'Please enter a valid amount (up to 2 decimal places)';
    }

    // Date validation
    const hireDate = new Date(formData.hireDate);
    if (formData.hireDate && isNaN(hireDate.getTime())) {
      newErrors.hireDate = 'Please enter a valid date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const employeeData: EmployeeInsert = {
        first_name: firstName,
        last_name: lastName || '',
        email: formData.email.trim(),
        department_id: parseInt(formData.department) || null,
        position_id: parseInt(formData.position) || null,
        hire_date: formData.hireDate,
        phone_number: formData.phone.trim() || null,
        employment_status: 'active',
        base_salary: parseFloat(formData.baseSalary) || null,
        user_id: null,
        reports_to: null
      };

      onSubmit(employeeData);
    }
  };

  const handleChange = (field: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Basic Information Section */}
      <Card style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-details" size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Basic Information</Text>
          </View>
          <FormField
            label="Full Name"
            value={formData.fullName}
            onChangeText={handleChange('fullName')}
            error={errors.fullName}
            required
            placeholder="Enter full name"
            leftIcon="account"
          />
          <FormField
            label="Email"
            value={formData.email}
            onChangeText={handleChange('email')}
            error={errors.email}
            required
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="email"
          />
          <FormField
            label="Phone Number"
            value={formData.phone}
            onChangeText={handleChange('phone')}
            error={errors.phone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            leftIcon="phone"
          />
          <DatePickerInput
            label="Hire Date"
            value={formData.hireDate}
            onChange={handleChange('hireDate')}
            error={errors.hireDate}
            required
          />
          <FormField
            label="Base Salary"
            value={formData.baseSalary}
            onChangeText={handleChange('baseSalary')}
            error={errors.baseSalary}
            required
            placeholder="Enter base salary"
            keyboardType="decimal-pad"
            leftIcon="currency-usd"
          />
        </Card.Content>
      </Card>

      {/* Role & Department Section */}
      <Card style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="domain" size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Role & Department</Text>
          </View>
          <SelectField
            label="Department"
            value={formData.department}
            onValueChange={handleChange('department')}
            options={departments}
            required
            error={errors.department}
            loading={loading}
            leftIcon="domain"
          />
          <SelectField
            label="Position"
            value={formData.position}
            onValueChange={handleChange('position')}
            options={positions}
            required
            error={errors.position}
            loading={loading}
            leftIcon="badge-account-horizontal"
          />
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        {onClose && (
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.cancelButton}
            icon="close"
          >
            Cancel
          </Button>
        )}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
          icon={mode === 'create' ? 'account-plus' : 'content-save'}
        >
          {mode === 'create' ? 'Register Employee' : 'Update Employee'}
        </Button>
      </View>
    </ScrollView>
  );
};

export const NewEmployeeScreen = () => {
  const router = useRouter();

  const handleSubmit = async (data: EmployeeInsert) => {
    try {
      const { error } = await supabase
        .from('employees')
        .insert([data]);

      if (error) throw error;

      Alert.alert('Success', 'Employee registered successfully!');
      router.back();
    } catch (error) {
      console.error('Error registering employee:', error);
      Alert.alert('Error', 'Failed to register employee. Please try again.');
    }
  };

  return (
    <AppLayout>
      <EmployeeRegistrationForm
        onSubmit={handleSubmit}
        onClose={() => router.back()}
        mode="create"
      />
    </AppLayout>
  );
};

export default NewEmployeeScreen;

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginVertical: 16,
    paddingHorizontal: 4,
    paddingBottom: 70,
  },
  submitButton: {
    flex: 1,
    maxWidth: 200,
    borderRadius: 8,
  },
  cancelButton: {
    flex: 1,
    maxWidth: 120,
    borderRadius: 8,
  },
}); 