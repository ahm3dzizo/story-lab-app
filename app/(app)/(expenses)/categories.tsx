import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ExpenseCategoriesScreen() {
  return (
    <AppLayout>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Expense Categories
        </Text>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
    fontWeight: '600',
    color: '#fff',
  },
}); 