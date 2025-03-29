import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

interface OverviewWidgetProps {
  title: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  trend?: number;
  color?: string;
  type?: 'revenue' | 'profit' | 'net-profit';
  gradientColors?: [string, string];
}

const defaultGradients: Record<string, [string, string]> = {
  revenue: ['#3B82F6', '#1D4ED8'],
  profit: ['#10B981', '#047857'],
  'net-profit': ['#8B5CF6', '#6D28D9'],
  default: ['#6366F1', '#4F46E5']
};

export const OverviewWidget: React.FC<OverviewWidgetProps> = ({
  title,
  value,
  icon,
  trend,
  color = '#007AFF',
  type,
  gradientColors
}) => {
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [previousValue, setPreviousValue] = useState<number>(0);

  useEffect(() => {
    if (type) {
      loadFinancialData();
    } else {
      setCurrentValue(Number(value));
      setIsLoading(false);
    }
  }, [type, value]);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const monthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const monthEnd = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${lastDay}`;

      // Calculate previous month's date range
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const previousMonthStart = `${previousYear}-${previousMonth.toString().padStart(2, '0')}-01`;
      const previousMonthLastDay = new Date(previousYear, previousMonth, 0).getDate();
      const previousMonthEnd = `${previousYear}-${previousMonth.toString().padStart(2, '0')}-${previousMonthLastDay}`;

      if (type === 'revenue') {
        const [currentRevenue, previousRevenue] = await Promise.all([
          supabase
            .from('client_payments')
            .select('amount')
            .gte('payment_date', monthStart)
            .lte('payment_date', monthEnd),
          supabase
            .from('client_payments')
            .select('amount')
            .gte('payment_date', previousMonthStart)
            .lte('payment_date', previousMonthEnd)
        ]);

        const totalRevenue = currentRevenue.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const prevTotalRevenue = previousRevenue.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        
        setCurrentValue(totalRevenue);
        setPreviousValue(prevTotalRevenue);
      } else if (type === 'profit' || type === 'net-profit') {
        const [currentData, previousData] = await Promise.all([
          Promise.all([
            supabase
              .from('client_payments')
              .select('amount')
              .gte('payment_date', monthStart)
              .lte('payment_date', monthEnd),
            supabase
              .from('expenses')
              .select('amount')
              .gte('expense_date', monthStart)
              .lte('expense_date', monthEnd),
            supabase
              .from('salary_payments')
              .select('amount')
              .gte('payment_date', monthStart)
              .lte('payment_date', monthEnd)
          ]),
          Promise.all([
            supabase
              .from('client_payments')
              .select('amount')
              .gte('payment_date', previousMonthStart)
              .lte('payment_date', previousMonthEnd),
            supabase
              .from('expenses')
              .select('amount')
              .gte('expense_date', previousMonthStart)
              .lte('expense_date', previousMonthEnd),
            supabase
              .from('salary_payments')
              .select('amount')
              .gte('payment_date', previousMonthStart)
              .lte('payment_date', previousMonthEnd)
          ])
        ]);

        const [currentRevenue, currentExpenses, currentSalaries] = currentData;
        const [previousRevenue, previousExpenses, previousSalaries] = previousData;

        const totalRevenue = currentRevenue.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalExpenses = currentExpenses.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const totalSalaries = currentSalaries.data?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
        
        const prevTotalRevenue = previousRevenue.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const prevTotalExpenses = previousExpenses.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const prevTotalSalaries = previousSalaries.data?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
        
        const netProfit = totalRevenue - totalExpenses - totalSalaries;
        const prevNetProfit = prevTotalRevenue - prevTotalExpenses - prevTotalSalaries;
        
        setCurrentValue(netProfit);
        setPreviousValue(prevNetProfit);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTrend = () => {
    if (previousValue === 0) return 0;
    return Math.round(((currentValue - previousValue) / Math.abs(previousValue)) * 100);
  };

  const displayValue = type ? formatCurrency(currentValue) : value;
  const gradient = gradientColors || (type ? defaultGradients[type] : defaultGradients.default);
  const calculatedTrend = type ? calculateTrend() : trend;

  return (
    <Card style={styles.card}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={icon} 
                size={24} 
                color="#ffffff"
                style={styles.icon} 
              />
            </View>
            {calculatedTrend !== undefined && (
              <View style={[
                styles.trendContainer,
                { backgroundColor: calculatedTrend >= 0 ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)' }
              ]}>
                <MaterialCommunityIcons
                  name={calculatedTrend >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={calculatedTrend >= 0 ? '#34C759' : '#FF3B30'}
                />
                <Text style={[styles.trendText, { color: calculatedTrend >= 0 ? '#34C759' : '#FF3B30' }]}>
                  {Math.abs(calculatedTrend)}%
                </Text>
              </View>
            )}
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.value}>
              {isLoading ? '...' : displayValue}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',  },
  gradient: {
    borderRadius: 12,
    padding: 16,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    opacity: 1,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontWeight: '500',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
}); 