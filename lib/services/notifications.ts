import { supabase } from '@/lib/supabase';

// Helper function to generate UUID since crypto.randomUUID() is not available in all environments
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  source: 'task' | 'message' | 'employee' | 'client' | 'system' | 'partner' | 'department' | 'position';
  reference_id?: string;
  reference_type?: 'task' | 'message' | 'employee' | 'client' | 'payment' | 'expense' | 'salary' | 'partner' | 'department' | 'position' | 'invoice';
}

interface DatabaseChangePayload<T = any> {
  commit_timestamp: string;
  errors: null | any[];
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  schema: string;
  table: string;
}

export class NotificationsService {
  private static instance: NotificationsService;
  private subscriptions: (() => void)[] = [];

  private constructor() {}

  static getInstance(): NotificationsService {
    if (!NotificationsService.instance) {
      NotificationsService.instance = new NotificationsService();
    }
    return NotificationsService.instance;
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          id: generateUUID(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async fetchNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  subscribeToNotifications(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onUpdate(payload.new as Notification);
        }
      )
      .subscribe();

    this.subscriptions.push(() => subscription.unsubscribe());
    return () => subscription.unsubscribe();
  }

  subscribeToEmployeeEvents(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel('employee_events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees',
        },
        async (payload: DatabaseChangePayload) => {
          let title = '';
          let message = '';
          let type: 'info' | 'warning' | 'success' = 'info';

          const employeeName = payload.new?.first_name && payload.new?.last_name
            ? `${payload.new.first_name} ${payload.new.last_name}`
            : 'An employee';

          switch (payload.eventType) {
            case 'INSERT':
              title = 'New Employee Added';
              message = `${employeeName} has been added to the team`;
              type = 'success';
              break;
            case 'UPDATE':
              if (payload.new.employment_status !== payload.old.employment_status) {
                title = 'Employment Status Changed';
                message = `${employeeName}'s status changed to ${payload.new.employment_status}`;
                type = payload.new.employment_status === 'terminated' ? 'warning' : 'info';
              } else {
                title = 'Employee Details Updated';
                message = `${employeeName}'s information has been updated`;
              }
              break;
            case 'DELETE':
              title = 'Employee Removed';
              message = `An employee record has been removed from the system`;
              type = 'warning';
              break;
          }

          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type,
            title,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'employee',
            reference_id: payload.new?.id?.toString(),
            reference_type: 'employee'
          };
          onUpdate(notification);
        }
      )
      .subscribe();

    this.subscriptions.push(() => subscription.unsubscribe());
    return () => subscription.unsubscribe();
  }

  subscribeToClientEvents(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel('client_events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
        },
        (payload: DatabaseChangePayload) => {
          // Create a notification for client events
          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type: 'info',
            title: 'Client Update',
            message: `A client record has been ${payload.eventType.toLowerCase()}d`,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'client',
            reference_id: payload.new?.id?.toString(),
            reference_type: 'client'
          };
          onUpdate(notification);
        }
      )
      .subscribe();

    this.subscriptions.push(() => subscription.unsubscribe());
    return () => subscription.unsubscribe();
  }

  subscribeToMessages(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload: DatabaseChangePayload) => {
          // Create a notification for new messages
          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type: 'info',
            title: 'New Message',
            message: 'You have received a new message',
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'message',
            reference_id: payload.new?.id?.toString(),
            reference_type: 'message'
          };
          onUpdate(notification);
        }
      )
      .subscribe();

    this.subscriptions.push(() => subscription.unsubscribe());
    return () => subscription.unsubscribe();
  }

  subscribeToTasks(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assignee_id=eq.${userId}`,
        },
        (payload: DatabaseChangePayload) => {
          // Create a notification for task events
          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type: 'info',
            title: 'Task Update',
            message: `A task has been ${payload.eventType.toLowerCase()}d`,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'task',
            reference_id: payload.new?.id?.toString(),
            reference_type: 'task'
          };
          onUpdate(notification);
        }
      )
      .subscribe();

    this.subscriptions.push(() => subscription.unsubscribe());
    return () => subscription.unsubscribe();
  }

  subscribeToFinancialEvents(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscriptions: (() => void)[] = [];

    // Subscribe to client payments
    const paymentsSubscription = supabase
      .channel('client_payments_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_payments',
        },
        async (payload: DatabaseChangePayload) => {
          const { data: client } = await supabase
            .from('clients')
            .select('company_name')
            .eq('id', payload.new.client_id)
            .single();

          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type: 'success',
            title: 'New Payment Received',
            message: `Received payment of ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(payload.new.amount)} from ${client?.company_name || 'client'}`,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'system',
            reference_id: payload.new.id?.toString(),
            reference_type: 'payment'
          };
          onUpdate(notification);
        }
      )
      .subscribe();

    // Subscribe to expenses
    const expensesSubscription = supabase
      .channel('expenses_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expenses',
        },
        (payload: DatabaseChangePayload) => {
          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type: 'warning',
            title: 'New Expense Recorded',
            message: `New expense of ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(payload.new.amount)} has been recorded`,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'system',
            reference_id: payload.new.id?.toString(),
            reference_type: 'expense'
          };
          onUpdate(notification);
        }
      )
      .subscribe();

    // Subscribe to salary payments
    const salarySubscription = supabase
      .channel('salary_payments_events')
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen to all events
          schema: 'public',
          table: 'salary_payments',
        },
        async (payload: DatabaseChangePayload) => {
          // Only create notification for INSERT events
          if (payload.eventType !== 'INSERT') return;
          
          // Get employee details
          const { data: employee } = await supabase
            .from('employees')
            .select('first_name, last_name')
            .eq('id', payload.new.employee_id)
            .single();
            
          if (!employee) return;
            
          // Format amount for display
          const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency', 
            currency: 'USD'
          }).format(payload.new.amount);
          
          // Create notification object
          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type: 'info',
            title: 'Salary Payment Processed',
            message: `Salary payment of ${formattedAmount} processed for ${employee.first_name} ${employee.last_name}`,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'system',
            reference_id: payload.new.id?.toString(),
            reference_type: 'salary'
          };
          
          onUpdate(notification);
        }
      )
      .subscribe();

    subscriptions.push(
      () => paymentsSubscription.unsubscribe(),
      () => expensesSubscription.unsubscribe(),
      () => salarySubscription.unsubscribe()
    );

    this.subscriptions.push(...subscriptions);
    return () => subscriptions.forEach(unsubscribe => unsubscribe());
  }

  subscribeToPartnerEvents(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel('partner_events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partners',
        },
        async (payload: DatabaseChangePayload) => {
          let title = '';
          let message = '';
          let type: 'info' | 'warning' | 'success' = 'info';

          const partnerName = payload.new?.company_name 
            ? payload.new.company_name 
            : 'A partner';

          switch (payload.eventType) {
            case 'INSERT':
              title = 'New Partner Added';
              message = `${partnerName} has been added as a business partner`;
              type = 'success';
              break;
            case 'UPDATE':
              title = 'Partner Details Updated';
              message = `${partnerName}'s information has been updated`;
              type = 'info';
              break;
            case 'DELETE':
              title = 'Partner Removed';
              message = `A business partner record has been removed from the system`;
              type = 'warning';
              break;
          }

          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type,
            title,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'client',
            reference_id: payload.new?.id?.toString(),
            reference_type: 'partner'
          };
          onUpdate(notification);
        }
      )
      .subscribe();

    this.subscriptions.push(() => subscription.unsubscribe());
    return () => subscription.unsubscribe();
  }

  subscribeToDepartmentEvents(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel('department_events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'departments',
        },
        (payload: DatabaseChangePayload) => {
          let title = '';
          let message = '';
          let type: 'info' | 'warning' | 'success' = 'info';

          const departmentName = payload.new?.name 
            ? payload.new.name 
            : 'A department';

          switch (payload.eventType) {
            case 'INSERT':
              title = 'New Department Created';
              message = `${departmentName} department has been created`;
              type = 'success';
              break;
            case 'UPDATE':
              title = 'Department Updated';
              message = `${departmentName} department has been updated`;
              type = 'info';
              break;
            case 'DELETE':
              title = 'Department Removed';
              message = `A department has been removed from the system`;
              type = 'warning';
              break;
          }

          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type,
            title,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'employee',
            reference_id: payload.new?.id?.toString(),
            reference_type: 'department'
          };
          onUpdate(notification);
        }
      )
      .subscribe();

    this.subscriptions.push(() => subscription.unsubscribe());
    return () => subscription.unsubscribe();
  }

  subscribeToPositionEvents(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel('position_events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
        },
        (payload: DatabaseChangePayload) => {
          let title = '';
          let message = '';
          let type: 'info' | 'warning' | 'success' = 'info';

          const positionName = payload.new?.title 
            ? payload.new.title 
            : 'A position';

          switch (payload.eventType) {
            case 'INSERT':
              title = 'New Position Created';
              message = `${positionName} position has been created`;
              type = 'success';
              break;
            case 'UPDATE':
              title = 'Position Updated';
              message = `${positionName} position has been updated`;
              type = 'info';
              break;
            case 'DELETE':
              title = 'Position Removed';
              message = `A position has been removed from the system`;
              type = 'warning';
              break;
          }

          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type,
            title,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'employee',
            reference_id: payload.new?.id?.toString(),
            reference_type: 'position'
          };
          onUpdate(notification);
        }
      )
      .subscribe();

    this.subscriptions.push(() => subscription.unsubscribe());
    return () => subscription.unsubscribe();
  }

  subscribeToInvoiceEvents(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel('invoice_events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
        },
        async (payload: DatabaseChangePayload) => {
          // Get client name for better context
          let clientName = 'a client';
          if (payload.new?.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('company_name')
              .eq('id', payload.new.client_id)
              .single();
            
            if (client) {
              clientName = client.company_name;
            }
          }

          let title = '';
          let message = '';
          let type: 'info' | 'warning' | 'success' = 'info';

          const invoiceAmount = payload.new?.total_amount
            ? new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(payload.new.total_amount)
            : '';

          switch (payload.eventType) {
            case 'INSERT':
              title = 'New Invoice Created';
              message = `Invoice for ${invoiceAmount} has been created for ${clientName}`;
              type = 'success';
              break;
            case 'UPDATE':
              if (payload.new?.status === 'paid' && payload.old?.status !== 'paid') {
                title = 'Invoice Paid';
                message = `Invoice #${payload.new.invoice_number} for ${clientName} has been marked as paid`;
                type = 'success';
              } else {
                title = 'Invoice Updated';
                message = `Invoice #${payload.new.invoice_number} for ${clientName} has been updated`;
                type = 'info';
              }
              break;
            case 'DELETE':
              title = 'Invoice Deleted';
              message = `An invoice has been deleted from the system`;
              type = 'warning';
              break;
          }

          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type,
            title,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'system',
            reference_id: payload.new?.id?.toString(),
            reference_type: 'invoice'
          };
          onUpdate(notification);
        }
      )
      .subscribe();

    this.subscriptions.push(() => subscription.unsubscribe());
    return () => subscription.unsubscribe();
  }

  // Enhanced fetchNotifications to get more data and handle pagination
  async fetchNotificationsWithDetails(userId: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      // Fetch additional details for certain notification types
      const enhancedNotifications = await Promise.all((data || []).map(async (notification) => {
        // For client-related notifications, get client details
        if (notification.source === 'client' && notification.reference_id) {
          const { data: client } = await supabase
            .from('clients')
            .select('company_name')
            .eq('id', notification.reference_id)
            .single();
          
          if (client) {
            notification.message = notification.message.replace('client', client.company_name);
          }
        }
        
        // For employee-related notifications, get employee details
        if (notification.source === 'employee' && notification.reference_id) {
          const { data: employee } = await supabase
            .from('employees')
            .select('first_name, last_name')
            .eq('id', notification.reference_id)
            .single();
          
          if (employee) {
            notification.message = notification.message.replace('employee', `${employee.first_name} ${employee.last_name}`);
          }
        }
        
        return notification;
      }));
      
      return enhancedNotifications;
    } catch (error) {
      console.error('Error fetching notifications with details:', error);
      return [];
    }
  }

  // Get count of unread notifications
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  async fetchSalaryPayments(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('salary_payments')
        .select('*, employees(first_name, last_name)')
        .order('payment_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching salary payments:', error);
      return [];
    }
  }

  async checkNotificationExists(userId: string, refType: string, refId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('reference_type', refType)
        .eq('reference_id', refId);

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking if notification exists:', error);
      return false;
    }
  }

  subscribeToSalaryPayments(userId: string, onUpdate: (notification: Notification) => void): () => void {
    const subscription = supabase
      .channel('dedicated_salary_events')
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen to all events
          schema: 'public',
          table: 'salary_payments',
        },
        async (payload: any) => {
          // Only create notification for INSERT events
          if (payload.eventType !== 'INSERT') return;
          
          // Get employee details
          const { data: employee } = await supabase
            .from('employees')
            .select('first_name, last_name')
            .eq('id', payload.new.employee_id)
            .single();
            
          if (!employee) return;
            
          // Format amount for display
          const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency', 
            currency: 'USD'
          }).format(payload.new.amount);
          
          // Create notification object
          const notification: Notification = {
            id: generateUUID(),
            user_id: userId,
            type: 'info',
            title: 'Salary Payment Processed',
            message: `Salary payment of ${formattedAmount} processed for ${employee.first_name} ${employee.last_name}`,
            is_read: false,
            created_at: new Date().toISOString(),
            source: 'system',
            reference_id: payload.new.id?.toString(),
            reference_type: 'salary'
          };
          
          onUpdate(notification);
        }
      )
      .subscribe();
      
    this.subscriptions.push(() => subscription.unsubscribe());
    return () => subscription.unsubscribe();
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
} 