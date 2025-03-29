import React from 'react';
import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { routes } from '../routes';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const { colorScheme } = useColorScheme();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If not authenticated, redirect to login
  if (!session) {
    return <Redirect href={routes.auth.login} />;
  }

  // If authenticated, show the app
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
} 