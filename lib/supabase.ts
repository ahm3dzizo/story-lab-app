import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

// استخدم القيم المباشرة لتجنب مشاكل مع القيم المتغيرة
const supabaseUrl = "https://zafiiboppuqoihzlncii.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZmlpYm9wcHVxb2loemxuY2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5Mjg2MTcsImV4cCI6MjA1NjUwNDYxN30.BXN9OfWkAKADob1gvaVPssAjzkpiVkg8hQqPVTjNU50";
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || "";

const isRelease = !__DEV__;

// إضافة تسجيل لاستكشاف المشكلات في وضع الإصدار
if (isRelease) {
  console.log("Running in RELEASE mode");
  console.log(`Supabase URL: ${supabaseUrl}`);
}

// تكوين خيارات التخزين المحلي
const storageConfig = {
  storage: AsyncStorage,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
};

// تكوين خيارات الاتصال
const networkConfig = {
  headers: { 
    'x-application-name': 'story-lab',
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Content-Type': 'application/json',
  },
};

// تكوين خيارات الوقت
const timeoutConfig = {
  timeout: 30000 // 30 seconds timeout
};

// عميل supabase مع تعطيل ميزة realtime
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: storageConfig,
  global: networkConfig,
  realtime: {
    params: {
      eventsPerSecond: 0
    }
  },
  ...timeoutConfig
});

// تقوم بتفعيل سجلات التشخيص إذا كان وضع التصحيح مفعل
if (Constants.expoConfig?.extra?.debugMode) {
  // إضافة مستمع للتحقق من حالة الاتصال
  setInterval(async () => {
    try {
      const { data, error } = await supabase.from('health_check').select('*').limit(1);
      if (error) {
        console.log('Health check failed:', error.message);
      } else {
        console.log('Supabase connection OK');
      }
    } catch (e) {
      console.error('Connection error:', e);
    }
  }, 60000); // check every minute
}

// عميل supabase للمسؤول مع تعطيل ميزة realtime
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: networkConfig,
  realtime: {
    params: {
      eventsPerSecond: 0
    }
  },
  ...timeoutConfig
});

// Type-safe database functions
export const db = {
  // Users
  users: {
    getById: async (id: number) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
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
      return data;
    },
    getById: async (id: number) => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, client_payments(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (client: ClientInsert) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: number, updates: ClientUpdate) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  // Partners
  partners: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*, users(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    getById: async (id: number) => {
      const { data, error } = await supabase
        .from('partners')
        .select('*, users(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (partner: any) => {
      const { data, error } = await supabase
        .from('partners')
        .insert(partner)
        .select()
        .single();
      if (error) throw error;
      return data;
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
      return data;
    },
    create: async (employee: any) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();
      if (error) throw error;
      return data;
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
      return data;
    },
    create: async (expense: any) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  // Financial Records
  financialRecords: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .order('record_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    getSummary: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .order('record_date', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  },

  // Client Payments
  clientPayments: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('client_payments')
        .select('*, clients(*)')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    create: async (payment: any) => {
      const { data, error } = await supabase
        .from('client_payments')
        .insert(payment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  // Partner Profit Distributions
  profitDistributions: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('partner_profit_distributions')
        .select('*, partners(*)')
        .order('distribution_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    create: async (distribution: any) => {
      const { data, error } = await supabase
        .from('partner_profit_distributions')
        .insert(distribution)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  // Salary Payments
  salaryPayments: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('salary_payments')
        .select('*, employees(*)')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    create: async (payment: any) => {
      const { data, error } = await supabase
        .from('salary_payments')
        .insert(payment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },
}; 