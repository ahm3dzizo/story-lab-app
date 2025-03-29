import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Pressable } from 'react-native';
import { Appbar, Avatar, Badge, IconButton, useTheme, Text } from 'react-native-paper';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme as useAppTheme } from '../../lib/theme/ThemeProvider';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { AppRoutes, routes } from '@/app/routes';
import { black } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import { rgb } from 'color';
import PageNameService from '@/lib/services/pageNames';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showChat?: boolean;
  showGemini?: boolean;
  notificationCount?: number;
  messageCount?: number;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  onChatPress?: () => void;
  onGeminiPress?: () => void;
  onProfilePress?: () => void;
  userAvatar?: string;
  userName?: string;
  loading?: boolean;
}

// Static base page titles
const pageTitles: Record<string, string> = {
  // Main sections
  '': 'Dashboard',
  'dashboard': 'Dashboard',
  'clients': 'Clients',
  'chat': 'Messages',
  'partners': 'Partners',
  'employees': 'Employees',
  'expenses': 'Expenses',
  'settings': 'Settings',
  'profile': 'Profile',
  'notifications': 'Notifications',
  'edit-profile': 'Edit Profile',
  'partner-management': 'Partner Management',
  'partner-profile': 'Partner Profile',

  // Client section
  'client-details': 'Client Details',
  'client-payment': 'Client Payment',
  'payment-history': 'Payment History',
  'subscriptions': 'Subscriptions',
  'contracts': 'Contracts',

  // Partner section
  'partner-details': 'Partner Details',
  'distribution': 'Profit Distribution',
  'commission': 'Commission',
  'partner-expenses': 'Partner Expenses',
  'partner-reports': 'Partner Reports',

  // Employee section
  'employee-details': 'Employee Details',
  'salary': 'Salary Management',
  'departments': 'Departments',
  'positions': 'Job Positions',
  'attendance': 'Attendance Management',
  'leaves': 'Leave Management',
  'documents': 'Documents',
  'performance': 'Performance Reviews',
  'tasks': 'Task Management',
  'training': 'Training',
  'benefits': 'Benefits',

  // Expense section
  'expense-details': 'Expense Details',
  'categories': 'Expense Categories',
  'recurring': 'Recurring Expenses',
  'reimbursements': 'Reimbursements',
  'expense-reports': 'Expense Reports',
  'approvals': 'Expense Approvals',
  'expense-budget': 'Budget Planning',

  // Common actions
  'new': 'New',
  'edit': 'Edit',
  'view': 'View',
  'delete': 'Delete',
  'archive': 'Archive',
  'restore': 'Restore',
  'import': 'Import',
  'export': 'Export',
  'print': 'Print',
  'search': 'Search',
  'filter': 'Filter',
  'sort': 'Sort',
  'reports': 'Reports',
  'help': 'Help',
  'about': 'About',

  // Chat section
  'chat-details': 'Chat Details',
  'group-chat': 'Group Chat',
  'voice-call': 'Voice Call',
  'video-call': 'Video Call',
  'attachments': 'Attachments',
  'shared-media': 'Shared Media',
  'chat-settings': 'Chat Settings',
  'gemini': 'Gemini AI Assistant'
};

