import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, StyleProp, ViewStyle, TextStyle, Animated } from 'react-native';
import { Button, useTheme, HelperText, TextInput, Divider, Text, Surface, IconButton, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FormField } from '@/app/features/shared/components/forms/FormField';
import { SelectField } from '@/app/features/shared/components/forms/SelectField';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type ClientInsert = Database['public']['Tables']['clients']['Insert'] & {
  facebook_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
};

type Client = {
  id?: number;
  company_name: string;
  manager_name: string;
  field_type: string | null;
  monthly_subscription: number;
  status: 'active' | 'inactive' | 'pending';
  phone_number: string | null;
  address: string | null;
  notes: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  created_at?: string;
  updated_at?: string;
};

interface BaseFormFieldProps {
  style?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  requiredStyle?: TextStyle;
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  onClose?: () => void;
}

interface SelectFieldProps extends React.ComponentProps<typeof SelectField> {
  style?: StyleProp<ViewStyle>;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}

interface NewClientFormProps {
  onSubmit: (data: ClientInsert) => Promise<void>;
  onClose?: () => void;
  mode?: 'create' | 'edit';
  initialData?: Database['public']['Tables']['clients']['Row'];
}

interface ClientFormData {
  companyName: string;
  managerName: string;
  phoneNumber: string;
  monthlySubscription: string;
  address: string;
  fieldType: string;
  notes: string;
  status: 'active' | 'inactive' | 'pending';
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
}

interface FormErrors {
  [key: string]: string;
}

