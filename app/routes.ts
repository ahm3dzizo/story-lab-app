import { LinkProps } from 'expo-router';

type AppRoute = LinkProps['href'];

export const routes = {
  auth: {
    login: '/(auth)/login' as AppRoute,
    register: '/(auth)/register' as AppRoute,
    forgotPassword: '/(auth)/forgot-password' as AppRoute,
    logout: '/(auth)/logout' as AppRoute,
  },
  app: {
    root: '/(app)' as AppRoute,
    dashboard: '/(app)/(dashboard)' as AppRoute,
    expenses: {
      root: '/(app)/(expenses)' as AppRoute,
      new: '/(app)/(expenses)/new' as AppRoute,
      profile: (id: number | string) => `/(app)/(expenses)/${id}` as AppRoute,
    },
    employees: {
      root: '/(app)/(employees)' as AppRoute,
      new: '/(app)/(employees)/new' as AppRoute,
      profile: (id: number | string) => `/(app)/(employees)/${id}` as AppRoute,
    },
    clients: {
      root: '/(app)/clients' as AppRoute,
      new: '/(app)/clients/new' as AppRoute,
      profile: (id: number | string) => `/(app)/clients/${id}` as AppRoute,
    },
    partners: {
      root: '/(app)/(partners)' as AppRoute,
      new: '/(app)/(partners)/new' as AppRoute,
      profile: (id: number | string) => `/(app)/(partners)/${id}` as AppRoute,
    },
    tasks: {
      root: '/(app)/(tasks)' as AppRoute,
      new: '/(app)/(tasks)/new' as AppRoute,
      profile: (id: number | string) => `/(app)/(tasks)/${id}` as AppRoute,
    },
    logomotion: '/(app)/logomotion' as AppRoute,
    profile: '/(app)/profile' as AppRoute,
    editProfile: '/(app)/edit-profile' as AppRoute,
    settings: '/(app)/settings' as AppRoute,
  },
} as const;

export const AppRoutes = {
  ROOT: routes.app.root,
  DASHBOARD: routes.app.dashboard,
  CLIENTS: routes.app.clients.root,
  PARTNERS: routes.app.partners.root,
  EMPLOYEES: routes.app.employees.root,
  EXPENSES: routes.app.expenses.root,
  TASKS: routes.app.tasks.root,
  LOGOMOTION: routes.app.logomotion,
  PROFILE: routes.app.profile,
  SETTINGS: routes.app.settings,
} as const;

export default routes;