import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { AppLayout } from './AppLayout';
import { ScreenGradient } from '../ui/ScreenGradient';

export interface BaseScreenProps {
  title: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  hideHeader?: boolean;
}

export function BaseScreen({ children, onRefresh, refreshing, hideHeader }: BaseScreenProps) {
  return (
    <AppLayout>
      <ScreenGradient>
        <ScrollView
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </ScreenGradient>
    </AppLayout>
  );
} 