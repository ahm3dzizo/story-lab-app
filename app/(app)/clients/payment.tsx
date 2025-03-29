import React, { useEffect } from 'react';
import { router } from 'expo-router';

export default function PaymentRedirect() {
  useEffect(() => {
    // Redirect to the new payment screen
    router.replace('/(app)/clients/payment/new');
  }, []);
  
  // This page just redirects, so we don't need to return anything
  return null;
}

// Export the payment types and components from the components directory
export { 
  ClientPaymentForm,
  paymentMethods,
  paymentTypes
} from './payment/components/PaymentForm';

export type { 
  Client,
  Payment, 
  PaymentInsert 
} from './payment/components/PaymentForm'; 