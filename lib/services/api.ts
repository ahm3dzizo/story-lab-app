import { supabase } from '../supabase';
import type { Database } from '../../types/database.types';

type Tables = Database['public']['Tables'];

interface FinancialRecord {
  id: number;
  record_date: string;
  record_type: 'REVENUE' | 'EXPENSE';
  amount: number;
  description: string;
  created_at: string;
}

interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
}

export const api = {
  // Users
  users: {
    getById: async (id: number) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Tables['users']['Row'];
    },
  },

  // Clients
  clients: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Tables['clients']['Row'][];
    },
    create: async (client: Tables['clients']['Insert']) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();
      if (error) throw error;
      return data as Tables['clients']['Row'];
    },
  },

  // Employees
  employees: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*, users(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Tables['employees']['Row'] & { users: Tables['users']['Row'] })[];
    },
    create: async (employee: Tables['employees']['Insert']) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();
      if (error) throw error;
      return data as Tables['employees']['Row'];
    },
  },

  // Expenses
  expenses: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, partners(*)')
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data as (Tables['expenses']['Row'] & { partners: Tables['partners']['Row'] })[];
    },
    create: async (expense: Tables['expenses']['Insert']) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();
      if (error) throw error;
      return data as Tables['expenses']['Row'];
    },
  },

  // Financial Records
  financials: {
    getSummary: async (): Promise<FinancialSummary> => {
      // TODO: Replace with actual API call
      return {
        total_revenue: 50000,
        total_expenses: 30000,
        net_profit: 20000
      };
    },
    getRecent: async (limit: number = 12): Promise<FinancialRecord[]> => {
      // TODO: Replace with actual API call
      return [
        {
          id: 1,
          record_date: new Date().toISOString(),
          record_type: 'REVENUE',
          amount: 5000,
          description: 'Client payment - Acme Corp',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          record_date: new Date().toISOString(),
          record_type: 'EXPENSE',
          amount: 1500,
          description: 'Office supplies',
          created_at: new Date().toISOString()
        }
      ];
    },
  },

  // Performance Reviews
  reviews: {
    getByEmployee: async (employeeId: number) => {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('employee_id', employeeId)
        .order('review_date', { ascending: false });
      if (error) throw error;
      return data as Tables['performance_reviews']['Row'][];
    },
    create: async (review: Tables['performance_reviews']['Insert']) => {
      const { data, error } = await supabase
        .from('performance_reviews')
        .insert(review)
        .select()
        .single();
      if (error) throw error;
      return data as Tables['performance_reviews']['Row'];
    },
  },
}; 