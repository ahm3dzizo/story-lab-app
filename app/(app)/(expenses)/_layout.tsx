import React from 'react';
import { Stack } from 'expo-router';

export default function ExpensesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          presentation: 'card',
          animation: 'slide_from_right'
        }} 
      />
      <Stack.Screen name="new" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="recurring" />
      <Stack.Screen name="reports" />
    </Stack>
  );
} 