import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, HelperText, useTheme, Text, Card, TouchableRipple, Portal, Modal, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

// Define a type for valid icon names
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type Partner = {
  id: number;
  full_name: string;
  email: string;
  status: string;
};

type ExpenseCategory = {
  id: number;
  name: string;
  description: string;
  icon?: string;
};

type ExpenseFormData = {
  description: string;
  amount: string;
  category_id: string;
  expense_date: string;
  partner_id: string;
  notes?: string;
};

type Expense = {
  id: number;
  description: string;
  amount: number;
  category_id: number;
  expense_date: string;
  partner_id: number;
  receipt_url?: string;
  notes?: string;
};

type Props = {
  onSubmit: (data: any) => Promise<void>;
  initialData?: Expense;
};

export const ExpenseEntryForm: React.FC<Props> = ({ onSubmit, initialData }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: initialData?.description || '',
    amount: initialData?.amount?.toString() || '',
    category_id: initialData?.category_id?.toString() || '',
    expense_date: initialData?.expense_date || new Date().toISOString().split('T')[0],
    partner_id: initialData?.partner_id?.toString() || '',
    notes: initialData?.notes || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});
  const [partners, setPartners] = useState<Partner[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Add state for select menus
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [partnerMenuVisible, setPartnerMenuVisible] = useState(false);
  
  useEffect(() => {
    loadPartners();
    loadCategories();
  }, []);

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, full_name, email, status')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Add icons to categories if they don't have them
      const categoriesWithIcons = (data || []).map(category => {
        if (!category.icon) {
          // Assign default icons based on category name
          const defaultIcons: {[key: string]: string} = {
            'Food': 'food',
            'Travel': 'airplane',
            'Office': 'office-building',
            'Utilities': 'flash',
            'Rent': 'home',
            'Salaries': 'account-cash',
            'Marketing': 'bullhorn',
            'Equipment': 'laptop',
            'Software': 'microsoft',
            'Insurance': 'shield-check',
            'Taxes': 'file-document',
            'Entertainment': 'ticket',
            'Transportation': 'car',
            'Maintenance': 'tools',
          };
          
          // Try to find a matching icon or use a default
          const icon = defaultIcons[category.name] || 
                    Object.entries(defaultIcons).find(([key]) => 
                      category.name.toLowerCase().includes(key.toLowerCase()))?.[1] || 
                    'cash';
          
          return { ...category, icon };
        }
        return category;
      });
      
      setCategories(categoriesWithIcons);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Helper function to validate date format YYYY-MM-DD
  const isValidDateFormat = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  // Helper function to handle date input change
  const handleDateChange = (text: string) => {
    // Allow user to type date in YYYY-MM-DD format
    setFormData(prev => ({ ...prev, expense_date: text }));
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ExpenseFormData, string>> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.expense_date) {
      newErrors.expense_date = 'Date is required';
    } else if (!isValidDateFormat(formData.expense_date)) {
      newErrors.expense_date = 'Please enter a valid date in YYYY-MM-DD format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const expenseData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        expense_date: formData.expense_date,
        "partner-id": formData.partner_id ? parseInt(formData.partner_id) : null,
        notes: formData.notes,
      };
      await onSubmit(expenseData);
    } catch (error) {
      console.error('Error submitting expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategoryName = () => {
    const category = categories.find(c => c.id.toString() === formData.category_id);
    return category ? category.name : 'Select Category';
  };

  const getSelectedCategoryIcon = (): IconName => {
    const category = categories.find(c => c.id.toString() === formData.category_id);
    return (category?.icon || 'shape-outline') as IconName;
  };

  const getSelectedPartnerName = () => {
    const partner = partners.find(p => p.id.toString() === formData.partner_id);
    return partner ? partner.full_name : 'Select Partner (Optional)';
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.formCard} elevation={2}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color={theme.colors.primary} />
            </View>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              {initialData ? 'Edit Expense' : 'New Expense'}
            </Text>
          </View>

          <View style={styles.formContent}>
            {/* Description */}
            <View style={styles.fieldContainer}>
              <TextInput
                label="Description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                mode="outlined"
                error={!!errors.description}
                style={styles.input}
                placeholder="What was this expense for?"
              />
              <HelperText type="error" visible={!!errors.description}>
                {errors.description}
              </HelperText>
            </View>

            {/* Amount */}
            <View style={styles.fieldContainer}>
              <TextInput
                label="Amount"
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                mode="outlined"
                keyboardType="decimal-pad"
                error={!!errors.amount}
                style={styles.input}
                left={<TextInput.Affix text="$" />}
                placeholder="0.00"
              />
              <HelperText type="error" visible={!!errors.amount}>
                {errors.amount}
              </HelperText>
            </View>

            {/* Category Select */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Category <Text style={styles.requiredStar}>*</Text></Text>
              <TouchableRipple
                onPress={() => setCategoryMenuVisible(true)}
                style={[
                  styles.selectButton,
                  !!errors.category_id && styles.selectError
                ]}
              >
                <View style={styles.selectContent}>
                  <View style={styles.selectIcon}>
                    <MaterialCommunityIcons
                      name={getSelectedCategoryIcon()}
                      size={22}
                      color={theme.colors.primary}
                    />
                    <Text style={[
                      styles.selectText,
                      !formData.category_id && styles.selectPlaceholder
                    ]}>
                      {getSelectedCategoryName()}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={22}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
              </TouchableRipple>
              <HelperText type="error" visible={!!errors.category_id}>
                {errors.category_id}
              </HelperText>

              <Portal>
                <Modal
                  visible={categoryMenuVisible}
                  onDismiss={() => setCategoryMenuVisible(false)}
                  contentContainerStyle={styles.modalContainer}
                >
                  <Card style={styles.modalCard}>
                    <Card.Content>
                      <View style={styles.modalHeader}>
                        <Text variant="titleMedium" style={styles.modalTitle}>Select Category</Text>
                        <IconButton 
                          icon="close" 
                          size={20} 
                          onPress={() => setCategoryMenuVisible(false)} 
                        />
                      </View>
                      <ScrollView style={styles.modalScroll}>
                        <View style={styles.categoryGrid}>
                          {categories.map((category) => (
                            <TouchableRipple
                              key={category.id}
                              onPress={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  category_id: category.id.toString()
                                }));
                                setCategoryMenuVisible(false);
                              }}
                              style={[
                                styles.categoryItem,
                                formData.category_id === category.id.toString() && styles.categoryItemSelected
                              ]}
                            >
                              <View style={styles.categoryContent}>
                                <MaterialCommunityIcons
                                  name={(category.icon || 'shape-outline') as IconName}
                                  size={24}
                                  color={formData.category_id === category.id.toString() ? theme.colors.primary : theme.colors.onSurfaceVariant}
                                />
                                <Text style={styles.categoryText}>{category.name}</Text>
                              </View>
                            </TouchableRipple>
                          ))}
                        </View>
                      </ScrollView>
                    </Card.Content>
                  </Card>
                </Modal>
              </Portal>
            </View>

            {/* Date picker */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Date <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                value={formData.expense_date}
                onChangeText={handleDateChange}
                mode="outlined"
                error={!!errors.expense_date}
                style={styles.input}
                placeholder="YYYY-MM-DD"
                keyboardType="default"
              />
              <HelperText type="error" visible={!!errors.expense_date}>
                {errors.expense_date}
              </HelperText>
            </View>

            {/* Partner Select */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Partner</Text>
              <TouchableRipple
                onPress={() => setPartnerMenuVisible(true)}
                style={[
                  styles.selectButton,
                  !!errors.partner_id && styles.selectError
                ]}
              >
                <View style={styles.selectContent}>
                  <View style={styles.selectIcon}>
                    <MaterialCommunityIcons
                      name="account"
                      size={22}
                      color={theme.colors.primary}
                    />
                    <Text style={[
                      styles.selectText,
                      !formData.partner_id && styles.selectPlaceholder
                    ]}>
                      {getSelectedPartnerName()}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={22}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
              </TouchableRipple>
              <HelperText type="error" visible={!!errors.partner_id}>
                {errors.partner_id}
              </HelperText>

              <Portal>
                <Modal
                  visible={partnerMenuVisible}
                  onDismiss={() => setPartnerMenuVisible(false)}
                  contentContainerStyle={styles.modalContainer}
                >
                  <Card style={styles.modalCard}>
                    <Card.Content>
                      <View style={styles.modalHeader}>
                        <Text variant="titleMedium" style={styles.modalTitle}>Select Partner</Text>
                        <IconButton 
                          icon="close" 
                          size={20} 
                          onPress={() => setPartnerMenuVisible(false)} 
                        />
                      </View>
                      <ScrollView style={styles.modalScroll}>
                        {partners.map((partner) => (
                          <TouchableRipple
                            key={partner.id}
                            onPress={() => {
                              setFormData(prev => ({
                                ...prev,
                                partner_id: partner.id.toString()
                              }));
                              setPartnerMenuVisible(false);
                            }}
                            style={[
                              styles.modalItem,
                              formData.partner_id === partner.id.toString() && styles.modalItemSelected
                            ]}
                          >
                            <Text style={styles.modalItemText}>{partner.full_name}</Text>
                          </TouchableRipple>
                        ))}
                      </ScrollView>
                    </Card.Content>
                  </Card>
                </Modal>
              </Portal>
            </View>

            {/* Notes */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="Additional details about this expense"
              />
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              labelStyle={styles.submitButtonLabel}
            >
              {loading ? 'Submitting...' : initialData ? 'Update Expense' : 'Save Expense'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default ExpenseEntryForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    marginBottom: 65,
  },
  formCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  formContent: {
    gap: 8,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.7)',
  },
  requiredStar: {
    color: 'red',
  },
  input: {
    backgroundColor: 'transparent',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 14,
  },
  selectError: {
    borderColor: '#ef4444',
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectText: {
    fontSize: 16,
  },
  selectPlaceholder: {
    opacity: 0.5,
  },
  modalContainer: {
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalItemSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  modalItemText: {
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  categoryContent: {
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 4,
  },
  submitButtonContent: {
    height: 48,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  }
}); 