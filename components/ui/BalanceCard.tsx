import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { GradientCard } from './GradientCard';
import { formatCurrency } from '@/utils/formatters';

interface BalanceCardProps {
  title: string;
  amount: number;
  gradient?: [string, string] | [string, string, ...string[]];
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  amount,
  gradient = ['#6366F1', '#4F46E5'] as [string, string],
}) => {
  return (
    <GradientCard gradient={gradient} style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="headlineMedium" style={styles.amount}>
        {formatCurrency(amount)}
      </Text>
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%',
  },
  title: {
    color: '#fff',
    opacity: 0.8,
    marginBottom: 8,
  },
  amount: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 