import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, List, ActivityIndicator } from 'react-native-paper';
import { api } from '../../lib/services/api';
import type { Database } from '../../types/database.types';

interface FinancialRecord {
  id: number;
  record_date: string;
  record_type: 'REVENUE' | 'EXPENSE';
  amount: number;
  description: string;
  created_at: string;
}

export const RecentActivities: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentRecords();
  }, []);

  const loadRecentRecords = async () => {
    try {
      setLoading(true);
      const data = await api.financials.getRecent(5);
      setRecords(data);
    } catch (err) {
      console.error('Error loading recent records:', err);
      setError('Failed to load recent activities');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator />
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>Error: {error}</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Title title="Recent Activities" />
      <Card.Content>
        {records.length === 0 ? (
          <Text>No recent activities</Text>
        ) : (
          records.map((record) => (
            <List.Item
              key={record.id}
              title={`${record.record_type} - ${new Date(record.record_date).toLocaleDateString()}`}
              description={record.description}
              right={() => (
                <Text
                  style={{
                    color: record.record_type === 'EXPENSE' ? '#FF3B30' : '#34C759',
                  }}
                >
                  ${record.amount.toLocaleString()}
                </Text>
              )}
            />
          ))
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
  },
  amount: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RecentActivities; 