import { Stack } from 'expo-router';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as theme from '@/lib/theme/theme';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { NotificationsService } from '@/lib/services/notifications';
import { useEffect, useState } from 'react';
import type { Notification } from '@/lib/services/notifications';

// Helper function to generate UUID since crypto.randomUUID() is not available in all environments
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const unstable_settings = {
  initialRouteName: '/(app)/logomotion',
  segments: {
    '(app)': {
      unstable_cache: true,
      unstable_key: null,
    },
  },
};

// Separate component for handling notifications
function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const notificationsService = NotificationsService.getInstance();
    const userId = session.user.id;

    // Load existing notifications with enhanced details
    notificationsService.fetchNotificationsWithDetails(userId, 10, 0).then(setNotifications);

    // Fetch recent salary payments and create notifications if needed
    fetchSalaryPayments(notificationsService, userId);
    
    // Set up periodic refresh for salary payments (every 5 minutes)
    const refreshInterval = setInterval(() => {
      fetchSalaryPayments(notificationsService, userId);
    }, 5 * 60 * 1000);

    // Subscribe to all notification types
    const unsubscribeCallbacks: (() => void)[] = [];

    // Handle new notifications
    const handleNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    };

    // Subscribe to all event types
    unsubscribeCallbacks.push(
      notificationsService.subscribeToEmployeeEvents(userId, handleNotification),
      notificationsService.subscribeToClientEvents(userId, handleNotification),
      notificationsService.subscribeToTasks(userId, handleNotification),
      notificationsService.subscribeToMessages(userId, handleNotification),
      notificationsService.subscribeToFinancialEvents(userId, handleNotification),
      notificationsService.subscribeToPartnerEvents(userId, handleNotification),
      notificationsService.subscribeToDepartmentEvents(userId, handleNotification),
      notificationsService.subscribeToPositionEvents(userId, handleNotification),
      notificationsService.subscribeToInvoiceEvents(userId, handleNotification),
      notificationsService.subscribeToSalaryPayments(userId, handleNotification)
    );

    // Cleanup subscriptions and interval
    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
      clearInterval(refreshInterval);
    };
  }, [session?.user?.id]);

  // Fetch salary payments and create notifications
  const fetchSalaryPayments = async (notificationsService: NotificationsService, userId: string) => {
    try {
      const salaryPayments = await notificationsService.fetchSalaryPayments(5);
      
      // Process each salary payment
      for (const payment of salaryPayments) {
        const employee = payment.employees;
        if (!employee) continue;

        // Format payment amount
        const formattedAmount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(payment.amount);

        // Create notification for each salary payment
        const notification: Notification = {
          id: generateUUID(),
          user_id: userId,
          type: 'info',
          title: 'Salary Payment Processed',
          message: `Salary payment of ${formattedAmount} processed for ${employee.first_name} ${employee.last_name}`,
          is_read: false,
          created_at: new Date().toISOString(),
          source: 'system',
          reference_id: payment.id.toString(),
          reference_type: 'salary'
        };

        // Check if this notification already exists before adding
        const exists = await notificationsService.checkNotificationExists(userId, 'salary', payment.id.toString());
        if (!exists) {
          await notificationsService.createNotification(notification);
          setNotifications(prev => [notification, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error fetching salary payments for notifications:', error);
    }
  };

  return <>{children}</>;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const baseTheme = colorScheme === 'dark' ? theme.dark : theme.light;

  return (
    <ThemeProvider>
      <PaperProvider theme={baseTheme}>
        <AuthProvider>
          <NotificationsProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen 
                name="(auth)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen 
                name="(app)"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
          </NotificationsProvider>
        </AuthProvider>
      </PaperProvider>
    </ThemeProvider>
  );
} 