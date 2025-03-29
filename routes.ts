export default function Root() {
  return null;
} 
export const AppRoutes = {
  CLIENT_PAYMENT_NEW: (clientId: string) => `/clients/${clientId}/payments/new`,
  // ... other routes
};