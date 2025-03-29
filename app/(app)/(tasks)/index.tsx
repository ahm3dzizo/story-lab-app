import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { 
  Text, 
  Surface, 
  ActivityIndicator, 
  Searchbar, 
  Chip, 
  TouchableRipple, 
  Button, 
  FAB,
  IconButton,
  Divider,
  Menu,
  useTheme,
  Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { router } from 'expo-router';
import { routes } from '@/app/routes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import moment from 'moment';

type Task = {
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
  created_at: string;
};

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

export default function TasksScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<number | null>(null);
  const [clientMenuVisible, setClientMenuVisible] = useState(false);
  const [clients, setClients] = useState<{id: number, company_name: string}[]>([]);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-300)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = Dimensions.get('window');
  const MENU_WIDTH = Math.min(300, screenWidth * 0.8);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter) {
        query = query.eq('priority', priorityFilter);
      }

      if (clientFilter) {
        query = query.eq('client_id', clientFilter);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        setTasks(data || []);
        
        // If tasks have assigned_to or client_id, fetch that information separately
        if (data && data.length > 0) {
          // Get all unique user IDs for users assigned to tasks
          const userIds = data
            .filter(task => task.assigned_to)
            .map(task => task.assigned_to);
          
          // Get all unique client IDs
          const clientIds = data
            .filter(task => task.client_id)
            .map(task => task.client_id);
          
          // Fetch user information if we have user IDs, but from users table instead of profiles
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
              
              // Add user information to tasks
              data.forEach(task => {
                if (task.assigned_to && userMap[task.assigned_to]) {
                  task.assigned_user = userMap[task.assigned_to];
                }
              });
            }
          }
          
          // Fetch client information if we have client IDs
          if (clientIds.length > 0) {
            const { data: clientsData } = await supabase
              .from('clients')
              .select('id, company_name')
              .in('id', clientIds);
            
            if (clientsData) {
              // Create a map of client data by ID for quick lookup
              const clientMap: Record<number, {id: number, company_name: string}> = {};
              clientsData.forEach(client => {
                clientMap[client.id] = client;
              });
              
              // Add client information to tasks
              data.forEach(task => {
                if (task.client_id && clientMap[task.client_id]) {
                  task.client = clientMap[task.client_id];
                }
              });
            }
          }
          
          setTasks([...data]);
        }
      }
    } catch (error) {
      console.error('Error in fetchTasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, priorityFilter, clientFilter, searchQuery]);

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name');

      if (error) {
        console.error('Error fetching clients:', error);
      } else {
        setClients(data || []);
      }
    } catch (error) {
      console.error('Error in fetchClients:', error);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchClients();
  }, [fetchTasks, fetchClients]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, [fetchTasks]);

  const renderTaskItem = ({ item }: { item: Task }) => {
    const dueDate = item.due_date ? moment(item.due_date).format('MMM D, YYYY') : 'No due date';
    const isPastDue = item.due_date && moment(item.due_date).isBefore(moment()) && item.status !== 'completed';
    
    return (
      <TouchableOpacity
        onPress={() => router.push(routes.app.tasks.profile(item.id))}
        style={styles.taskItem}
        activeOpacity={0.7}
      >
        <Surface style={styles.taskSurface} elevation={2}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { backgroundColor: statusColors[item.status] }]}
              textStyle={{ color: 'white', fontWeight: 'bold' }}
            >
              {item.status.replace('_', ' ')}
            </Chip>
          </View>
          <Text numberOfLines={2} style={styles.taskDescription}>
            {item.description || 'No description'}
          </Text>
          <View style={styles.taskFooter}>
            <View style={styles.taskMeta}>
              <MaterialCommunityIcons name="calendar" size={16} color="rgba(255, 255, 255, 0.7)" />
              <Text style={[styles.taskDueDate, isPastDue && styles.pastDue]}>
                {dueDate}
              </Text>
            </View>
            <View style={styles.taskMeta}>
              <MaterialCommunityIcons name="flag" size={16} color={priorityColors[item.priority]} />
              <Text style={{ marginLeft: 4, color: priorityColors[item.priority], fontWeight: 'bold' }}>
                {item.priority}
              </Text>
            </View>
            {item.client && (
              <View style={styles.taskMeta}>
                <MaterialCommunityIcons name="office-building" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={{ marginLeft: 4, color: '#fff' }}>{item.client.company_name}</Text>
              </View>
            )}
            {item.assigned_user && (
              <View style={styles.taskMeta}>
                <MaterialCommunityIcons name="account" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={{ marginLeft: 4, color: '#fff' }}>{item.assigned_user.full_name}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cardActions}>
            <Button
              mode="outlined"
              icon={item.status === 'completed' ? "check-circle" : "check-circle-outline"}
              textColor={item.status === 'completed' ? "#4CAF50" : "#fff"}
              style={[styles.actionButton, { 
                borderColor: item.status === 'completed' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 255, 255, 0.3)', 
                borderWidth: item.status === 'completed' ? 1.5 : 0.5 
              }]}
              contentStyle={{ height: 36, paddingHorizontal: 4 }}
              labelStyle={{ fontSize: 12, fontWeight: '500', marginVertical: 4 }}
              onPress={(e) => {
                e.stopPropagation();
                // Handle completing task logic here
              }}
            >
              {item.status === 'completed' ? 'Completed' : 'Complete'}
            </Button>
            
            <Button
              mode="contained"
              icon="open-in-new"
              style={[styles.actionButton, { borderWidth: 0 }]}
              contentStyle={{ height: 36, paddingHorizontal: 4 }}
              labelStyle={{ fontSize: 12, fontWeight: '500', marginVertical: 4 }}
              buttonColor="rgba(58, 120, 255, 0.25)"
              textColor="#fff"
              onPress={(e) => {
                e.stopPropagation();
                router.push(routes.app.tasks.profile(item.id));
              }}
            >
              Details
            </Button>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={theme.colors.onSurfaceVariant} />
      <Text style={styles.emptyText}>No tasks found</Text>
      <Text style={styles.emptySubText}>
        {searchQuery || statusFilter || priorityFilter || clientFilter 
          ? 'Try changing your filters' 
          : 'Create a new task to get started'}
      </Text>
      <Button 
        mode="contained" 
        onPress={() => router.push(routes.app.tasks.new)}
        style={{ marginTop: 16 }}
      >
        Create Task
      </Button>
    </View>
  );

  const toggleFilterMenu = () => {
    if (filterMenuVisible) {
      // Close menu
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFilterMenuVisible(false);
      });
    } else {
      // Open menu
      setFilterMenuVisible(true);
      slideAnim.setValue(-MENU_WIDTH);
      backdropOpacity.setValue(0);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const applyFilters = () => {
    fetchTasks();
    toggleFilterMenu();
  };

  const resetFilters = () => {
    setStatusFilter(null);
    setPriorityFilter(null);
    setClientFilter(null);
    fetchTasks();
    toggleFilterMenu();
  };

  return (
    <AppLayout>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant="titleLarge" style={styles.title}>
                Task Management
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.headerButtonWrapper}
                  onPress={() => router.push(routes.app.tasks.new)}
                  activeOpacity={0.7}
                >
                  <Button
                    mode="contained"
                    icon="clipboard-plus"
                    style={styles.headerButton}
                    contentStyle={{ height: 45 }}
                  >
                    New Task
                  </Button>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchRow}>
              <Searchbar
                placeholder="Search tasks..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                onSubmitEditing={fetchTasks}
              />
              <TouchableOpacity 
                onPress={toggleFilterMenu}
                style={[
                  styles.filterButton,
                  (statusFilter || priorityFilter || clientFilter) ? styles.activeFilterButton : null
                ]}
              >
                <MaterialCommunityIcons 
                  name="filter-variant" 
                  size={24} 
                  color={(statusFilter || priorityFilter || clientFilter) ? "#3a78ff" : "#fff"} 
                />
                {(statusFilter || priorityFilter || clientFilter) && (
                  <View style={styles.filterIndicator} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
          ) : (
            <FlatList
              data={tasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmpty}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}

          <View style={styles.fabContainer}>
            <Button 
              mode="contained" 
              onPress={() => router.push(routes.app.tasks.new)}
              icon="plus" 
            >
              Add Task
            </Button>
          </View>

          {/* Filter Slide Menu */}
          {filterMenuVisible && (
            <Portal>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={toggleFilterMenu}
              >
                <Animated.View 
                  style={[
                    StyleSheet.absoluteFill, 
                    styles.backdrop,
                    { opacity: backdropOpacity }
                  ]} 
                />
              </TouchableOpacity>
              
              <Animated.View 
                style={[
                  styles.filterMenu,
                  { 
                    width: MENU_WIDTH,
                    transform: [{ translateX: slideAnim }] 
                  }
                ]}
              >
                <View style={styles.filterMenuHeader}>
                  <Text style={styles.filterMenuTitle}>Filter Tasks</Text>
                  <IconButton
                    icon="close"
                    iconColor="#fff"
                    size={24}
                    onPress={toggleFilterMenu}
                  />
                </View>
                
                <Divider style={styles.filterDivider} />
                
                <ScrollView style={styles.filterMenuContent}>
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Status</Text>
                    <View style={styles.chipContainer}>
                      {[
                        { label: 'All', value: null },
                        { label: 'Pending', value: 'pending' },
                        { label: 'In Progress', value: 'in_progress' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' },
                      ].map((item) => (
                        <Chip
                          key={item.label}
                          selected={statusFilter === item.value}
                          onPress={() => setStatusFilter(item.value)}
                          style={[
                            styles.filterChip,
                            statusFilter === item.value && styles.selectedFilterChip
                          ]}
                          textStyle={[
                            styles.filterChipText,
                            statusFilter === item.value && styles.selectedFilterChipText
                          ]}
                        >
                          {item.label}
                        </Chip>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Priority</Text>
                    <View style={styles.chipContainer}>
                      {[
                        { label: 'All', value: null },
                        { label: 'Low', value: 'low' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'High', value: 'high' },
                        { label: 'Urgent', value: 'urgent' },
                      ].map((item) => (
                        <Chip
                          key={item.label}
                          selected={priorityFilter === item.value}
                          onPress={() => setPriorityFilter(item.value)}
                          style={[
                            styles.filterChip,
                            priorityFilter === item.value && styles.selectedFilterChip
                          ]}
                          textStyle={[
                            styles.filterChipText,
                            priorityFilter === item.value && styles.selectedFilterChipText
                          ]}
                        >
                          {item.label}
                        </Chip>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Client</Text>
                    <Menu
                      visible={clientMenuVisible}
                      onDismiss={() => setClientMenuVisible(false)}
                      anchor={
                        <Button 
                          mode="outlined" 
                          onPress={() => setClientMenuVisible(true)}
                          style={[styles.clientFilterButton, { width: '100%' }]}
                          icon="office-building"
                        >
                          {clientFilter 
                            ? clients.find(c => c.id === clientFilter)?.company_name || 'Select Client' 
                            : 'All Clients'}
                        </Button>
                      }
                    >
                      <Menu.Item 
                        onPress={() => {
                          setClientFilter(null);
                          setClientMenuVisible(false);
                        }} 
                        title="All Clients" 
                      />
                      <Divider />
                      {clients.map(client => (
                        <Menu.Item 
                          key={client.id}
                          onPress={() => {
                            setClientFilter(client.id);
                            setClientMenuVisible(false);
                          }} 
                          title={client.company_name} 
                        />
                      ))}
                    </Menu>
                  </View>
                </ScrollView>
                
                <View style={styles.filterMenuFooter}>
                  <Button 
                    mode="outlined" 
                    onPress={resetFilters}
                    style={styles.filterMenuButton}
                    textColor="#fff"
                  >
                    Reset
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={applyFilters}
                    style={styles.filterMenuButton}
                  >
                    Apply
                  </Button>
                </View>
              </Animated.View>
            </Portal>
          )}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  headerButtonWrapper: {
    marginLeft: 8,
  },
  headerButton: {
    borderRadius: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#0f172a',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  filtersContainer: {
    padding: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipGroupContainer: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#1e293b',
  },
  selectedChip: {
    backgroundColor: '#3a78ff',
  },
  clientFilterContainer: {
    marginTop: 8,
  },
  clientFilterButton: {
    borderRadius: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  taskItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  taskSurface: {
    borderRadius: 12,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 16,
    paddingBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    color: '#fff',
  },
  statusChip: {
    height: 24,
  },
  taskDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  taskFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  taskDueDate: {
    marginLeft: 4,
    color: '#fff',
  },
  pastDue: {
    color: '#F44336',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    marginLeft: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#fff',
  },
  emptySubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 16,
    zIndex: 1,
    marginVertical:55,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeFilterButton: {
    backgroundColor: 'rgba(58, 120, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(58, 120, 255, 0.5)',
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3a78ff',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterMenu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#1e293b',
    zIndex: 1000,
    elevation: 5,
    height: '100%',
  },
  filterMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterMenuContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  selectedFilterChip: {
    backgroundColor: '#3a78ff',
  },
  filterChipText: {
    color: '#fff',
  },
  selectedFilterChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterMenuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterMenuButton: {
    flex: 1,
    marginHorizontal: 8,
  },
}); 