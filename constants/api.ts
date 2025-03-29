export const API_CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  API_URL: process.env.EXPO_PUBLIC_API_URL,
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  CLIENTS: {
    BASE: '/clients',
    SUBSCRIPTIONS: '/clients/subscriptions',
    PAYMENTS: '/clients/payments',
  },
  PARTNERS: {
    BASE: '/partners',
    PROFITS: '/partners/profits',
    EXPENSES: '/partners/expenses',
  },
  EMPLOYEES: {
    BASE: '/employees',
    TASKS: '/employees/tasks',
    PERFORMANCE: '/employees/performance',
  },
  INVENTORY: {
    BASE: '/inventory',
    STOCK: '/inventory/stock',
    PURCHASES: '/inventory/purchases',
  },
  REPORTS: {
    FINANCIAL: '/reports/financial',
    ANALYTICS: '/reports/analytics',
    EXPORTS: '/reports/exports',
  },
};

export const API_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

export const API_HEADERS = {
  JSON: {
    'Content-Type': 'application/json',
  },
  MULTIPART: {
    'Content-Type': 'multipart/form-data',
  },
} as const; 