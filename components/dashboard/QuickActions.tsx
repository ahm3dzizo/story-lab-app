import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { routes } from '@/app/routes';

interface QuickActionProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onPress, color }) => (
  <Button
    mode="contained"
    onPress={onPress}
    style={[styles.actionButton, { backgroundColor: color }]}
    contentStyle={styles.actionButtonContent}
    icon={({ size, color }) => (
      <MaterialCommunityIcons name={icon} size={size} color={color} />
    )}
  >
    {label}
  </Button>
);

export const QuickActions: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const windowDimensions = useRef(Dimensions.get('window'));
  
  // Force the component to maintain proper dimensions
  useEffect(() => {
    // Ensure component is properly laid out on first render
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }, 100);
    
    return () => clearTimeout(timeout);
  }, []);

  const actions: QuickActionProps[] = [
    {
      icon: 'account-plus',
      label: 'New Client',
      color: '#007AFF',
      onPress: () => router.push(routes.app.clients.new),
    },
    {
      icon: 'cash-plus',
      label: 'Record Payment',
      color: '#34C759',
      onPress: () => router.push('/(app)/clients/payment/new'),
    },
    {
      icon: 'chart-box-plus-outline',
      label: 'Add Expense',
      color: '#FF9500',
      onPress: () => router.push(routes.app.expenses.new),
    },
    {
      icon: 'clipboard-check-outline',
      label: 'Add Task',
      color: '#5AC8FA',
      onPress: () => router.push(routes.app.tasks.new),
    },
    {
      icon: 'robot',
      label: 'Gemini AI',
      color: '#4285F4',
      onPress: () => router.push('/(app)/chat/gemini'),
    },
    {
      icon: 'account-multiple-plus',
      label: 'New Partner',
      color: '#5856D6',
      onPress: () => router.push(routes.app.partners.new),
    },
    {
      icon: 'badge-account-horizontal',
      label: 'New Employe',
      color: '#FF2D55',
      onPress: () => router.push(routes.app.employees.new),
    },
    {
      icon: 'cash-multiple',
      label: 'Profit Share',
      color: '#32ADE6',
      onPress: () => router.push('/(app)/(partners)/distribution'),
    },
    {
      icon: 'cash-register',
      label: 'Pay Salary',
      color: '#643EBF',
      onPress: () => router.push('/(app)/(employees)/salary'),
    },
  ];

  const screenWidth = windowDimensions.current.width;
  const isSmallScreen = screenWidth < 768;
  const itemsPerRow = isSmallScreen ? 2 : 4;

  const rows = [];
  for (let i = 0; i < actions.length; i += itemsPerRow) {
    rows.push(actions.slice(i, i + itemsPerRow));
  }

  return (
    <Surface style={styles.surface}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        collapsable={false}
      >
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((action, index) => (
              <View key={index} style={[styles.actionContainer, { flex: 1 }]}>
                <QuickAction {...action} />
              </View>
            ))}
            {/* Fill the remaining space with empty views to keep the layout consistent */}
            {row.length < itemsPerRow && Array(itemsPerRow - row.length).fill(0).map((_, i) => (
              <View key={`empty-${i}`} style={[styles.actionContainer, { flex: 1 }]} />
            ))}
          </View>
        ))}
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  surface: {
    elevation: 0,
    margin: 0,
    padding: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  container: {
    flex: 1,
    zIndex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    marginHorizontal: -4,
    width: '100%',
  },
  actionContainer: {
    paddingHorizontal: 4,
    height: Platform.OS === 'web' ? 'auto' : undefined,
  },
  actionButton: {
    borderRadius: 8,
    marginVertical: 4,
  },
  actionButtonContent: {
    height: 50,
    justifyContent: 'flex-start',
    paddingLeft: 1,
    paddingRight: 1,
  },
}); 