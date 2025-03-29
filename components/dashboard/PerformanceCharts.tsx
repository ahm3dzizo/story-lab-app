import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator, Card, IconButton } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { routes } from '../../app/routes';
import { useAuth } from '../../lib/auth/AuthContext';

interface MonthSummary {
  month: string;
  uniqueId?: string;
  revenue: number;
  expenses: number;
  salaries: number;
  profit: number;
}

export const PerformanceCharts: React.FC = () => {
  const [summaries, setSummaries] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      loadMonthlySummaries();
    }
  }, [session]);

  const loadMonthlySummaries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // حل مشكلة تكرار الشهور باستخدام مجموعة لتتبع الشهور التي تم إنشاؤها
      const uniqueMonthsSet = new Set<string>();
      
      // Get last 6 months (للتأكد من الحصول على 3 شهور فريدة)
      const months: {
        key: string;
        label: string;
        startDate: string;
        endDate: string;
        uniqueKey: string;
      }[] = [];
      
      // ابدأ من الشهر الحالي وارجع للخلف
      for (let i = 0; i < 6 && months.length < 3; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        // إنشاء مفتاح فريد مع رقم فريد
        const uniqueKey = `${year}-${month.toString().padStart(2, '0')}-${i}`;
        
        // التحقق من أن الشهر لم يضاف مسبقًا
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        if (!uniqueMonthsSet.has(monthKey)) {
          uniqueMonthsSet.add(monthKey);
          
          const lastDay = new Date(year, month, 0).getDate();
          const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
          const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
          
          months.push({
            key: uniqueKey,
            label: date.toLocaleString('en-US', { 
              month: 'long',
              year: 'numeric'
            }),
            startDate,
            endDate,
            uniqueKey
          });
        }
      }

      const monthlyData = await Promise.all(months.map(async (month, index) => {
        // Get revenue (client payments)
        const { data: revenueData, error: revenueError } = await supabase
          .from('client_payments')
          .select('amount')
          .gte('payment_date', month.startDate)
          .lte('payment_date', month.endDate);

        if (revenueError) throw revenueError;

        // Get expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .gte('expense_date', month.startDate)
          .lte('expense_date', month.endDate);

        if (expensesError) throw expensesError;

        // Get salaries
        const { data: salariesData, error: salariesError } = await supabase
          .from('salary_payments')
          .select('amount')
          .gte('payment_date', month.startDate)
          .lte('payment_date', month.endDate);

        if (salariesError) throw salariesError;

        const revenue = revenueData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const expenses = expensesData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const salaries = salariesData?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
        const profit = revenue - expenses - salaries;

        return {
          month: month.label,
          uniqueId: `${month.uniqueKey}-${index}`, // إضافة المؤشر للمفتاح لزيادة الفرادة
          revenue,
          expenses,
          salaries,
          profit
        };
      }));

      // تأكد من فرادة المفاتيح
      const uniqueData = Array.from(
        new Map(monthlyData.map(item => [item.uniqueId, item])).values()
      );
      
      setSummaries(uniqueData);
    } catch (error) {
      console.error('Error loading monthly summaries:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained"
          buttonColor="#6366F1"
          onPress={loadMonthlySummaries}
          style={styles.button}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.title}>
          Monthly Financial Summary
        </Text>
        <IconButton
          icon="refresh"
          mode="contained"
          containerColor="#6366F1"
          iconColor="#ffffff"
          size={20}
          onPress={loadMonthlySummaries}
        />
      </View>

      <View style={styles.cardsContainer}>
        {summaries.map((summary, index) => (
          <Card key={summary.uniqueId || `${summary.month}-${index}`} style={styles.monthCard}>
            <Card.Content>
              <View style={styles.monthHeader}>
                <Text variant="titleLarge" style={styles.monthTitle}>
                  {summary.month}
                </Text>
                <View style={styles.profitContainer}>
                  <Text style={styles.netProfitLabel}>Net Profit</Text>
                  <Text 
                    variant="titleLarge" 
                    style={[
                      styles.profitText,
                      { color: summary.profit >= 0 ? '#059669' : '#DC2626' }
                    ]}
                  >
                    {formatCurrency(summary.profit)}
                  </Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Revenue</Text>
                  <Text style={[styles.statValue, styles.revenueText]}>
                    {formatCurrency(summary.revenue)}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Expenses</Text>
                  <Text style={[styles.statValue, styles.expenseText]}>
                    {formatCurrency(summary.expenses)}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Salaries</Text>
                  <Text style={[styles.statValue, styles.salaryText]}>
                    {formatCurrency(summary.salaries)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 16,
  },
  title: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  cardsContainer: {
    padding: 12,
  },
  monthCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    elevation: 2,
    height: 100,
    padding: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -5,
    marginTop: -5,
  },
  monthTitle: {
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    fontSize: 16,
  },
  netProfitLabel: {
    color: '#4B5563',
    fontSize: 12,
    marginRight: 6,
  },
  profitText: {
    fontWeight: '700',
    marginLeft: 1,
    fontSize: 16,
  },
  
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -20,
    marginVertical: -13,
    paddingTop: 4,
  },
  statCard: {
    flex: 1,
    margin: 6,
    padding: 12,
    backgroundColor: '#transparent',
    borderRadius: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  revenueText: {
    color: '#059669',
  },
  expenseText: {
    color: '#DC2626',
  },
  salaryText: {
    color: '#6366F1',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    marginTop: 6,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  profitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});