const fieldTypes = [
  { label: 'Technology', value: 'technology' },
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Retail', value: 'retail' },
  { label: 'Coffee Shop', value: 'coffee shop' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Education', value: 'education' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Services', value: 'services' },
  { label: 'Other', value: 'other' },
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const renderField = (props: FormFieldProps) => (
  <FormField
    {...props}
    style={props.editable === false ? styles.disabledInput : styles.fieldContainer}
  />
);

export const NewClientForm: React.FC<NewClientFormProps> = ({ onSubmit, initialData, mode = 'create', onClose }) => {
  const theme = useTheme();
  const customTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: '#1976D2',
      onSurface: '#000000',
      placeholder: '#666666',
      error: '#dc2626',
    },
  };
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [formData, setFormData] = useState<ClientFormData>({
    companyName: '',
    managerName: '',
    phoneNumber: '',
    monthlySubscription: '',
    address: '',
    fieldType: '',
    notes: '',
    status: 'active',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
  });

  useEffect(() => {
    if (initialData) {
      const data = initialData as unknown as (Database['public']['Tables']['clients']['Row'] & {
        facebook_url?: string | null;
        instagram_url?: string | null;
        tiktok_url?: string | null;
      });
      
      setFormData({
        companyName: data.company_name,
        managerName: data.manager_name,
        phoneNumber: data.phone_number || '',
        monthlySubscription: data.monthly_subscription.toString(),
        address: data.address || '',
        fieldType: data.field_type || '',
        notes: data.notes || '',
        status: data.status as 'active' | 'inactive' | 'pending',
        facebookUrl: data.facebook_url || '',
        instagramUrl: data.instagram_url || '',
        tiktokUrl: data.tiktok_url || '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateField = (field: keyof ClientFormData, value: string) => {
    switch (field) {
      case 'companyName':
        return !value ? 'Company name is required' : '';
      case 'managerName':
        return !value ? 'Manager name is required' : '';
      case 'phoneNumber':
        if (!value) return 'Phone number is required';
        if (!/^\+?[\d\s-()]{10,}$/.test(value)) return 'Please enter a valid phone number';
        return '';
      case 'monthlySubscription':
        if (!value) return 'Monthly subscription amount is required';
        if (isNaN(Number(value)) || Number(value) < 0) return 'Please enter a valid amount';
        return '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    const requiredFields = ['companyName', 'managerName', 'phoneNumber', 'monthlySubscription'];
    
    requiredFields.forEach((field) => {
      const error = validateField(field as keyof ClientFormData, formData[field as keyof ClientFormData]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const clientData = {
        company_name: formData.companyName.trim(),
        manager_name: formData.managerName.trim(),
        phone_number: formData.phoneNumber?.trim() || null,
        monthly_subscription: Number(formData.monthlySubscription),
        field_type: formData.fieldType?.trim() || null,
        status: formData.status,
        address: formData.address?.trim() || null,
        notes: formData.notes?.trim() || null,
        facebook_url: formData.facebookUrl?.trim() || null,
        instagram_url: formData.instagramUrl?.trim() || null,
        tiktok_url: formData.tiktokUrl?.trim() || null,
      };

      await onSubmit(clientData as ClientInsert);
    } catch (error) {
      console.error('Error submitting client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ClientFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => new Set([...prev, field]));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field: keyof ClientFormData) => () => {
    setTouched((prev) => new Set([...prev, field]));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const renderSection = (title: string, icon: string, children: React.ReactNode) => (
    <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
      <Surface style={styles.sectionContent} elevation={1}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name={icon as any} size={24} color={customTheme.colors.primary} />
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: customTheme.colors.onSurface }]}>{title}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.sectionInner}>
          {children}
        </View>
      </Surface>
    </Animated.View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: customTheme.colors.background }]} 
      showsVerticalScrollIndicator={false}
    >
     

      {/* Company Information Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="domain" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Company Information</Text>
          </View>
          {renderField({
            label: "Company Name",
            value: formData.companyName,
            onChangeText: handleChange('companyName'),
            error: touched.has('companyName') ? errors.companyName : undefined,
            required: true,
            placeholder: "Enter company name"
          })}

          {renderField({
            label: "Manager Name",
            value: formData.managerName,
            onChangeText: handleChange('managerName'),
            error: touched.has('managerName') ? errors.managerName : undefined,
            required: true,
            placeholder: "Enter manager name"
          })}

          <View style={styles.fieldContainer}>
            <SelectField
              label="Field Type"
              value={formData.fieldType}
              onValueChange={handleChange('fieldType')}
              options={fieldTypes}
            />
          </View>

          {mode === 'edit' && (
            <View style={styles.fieldContainer}>
              <SelectField
                label="Status"
                value={formData.status}
                onValueChange={handleChange('status')}
                options={statusOptions}
              />
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Contact Information Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="contacts" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Contact Information</Text>
          </View>
          {renderField({
            label: "Phone Number",
            value: formData.phoneNumber || '',
            onChangeText: handleChange('phoneNumber'),
            error: touched.has('phoneNumber') ? errors.phoneNumber : undefined,
            required: true,
            placeholder: "Enter phone number",
            keyboardType: "phone-pad"
          })}

          {renderField({
            label: "Address",
            value: formData.address || '',
            onChangeText: handleChange('address'),
            placeholder: "Enter address",
            multiline: true,
            numberOfLines: 3
          })}
        </Card.Content>
      </Card>

      {/* Social Media Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="share-variant" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Social Media</Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <View style={styles.socialInputWrapper}>
              <MaterialCommunityIcons name="facebook" size={22} color="#1877F2" style={styles.socialInputIcon} />
              {renderField({
                label: "Facebook URL",
                value: formData.facebookUrl || '',
                onChangeText: handleChange('facebookUrl'),
                placeholder: "https://facebook.com/your-page"
              })}
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.socialInputWrapper}>
              <MaterialCommunityIcons name="instagram" size={22} color="#E4405F" style={styles.socialInputIcon} />
              {renderField({
                label: "Instagram URL",
                value: formData.instagramUrl || '',
                onChangeText: handleChange('instagramUrl'),
                placeholder: "https://instagram.com/your-handle"
              })}
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.socialInputWrapper}>
              <MaterialCommunityIcons name="video-box" size={22} color="#00F2EA" style={styles.socialInputIcon} />
              {renderField({
                label: "TikTok URL",
                value: formData.tiktokUrl || '',
                onChangeText: handleChange('tiktokUrl'),
                placeholder: "https://tiktok.com/@your-handle"
              })}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Financial Information Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cash" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Financial Information</Text>
          </View>
          {renderField({
            label: "Monthly Subscription Amount",
            value: formData.monthlySubscription || '',
            onChangeText: handleChange('monthlySubscription'),
            error: touched.has('monthlySubscription') ? errors.monthlySubscription : undefined,
            required: true,
            placeholder: "Enter amount",
            keyboardType: "decimal-pad"
          })}
        </Card.Content>
      </Card>

      {/* Additional Information Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="note-text" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Additional Information</Text>
          </View>
          <FormField
            label="Notes"
            value={formData.notes}
            onChangeText={handleChange('notes')}
            placeholder="Enter any additional notes"
            multiline
            numberOfLines={4}
          />
        </Card.Content>
      </Card>

      <Surface style={styles.submitContainer} elevation={4}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          contentStyle={styles.submitButton}
          icon={mode === 'create' ? 'plus-circle' : 'content-save'}
          theme={customTheme}
        >
          {mode === 'create' ? 'Create Client' : 'Update Client'}
        </Button>
      </Surface>
    </ScrollView>
  );
};

export default NewClientForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#transparent',
    paddingBottom: 66,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    marginLeft: 12,
    fontWeight: '700',
    fontSize: 16,
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#ffffff',
  },
  sectionInner: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  disabledInput: {
    backgroundColor: '#ffffff',
    borderColor: '#dee2e6',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    color: '#000000',
    fontSize: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  submitContainer: {
    margin: 16,
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  submitButton: {
    height: 56,
    backgroundColor: '#1976D2',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  socialInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 8,
  },
  socialInputIcon: {
    marginRight: 8,
  },
}); 