export const Header = ({
  title,
  showBack = false,
  showMenu = true,
  showNotifications = true,
  showChat = true,
  showGemini = true,
  notificationCount = 0,
  messageCount = 0,
  onMenuPress,
  onNotificationsPress,
  onChatPress,
  onGeminiPress,
  userAvatar,
  userName,
  loading = false,
}: HeaderProps) => {
  const theme = useTheme();
  const { theme: appTheme } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoadingPageNames, setIsLoadingPageNames] = useState(true);
  const pageNameService = PageNameService.getInstance();
  const [debugInfo, setDebugInfo] = useState('');
  
  // Initialize page name service
  useEffect(() => {
    const loadPageNames = async () => {
      setIsLoadingPageNames(true);
      try {
        console.log('Header: Initializing PageNameService');
        await pageNameService.fetchPageNames();
        
        // Debug: Log keys for employee names specifically
        const employeeNames = pageNameService.employeePageNames;
        const employeeKeys = Object.keys(employeeNames);
        console.log(`Header: Loaded ${employeeKeys.length} employee names:`, 
          employeeKeys.length > 0 ? employeeKeys.slice(0, 5) : 'No employee names found');
        
        if (__DEV__) {
          // Debug log a sample of all page names in development
          const allNames = pageNameService.allNames;
          const sampleKeys = Object.keys(allNames).slice(0, 10);
          console.log('Header: Sample of loaded page names:', 
            sampleKeys.map(key => `${key}: ${allNames[key]}`));
        }
      } catch (error) {
        console.error('Header: Failed to fetch page names:', error);
      } finally {
        setIsLoadingPageNames(false);
      }
    };
    
    loadPageNames();
    
    // Refresh page names every 5 minutes
    const intervalId = setInterval(() => {
      console.log('Header: Refreshing page names');
      pageNameService.fetchPageNames(true).catch(error => {
        console.error('Header: Error refreshing page names:', error);
      });
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Debug logging for pathname changes
  useEffect(() => {
    if (__DEV__) {
      console.log('Current pathname:', pathname);
    }
  }, [pathname]);

  // Just after the useEffect for pathname changes
  useEffect(() => {
    // Debug employee names specifically when we're likely in the employee section
    if ((pathname.includes('employee') || getActualPath().includes('employee')) && 
        pageNameService.employeePageNames) {
      
      console.log('[Employee Names Debug]');
      console.log('Current path:', pathname);
      console.log('Actual path:', getActualPath());
      
      // Log the available employee names
      const employeeNames = pageNameService.employeePageNames;
      const keys = Object.keys(employeeNames);
      console.log(`Available employee names (${keys.length}):`);
      
      if (keys.length > 0) {
        keys.forEach(key => {
          console.log(`- ${key}: ${employeeNames[key]}`);
        });
      } else {
        console.log('No employee names available');
        
        // If no names, try to force a refresh of page names
        pageNameService.fetchPageNames(true).catch(error => {
          console.error('Error fetching employee names:', error);
        });
      }
    }
  }, [pathname, isLoadingPageNames]);

  // Check if debug mode is enabled
  const isDebugMode = (): boolean => {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        // Allow enabling debug mode through localStorage
        const debugEnabled = window.localStorage.getItem('header_debug_mode');
        if (debugEnabled === 'true') {
          return true;
        }
      }
      // Default to false for production
      return false;
    } catch (e) {
      // If accessing localStorage fails, return false
      return false;
    }
  };

  // Map routes from the routes file to screen titles
  const getScreenTitleFromRoute = (path: string): string | null => {
    if (isDebugMode()) {
      console.log('Trying to get screen title for path:', path);
    }
    
    // Root path or app root
    if (!path || path === '/' || path === String(routes.app.root)) {
      return pageTitles['dashboard'];
    }
    
    // DASHBOARD
    if (path.includes(String(routes.app.dashboard))) {
      return pageTitles['dashboard'];
    }
    
    // CLIENTS
    if (path === String(routes.app.clients.root)) {
      return pageTitles['clients'];
    }
    if (path === String(routes.app.clients.new)) {
      return 'New Client';
    }
    
    // PARTNERS
    if (path === String(routes.app.partners.root)) {
      return pageTitles['partners'];
    }
    if (path === String(routes.app.partners.new)) {
      return 'New Partner';
    }
    
    // EMPLOYEES
    if (path === String(routes.app.employees.root)) {
      return pageTitles['employees'];
    }
    if (path === String(routes.app.employees.new)) {
      return 'New Employee';
    }
    
    // EXPENSES
    if (path === String(routes.app.expenses.root)) {
      return pageTitles['expenses'];
    }
    if (path === String(routes.app.expenses.new)) {
      return 'New Expense';
    }
    
    // SETTINGS
    if (path === String(routes.app.settings)) {
      return pageTitles['settings'];
    }
    
    // Check for dynamic route patterns with IDs
    // Employees profile route
    const employeeProfilePattern = String(routes.app.employees.profile(0)).replace('0', '(\\d+)');
    const employeeProfileRegex = new RegExp(employeeProfilePattern);
    const employeeMatch = path.match(employeeProfileRegex);
    if (employeeMatch && employeeMatch[1]) {
      const id = employeeMatch[1];
      const employeeData = pageNameService.employeePageNames;
      return employeeData[`employee-${id}`] || `Employee #${id}`;
    }
    
    // Partners profile route
    const partnerProfilePattern = String(routes.app.partners.profile(0)).replace('0', '(\\d+)');
    const partnerProfileRegex = new RegExp(partnerProfilePattern);
    const partnerMatch = path.match(partnerProfileRegex);
    if (partnerMatch && partnerMatch[1]) {
      const id = partnerMatch[1];
      const partnerData = pageNameService.partnerPageNames;
      return partnerData[`partner-${id}`] || `Partner #${id}`;
    }
    
    // Clients profile route
    const clientProfilePattern = String(routes.app.clients.profile(0)).replace('0', '(\\d+)');
    const clientProfileRegex = new RegExp(clientProfilePattern);
    const clientMatch = path.match(clientProfileRegex);
    if (clientMatch && clientMatch[1]) {
      // We might want to add client names to pageNameService in the future
      return `Client #${clientMatch[1]}`;
    }
    
    // Expenses profile route
    const expenseProfilePattern = String(routes.app.expenses.profile(0)).replace('0', '(\\d+)');
    const expenseProfileRegex = new RegExp(expenseProfilePattern);
    const expenseMatch = path.match(expenseProfileRegex);
    if (expenseMatch && expenseMatch[1]) {
      const id = expenseMatch[1];
      const expenseData = pageNameService.expensePageNames;
      return expenseData[`category-${id}`] || `Expense #${id}`;
    }
    
    // No match found
    return null;
  };

  // Fix for empty paths - determine the actual current screen
  const getActualPath = () => {
    // If path is empty or just root, try to determine the current screen from other signals
    if (!pathname || pathname === '/' || pathname === '/(app)') {
      // First check if we're provided with a title directly
      if (title) return title.toLowerCase();
      
      // Since we can't directly get the current route, we'll use the URL to make a best guess
      try {
        // This is a workaround for when pathname is missing but we're on a specific screen
        // Check if there's any segment in the URL that might indicate the screen
        const url = window.location.href;
        if (isDebugMode()) {
          console.log('Empty path detected. Current URL:', url);
        }
        
        // Map URL segments to routes from the routes file for more reliable detection
        if (url.includes('employee')) {
          if (isDebugMode()) console.log('DETECTED: Employee section from URL');
          return String(routes.app.employees.root);
        }
        if (url.includes('partner')) {
          if (isDebugMode()) console.log('DETECTED: Partner section from URL');
          return String(routes.app.partners.root);
        }
        if (url.includes('expense')) {
          if (isDebugMode()) console.log('DETECTED: Expense section from URL');
          return String(routes.app.expenses.root);
        }
        if (url.includes('setting')) {
          if (isDebugMode()) console.log('DETECTED: Settings section from URL');
          return String(routes.app.settings);
        }
      } catch (error) {
        console.log('Error getting current URL:', error);
      }
      
      // If all else fails, default to dashboard
      if (isDebugMode()) console.log('NO SECTION DETECTED: Defaulting to dashboard');
      return String(routes.app.dashboard);
    }
    
    return pathname;
  };

  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    } else {
      router.push('/(app)/notifications');
    }
  };

  const handleProfilePress = () => {
    router.push('/(app)/settings');
  };

  // Add handlers for the new icons
  const handleChatPress = () => {
    if (onChatPress) {
      onChatPress();
    } else {
      router.push('/(app)/chat');
    }
  };

  const handleGeminiPress = () => {
    if (onGeminiPress) {
      onGeminiPress();
    } else {
      // Use a more specific route path that won't be caught by dynamic routes
      router.push('/(app)/chat/gemini');
    }
  };

  // Function to get the current title based on the pathname and dynamic data from the service
  const getCurrentTitle = (): string => {
    if (isDebugMode()) {
      console.log('Getting current title with pathname:', pathname);
    }
    
    const actualPath = getActualPath();
    
    // First try to get the title from routes
    const routeTitle = getScreenTitleFromRoute(actualPath);
    if (routeTitle) {
      return routeTitle;
    }
    
    // Fallback to the existing path-based detection logic
    if (isDebugMode()) {
      console.log('No match from routes, falling back to path detection for:', actualPath);
    }

    if (!pathname) {
      // Default to dashboard if no path is available
      return pageTitles['dashboard'] || 'Dashboard';
    }

    // Check for different sections based on actualPath
    const pathSegments = actualPath.split('/').filter(Boolean);
    const section = pathSegments[0] || '';
    
    if (isDebugMode()) {
      console.log('Path segments:', pathSegments, 'Section:', section);
    }

    // Expenses section
    if (actualPath.includes('expenses')) {
      if (pathSegments.length > 1 && pathSegments[1] === 'categories') {
        const categoryId = pathSegments[2];
        const expenseCategoryName = pageNameService.expensePageNames[`category-${categoryId}`];
        if (expenseCategoryName) {
          return expenseCategoryName;
        }
      }
      return pageTitles['expenses'] || 'Expenses';
    }

    // Employee section with specific profile
    if (actualPath.includes('employees')) {
      if (pathSegments.length > 1 && !isNaN(Number(pathSegments[1]))) {
        const employeeId = pathSegments[1];
        const employeeName = pageNameService.employeePageNames[`employee-${employeeId}`];
        if (employeeName) {
          if (isDebugMode()) {
            console.log(`Found employee name for ID ${employeeId}:`, employeeName);
          }
          return employeeName;
        } else {
          if (isDebugMode()) {
            console.log(`No employee name found for ID ${employeeId}`);
            console.log('Available employee names:', Object.keys(pageNameService.employeePageNames));
          }
          return `Employee #${employeeId}`;
        }
      }
      return pageTitles['employees'] || 'Employees';
    }

    // Partners section
    if (actualPath.includes('partners')) {
      if (pathSegments.length > 1 && !isNaN(Number(pathSegments[1]))) {
        const partnerId = pathSegments[1];
        const partnerName = pageNameService.partnerPageNames[`partner-${partnerId}`];
        if (partnerName) {
          return partnerName;
        }
        return `Partner #${partnerId}`;
      }
      return pageTitles['partners'] || 'Partners';
    }

    // Clients section
    if (actualPath.includes('clients')) {
      return pageTitles['clients'] || 'Clients';
    }

    // Dashboard is the default case
    return pageTitles['dashboard'] || 'Dashboard';
  };

  const handleBack = () => {
    if (pathname === '/(app)' || pathname === '/(app)/dashboard') {
      return;
    }
    if (showBack) {
      router.back();
    } else {
      router.replace('/(app)');
    }
  };

  // Debug the route title mapping
  useEffect(() => {
    if (isDebugMode()) {
      const actualPath = getActualPath();
      const routeTitle = getScreenTitleFromRoute(actualPath);
      console.log('---- ROUTE TITLE DEBUGGING ----');
      console.log('Raw pathname:', pathname);
      console.log('Detected actual path:', actualPath);
      console.log('Title from route mapping:', routeTitle);
      console.log('Final header title:', getCurrentTitle());
      console.log('----------------------------');
    }
  }, [pathname]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
      zIndex: 100,
      elevation: 100,
      position: 'relative',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 6,
      height: Platform.OS === 'ios' ? 44 : 56,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      zIndex: 100,
      elevation: 100,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 40,
      height: '100%',
      justifyContent: 'center',
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minWidth: 96,
      justifyContent: 'flex-end',
      zIndex: 101,
      elevation: 101,
      height: '100%',
    },
    titleContainer: {
      flex: 1,
      justifyContent: 'center',
      height: '100%',
      position: 'relative',
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: '600',
      textAlignVertical: 'center',
      includeFontPadding: false,
      marginRight: 4,
    },
    titleLoading: {
      opacity: 0.7,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
      marginLeft: 8,
      opacity: 0.8,
      maxWidth: 120,
    },
    touchable: {
      padding: 8,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 101,
    },
    avatarButton: {
      marginLeft: 4,
      zIndex: 101,
    },
    avatar: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    notificationContainer: {
      position: 'relative',
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 101,
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
    gradientOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.colors.primary,
      opacity: 0.1,
    },
    titleRefreshing: {
      position: 'absolute',
      top: 2,
      right: -20,
      width: 14,
      height: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      position: 'relative',
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 101,
    },
  });

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.gradientOverlay} />
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.touchable}
              activeOpacity={0.7}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          ) : showMenu ? (
            <TouchableOpacity
              onPress={onMenuPress}
              style={styles.touchable}
              activeOpacity={0.7}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name="menu"
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title, 
              (loading || isLoadingPageNames) && styles.titleLoading
            ]}>
              {getCurrentTitle()}
            </Text>
            {isLoadingPageNames && (
              <MaterialCommunityIcons
                name="sync"
                size={12}
                color={theme.colors.onSurfaceVariant}
                style={[styles.titleRefreshing, { transform: [{ rotate: '45deg' }] }]}
              />
            )}
            {userName && !loading && (
              <Text style={styles.subtitle}>مرحباً {userName}</Text>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          {showGemini && (
            <TouchableOpacity
              onPress={handleGeminiPress}
              style={styles.touchable}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="robot-excited"
                  size={24}
                  color={theme.colors.onSurface}
                />
              </View>
            </TouchableOpacity>
          )}

          {showChat && (
            <TouchableOpacity
              onPress={handleChatPress}
              style={styles.touchable}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="facebook-messenger"
                  size={24}
                  color={theme.colors.onSurface}
                />
                {messageCount > 0 && (
                  <Badge
                    size={16}
                    style={[styles.badge, { backgroundColor: theme.colors.primary }]}
                  >
                    {messageCount}
                  </Badge>
                )}
              </View>
            </TouchableOpacity>
          )}

          {showNotifications && (
            <TouchableOpacity
              onPress={handleNotificationsPress}
              style={styles.touchable}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={styles.notificationContainer}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={24}
                  color={theme.colors.onSurface}
                />
                {notificationCount > 0 && (
                  <Badge
                    size={16}
                    style={[styles.badge, { backgroundColor: theme.colors.error }]}
                  >
                    {notificationCount}
                  </Badge>
                )}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleProfilePress}
            style={[styles.touchable, styles.avatarButton]}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Avatar.Image
              size={28}
              source={userAvatar ? { uri: userAvatar } : require('@/assets/images/defaultavatar.png')}
              style={[styles.avatar, loading && { opacity: 0.5 }]}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}; 