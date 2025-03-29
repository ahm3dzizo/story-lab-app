export const AppRoutes = {
  HOME: '/',
  PARTNERS: {
    LIST: '/partners',
    NEW: '/partners/new',
    DETAILS: (id: string) => `/partners/${id}`,
  },
  EMPLOYEES: {
    LIST: '/employees',
    NEW: '/employees/new',
    DETAILS: (id: string) => `/employees/${id}`,
  },
  EXPENSES: {
    LIST: '/expenses',
    NEW: '/expenses/new',
    DETAILS: (id: string) => `/expenses/${id}`,
  },
} as const; 