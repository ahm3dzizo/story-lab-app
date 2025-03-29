import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppLayout } from '@/components/layout/AppLayout';

export default function DepartmentsScreen() {
  return (
    <AppLayout>
      <View style={styles.container}>
        <Text variant="headlineMedium">Departments</Text>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
}); 