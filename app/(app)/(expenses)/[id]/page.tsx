import React from 'react';
import { ExpenseProfileScreen } from '../screens/ExpenseProfileScreen';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ExpensePage() {
  return (
    <AppLayout>
      <ExpenseProfileScreen />
    </AppLayout>
  );
} 