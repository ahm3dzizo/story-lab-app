import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { 
  Text, 
  Surface, 
  TextInput, 
  Button, 
  Divider, 
  useTheme, 
  Menu,
  Chip,
  HelperText,
  IconButton,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { routes } from '@/app/routes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

interface Client {
  id: number;
  company_name: string;
}

interface User {
  id: number;
  full_name: string;
}

export default function NewTaskScreen() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientMenuVisible, setClientMenuVisible] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default: 1 week from now
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const priorityOptions = [
    { label: 'Low', value: 'low', color: '#8BC34A' },
    { label: 'Medium', value: 'medium', color: '#FFC107' },
    { label: 'High', value: 'high', color: '#FF9800' },
    { label: 'Urgent', value: 'urgent', color: '#F44336' },
  ];

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name');

    if (error) {
      console.error('Error fetching clients:', error);
      return;
    }

    setClients(data || []);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      console.log('Trying to fetch users with numeric IDs...');
      
      // Try fetching from users table (which might have numeric IDs)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name')
        .order('full_name');
        
      if (!usersError && usersData && usersData.length > 0) {
        console.log('Successfully fetched users from users table');
        console.log('First user:', usersData[0]);
        
        // Verify that the IDs are numbers, not strings
        const usersWithNumericIds = usersData.filter(user => typeof user.id === 'number');
        
        if (usersWithNumericIds.length > 0) {
          setUsers(usersWithNumericIds);
          setLoadingData(false);
          return;
        } else {
          console.log('No users with numeric IDs found in users table');
        }
      } else {
        console.log('Could not fetch from users table, trying employees table');
        
        // Try the employees table, which might have numeric IDs
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, first_name, last_name')
          .order('first_name');
          
        if (!employeesError && employeesData && employeesData.length > 0) {
          console.log('Successfully fetched users from employees table');
          
          // Map employee data to user format
          const employeeUsers = employeesData.map(employee => ({
            id: employee.id,
            full_name: `${employee.first_name} ${employee.last_name}`.trim()
          }));
          
          console.log('First mapped employee:', employeeUsers[0]);
          setUsers(employeeUsers);
          setLoadingData(false);
          return;
        } else {
          console.log('Could not fetch from employees table either');
        }
      }
      
      // As a fallback, create some dummy users with numeric IDs
      console.log('No valid tables found, using demo users with numeric IDs');
      setUsers([
        { id: 1, full_name: 'Demo User 1' },
        { id: 2, full_name: 'Demo User 2' },
        { id: 3, full_name: 'Demo User 3' }
      ]);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      
      // Fallback to dummy data for testing
      setUsers([
        { id: 1, full_name: 'Test User 1' },
        { id: 2, full_name: 'Test User 2' }
      ]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, [fetchClients, fetchUsers]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!selectedUser) {
      newErrors.user = 'Please assign this task to a user';
    }

    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Make sure we have a user selected
      if (!selectedUser || !selectedUser.id) {
        setSnackbarMessage('Please select a user to assign the task to');
                setSnackbarVisible(true);
                setLoading(false);
                return;
              }
              
      // Use the selected user as both the assigned user and the creator
      // This avoids the issues with finding the current user's profile
      const taskData = {
        title,
        description,
        status: 'pending',
        priority,
        assigned_to: selectedUser.id,
        created_by: selectedUser.id, // Use the same user for creation
        client_id: selectedClient?.id || null,
        start_date: startDate ? startDate.toISOString() : null,
        due_date: dueDate ? dueDate.toISOString() : null,
      };

      console.log('Creating task with data:', JSON.stringify(taskData));

      // Insert the task
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        setSnackbarMessage('Error creating task: ' + error.message);
        setSnackbarVisible(true);
      } else if (data) {
        setSnackbarMessage('Task created successfully');
        setSnackbarVisible(true);
        
        // Navigate back to tasks list after a short delay
        setTimeout(() => {
          router.push(routes.app.tasks.root);
        }, 1500);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setSnackbarMessage('An error occurred');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priorityValue: string) => {
    const option = priorityOptions.find(opt => opt.value === priorityValue);
    return option ? option.color : '#FFC107';
  };

  const renderDatePicker = (
    dateValue: Date | null, 
    setDateFunction: React.Dispatch<React.SetStateAction<Date | null>>,
    showPicker: boolean,
    setShowPicker: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (Platform.OS === 'ios') {
      return (
        <DateTimePicker
          value={dateValue || new Date()}
          mode="date"
          display="inline"
          onChange={(event, selectedDate) => {
            setDateFunction(selectedDate || dateValue);
          }}
          minimumDate={new Date()}
          style={{ height: 120, marginTop: 8 }}
        />
      );
    }

    return (
      <>
        <Button 
          mode="outlined" 
          onPress={() => setShowPicker(true)}
          style={styles.dateButton}
          icon="calendar"
        >
          {dateValue ? moment(dateValue).format('MMM D, YYYY') : 'Select Date'}
        </Button>

        {showPicker && (
          <DateTimePicker
            value={dateValue || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) {
                setDateFunction(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}
      </>
    );
  };

  return (
    <AppLayout>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <Surface style={styles.formContainer} elevation={1}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Create New Task</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => router.back()}
              />
            </View>
            <Divider />

            {loadingData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Title*</Text>
                  <TextInput
                    mode="outlined"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter task title"
                    error={!!errors.title}
                  />
                  {errors.title && <HelperText type="error">{errors.title}</HelperText>}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    mode="outlined"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter task description"
                    multiline
                    numberOfLines={4}
                    style={styles.textArea}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Priority</Text>
                  <Menu
                    visible={priorityMenuVisible}
                    onDismiss={() => setPriorityMenuVisible(false)}
                    anchor={
                      <Button 
                        mode="outlined" 
                        onPress={() => setPriorityMenuVisible(true)}
                        style={styles.dropdown}
                      >
                        <View style={styles.priorityButton}>
                          <View 
                            style={[
                              styles.priorityIndicator, 
                              { backgroundColor: getPriorityColor(priority) }
                            ]} 
                          />
                          <Text>
                            {priorityOptions.find(opt => opt.value === priority)?.label || 'Medium'}
                          </Text>
                        </View>
                      </Button>
                    }
                  >
                    {priorityOptions.map((option) => (
                      <Menu.Item
                        key={option.value}
                        onPress={() => {
                          setPriority(option.value);
                          setPriorityMenuVisible(false);
                        }}
                        title={
                          <View style={styles.priorityMenuItem}>
                            <View 
                              style={[
                                styles.priorityIndicator, 
                                { backgroundColor: option.color }
                              ]} 
                            />
                            <Text>{option.label}</Text>
                          </View>
                        }
                      />
                    ))}
                  </Menu>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Client (Optional)</Text>
                  <Menu
                    visible={clientMenuVisible}
                    onDismiss={() => setClientMenuVisible(false)}
                    anchor={
                      <Button 
                        mode="outlined" 
                        onPress={() => setClientMenuVisible(true)}
                        style={styles.dropdown}
                        icon="office-building"
                      >
                        {selectedClient ? selectedClient.company_name : 'Select Client'}
                      </Button>
                    }
                  >
                    {clients.map((client) => (
                      <Menu.Item
                        key={client.id}
                        onPress={() => {
                          setSelectedClient(client);
                          setClientMenuVisible(false);
                        }}
                        title={client.company_name}
                      />
                    ))}
                  </Menu>
                  {selectedClient && (
                    <Chip 
                      style={styles.chip} 
                      onClose={() => setSelectedClient(null)}
                      icon="office-building"
                    >
                      {selectedClient.company_name}
                    </Chip>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Assign To*</Text>
                  <Menu
                    visible={userMenuVisible}
                    onDismiss={() => setUserMenuVisible(false)}
                    anchor={
                      <Button 
                        mode="outlined" 
                        onPress={() => {
                          if (users.length === 0) {
                            // If no users are loaded, try fetching them again
                            setLoadingData(true);
                            fetchUsers();
                            setSnackbarMessage('Loading users...');
                            setSnackbarVisible(true);
                          } else {
                            setUserMenuVisible(true);
                          }
                        }}
                        style={styles.dropdown}
                        icon="account"
                      >
                        {selectedUser ? selectedUser.full_name : 'Select User'}
                      </Button>
                    }
                  >
                    {users.length > 0 ? (
                      users.map((user) => (
                        <Menu.Item
                          key={user.id}
                          onPress={() => {
                            setSelectedUser(user);
                            setUserMenuVisible(false);
                          }}
                          title={user.full_name || `User ${user.id}`}
                        />
                      ))
                    ) : (
                      <Menu.Item
                        title="No users available"
                        disabled
                      />
                    )}
                  </Menu>
                  {errors.user && <HelperText type="error">{errors.user}</HelperText>}
                  {selectedUser && (
                    <Chip 
                      style={styles.chip} 
                      onClose={() => setSelectedUser(null)}
                      icon="account"
                    >
                      {selectedUser.full_name || `User ${selectedUser.id}`}
                    </Chip>
                  )}
                  {users.length === 0 && !loadingData && (
                    <HelperText type="info">
                      No users available. Please check your database connection.
                    </HelperText>
                  )}
                </View>

                <View style={styles.dateFieldsContainer}>
                  <View style={[styles.formGroup, styles.dateField]}>
                    <Text style={styles.label}>Start Date</Text>
                    {renderDatePicker(
                      startDate,
                      setStartDate,
                      showStartDatePicker,
                      setShowStartDatePicker
                    )}
                  </View>

                  <View style={[styles.formGroup, styles.dateField]}>
                    <Text style={styles.label}>Due Date*</Text>
                    {renderDatePicker(
                      dueDate,
                      setDueDate,
                      showDueDatePicker,
                      setShowDueDatePicker
                    )}
                    {errors.dueDate && <HelperText type="error">{errors.dueDate}</HelperText>}
                  </View>
                </View>

                <View style={styles.formActions}>
                  <Button 
                    mode="outlined" 
                    onPress={() => router.back()}
                    style={[styles.actionButton, styles.cancelButton]}
                  >
                    Cancel
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={handleSubmit}
                    style={styles.actionButton}
                    loading={loading}
                    disabled={loading}
                  >
                    Create Task
                  </Button>
                </View>
              </>
            )}
          </Surface>
        </ScrollView>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </SafeAreaView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#transparent',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  formContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    marginBottom: 50,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  formGroup: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  textArea: {
    minHeight: 100,
    backgroundColor: '#0f172a',
  },
  dropdown: {
    marginBottom: 8,
    justifyContent: 'flex-start',
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(58, 120, 255, 0.2)',
  },
  dateFieldsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  dateField: {
    flex: 1,
    marginTop: 0,
    marginRight: 8,
  },
  dateButton: {
    justifyContent: 'flex-start',
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  actionButton: {
    minWidth: 120,
  },
  cancelButton: {
    marginRight: 12,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#fff',
  },
  snackbar: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  standaloneHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
}); 