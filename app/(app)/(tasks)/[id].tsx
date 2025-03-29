import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert, Share, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Surface, 
  Button, 
  Divider, 
  Chip, 
  ActivityIndicator, 
  IconButton,
  Menu,
  Portal,
  Dialog,
  Snackbar,
  useTheme,
  Card,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { routes } from '@/app/routes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: number;
  created_by: number;
  due_date: string;
  start_date: string;
  completion_date: string | null;
  client_id?: number;
  client?: {
    id: number;
    company_name: string;
  };
  assigned_user?: {
    id: number;
    full_name: string;
  };
  created_user?: {
    id: number;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
}

const statusColors = {
  pending: '#FFC107',
  in_progress: '#2196F3',
  completed: '#4CAF50',
  cancelled: '#F44336',
};

const priorityColors = {
  low: '#8BC34A',
  medium: '#FFC107',
  high: '#FF9800',
  urgent: '#F44336',
};

export default function TaskDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState<'delete' | 'complete' | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchTask = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // First fetch the task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (taskError) {
        console.error('Error fetching task:', taskError);
        return;
      }
      
      // If task has assigned_to or created_by, fetch user information from users table instead of profiles
      if (taskData) {
        const userIds = [];
        
        if (taskData.assigned_to) userIds.push(taskData.assigned_to);
        if (taskData.created_by) userIds.push(taskData.created_by);
        
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', userIds);
            
          if (usersData) {
            // Create a map of user data by ID for quick lookup
            const userMap: Record<number, {id: number, full_name: string}> = {};
            usersData.forEach(user => {
              userMap[user.id] = user;
            });
            
            // Add assigned user information
            if (taskData.assigned_to && userMap[taskData.assigned_to]) {
              taskData.assigned_user = userMap[taskData.assigned_to];
            }
            
            // Add created user information
            if (taskData.created_by && userMap[taskData.created_by]) {
              taskData.created_user = userMap[taskData.created_by];
            }
          }
        }
      }
      
      // If task has client_id, fetch the client information separately
      if (taskData && taskData.client_id) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, company_name')
          .eq('id', taskData.client_id)
          .single();
          
        if (!clientError && clientData) {
          // Add client to the task data
          taskData.client = clientData;
        }
      }
      
      setTask(taskData);
    } catch (error) {
      console.error('Error in fetchTask:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const updateTaskStatus = async (newStatus: string) => {
    if (!task) return;

    try {
      let updateData: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completion_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id);

      if (error) {
        console.error('Error updating task status:', error);
        setSnackbarMessage('Failed to update task status');
      } else {
        setSnackbarMessage(`Task marked as ${newStatus.replace('_', ' ')}`);
        fetchTask();
      }
    } catch (error) {
      console.error('Error in updateTaskStatus:', error);
      setSnackbarMessage('An error occurred');
    } finally {
      setSnackbarVisible(true);
    }
  };

  const deleteTask = async () => {
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) {
        console.error('Error deleting task:', error);
        setSnackbarMessage('Failed to delete task');
        setSnackbarVisible(true);
      } else {
        setSnackbarMessage('Task deleted successfully');
        setSnackbarVisible(true);
        
        // Navigate back to tasks list after a short delay
        setTimeout(() => {
          router.push(routes.app.tasks.root);
        }, 1500);
      }
    } catch (error) {
      console.error('Error in deleteTask:', error);
      setSnackbarMessage('An error occurred');
      setSnackbarVisible(true);
    }
  };

  const confirmAction = (action: 'delete' | 'complete') => {
    setConfirmDialogAction(action);
    setConfirmDialogVisible(true);
  };

  const handleConfirmAction = () => {
    setConfirmDialogVisible(false);
    
    if (confirmDialogAction === 'delete') {
      deleteTask();
    } else if (confirmDialogAction === 'complete') {
      updateTaskStatus('completed');
    }
  };

  const shareTask = async () => {
    if (!task) return;

    try {
      const dueDate = task.due_date ? moment(task.due_date).format('MMM D, YYYY') : 'No due date';
      const assignedTo = task.assigned_user?.full_name || 'Unassigned';
      const priority = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      
      const message = `Task: ${task.title}\n\nDescription: ${task.description || 'No description'}\n\nDue Date: ${dueDate}\nAssigned To: ${assignedTo}\nPriority: ${priority}\nStatus: ${task.status.replace('_', ' ')}`;
      
      await Share.share({
        message,
        title: `Task: ${task.title}`,
      });
    } catch (error) {
      console.error('Error sharing task:', error);
    }
  };

  const renderTaskDetails = () => {
    if (!task) return null;

    const dueDate = task.due_date ? moment(task.due_date).format('MMM D, YYYY') : 'No due date';
    const startDate = task.start_date ? moment(task.start_date).format('MMM D, YYYY') : 'Not set';
    const completionDate = task.completion_date ? moment(task.completion_date).format('MMM D, YYYY') : 'Not completed';
    const isPastDue = task.due_date && moment(task.due_date).isBefore(moment()) && task.status !== 'completed';
    
    return (
      <>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#3a78ff" />
            <Text style={styles.title}>{task.title}</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <IconButton
                icon="pencil"
                mode="contained"
                size={20}
                onPress={() => console.log('Edit task')}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <IconButton
                icon="share-variant"
                mode="contained"
                size={20}
                onPress={shareTask}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <IconButton
                icon="delete"
                mode="contained"
                size={20}
                onPress={() => confirmAction('delete')}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.statusSection}>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { backgroundColor: statusColors[task.status] }]}
            textStyle={{ color: 'white', fontWeight: 'bold' }}
          >
            {task.status.replace('_', ' ')}
          </Chip>

          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Button 
                mode="contained" 
                onPress={() => setStatusMenuVisible(true)}
                style={styles.statusButton}
                icon="arrow-down-drop-circle"
              >
                Change Status
              </Button>
            }
          >
            <Menu.Item 
              onPress={() => {
                setStatusMenuVisible(false);
                updateTaskStatus('pending');
              }} 
              title="Pending" 
            />
            <Menu.Item 
              onPress={() => {
                setStatusMenuVisible(false);
                updateTaskStatus('in_progress');
              }} 
              title="In Progress" 
            />
            <Menu.Item 
              onPress={() => {
                setStatusMenuVisible(false);
                confirmAction('complete');
              }} 
              title="Completed" 
            />
            <Menu.Item 
              onPress={() => {
                setStatusMenuVisible(false);
                updateTaskStatus('cancelled');
              }} 
              title="Cancelled" 
            />
          </Menu>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue}>
              {task.description || 'No description provided'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Priority:</Text>
            <View style={styles.priorityContainer}>
              <MaterialCommunityIcons name="flag" size={16} color={priorityColors[task.priority]} />
              <Text style={[styles.detailValue, { marginLeft: 4, color: priorityColors[task.priority], fontWeight: 'bold' }]}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={[styles.detailValue, isPastDue && styles.pastDue]}>
              {dueDate}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date:</Text>
            <Text style={styles.detailValue}>{startDate}</Text>
          </View>
          
          {task.status === 'completed' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Completion Date:</Text>
              <Text style={styles.detailValue}>{completionDate}</Text>
            </View>
          )}
          
          {task.client && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Client:</Text>
              <TouchableOpacity 
                onPress={() => task.client && router.push(`/clients/${task.client.id}`)}
                activeOpacity={0.7}
              >
                <Text style={[styles.detailValue, styles.linkText]}>
                  {task.client.company_name}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {task.assigned_user && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned To:</Text>
              <Text style={styles.detailValue}>{task.assigned_user.full_name}</Text>
            </View>
          )}
          
          {task.created_user && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created By:</Text>
              <Text style={styles.detailValue}>{task.created_user.full_name}</Text>
            </View>
          )}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.actionsContainer}>
          <Button 
            mode="outlined" 
            icon="delete" 
            onPress={() => confirmAction('delete')}
            style={[styles.actionButton, { borderColor: 'rgba(255, 59, 48, 0.4)', borderWidth: 1.5 }]}
            textColor={theme.colors.error}
          >
            Delete Task
          </Button>
          {task.status !== 'completed' && (
            <Button 
              mode="contained" 
              icon="check-circle" 
              onPress={() => confirmAction('complete')}
              style={styles.actionButton}
            >
              Complete Task
            </Button>
          )}
        </View>

        <View style={styles.timestamps}>
          <Text style={styles.timestamp}>Created: {moment(task.created_at).format('MMM D, YYYY h:mm A')}</Text>
          <Text style={styles.timestamp}>Updated: {moment(task.updated_at).format('MMM D, YYYY h:mm A')}</Text>
        </View>
      </>
    );
  };

  return (
    <AppLayout>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.standaloneHeader}>
            <Button
              icon="arrow-left"
              mode="text"
              textColor="#fff"
              onPress={() => router.push(routes.app.tasks.root)}
              style={styles.backButton}
            >
              Back to Tasks
            </Button>
          </View>
          
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <Card style={styles.card}>
              <Card.Content>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading task...</Text>
                  </View>
                ) : (
                  renderTaskDetails()
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        </View>

        <Portal>
          <Dialog visible={confirmDialogVisible} onDismiss={() => setConfirmDialogVisible(false)}>
            <Dialog.Title>
              {confirmDialogAction === 'delete' ? 'Delete Task' : 'Complete Task'}
            </Dialog.Title>
            <Dialog.Content>
              <Text>
                {confirmDialogAction === 'delete' 
                  ? 'Are you sure you want to delete this task? This action cannot be undone.' 
                  : 'Are you sure you want to mark this task as completed?'}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmDialogVisible(false)}>Cancel</Button>
              <Button onPress={handleConfirmAction}>
                {confirmDialogAction === 'delete' ? 'Delete' : 'Complete'}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
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
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
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
  card: {
    borderRadius: 12,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 4, 
    marginLeft: 8,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  statusChip: {
    height: 32,
  },
  statusButton: {
    height: 36,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsContainer: {
    paddingVertical: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pastDue: {
    color: '#F44336',
  },
  linkText: {
    color: '#3a78ff',
    textDecorationLine: 'underline',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  actionButton: {
    minWidth: 140,
  },
  timestamps: {
    padding: 16,
    paddingTop: 0,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
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
}); 