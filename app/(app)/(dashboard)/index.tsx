import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, RefreshControl, Image } from 'react-native';
import { Text, useTheme, Surface, ActivityIndicator } from 'react-native-paper';
import { OverviewWidget } from '@/components/dashboard/OverviewWidget';
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';

interface DashboardStats {
  totalRevenue: number;
  activeClients: number;
  pendingTasks: number;
  monthlyGrowth: number;
}

export const DashboardScreen: React.FC = () => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const { session } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeClients: 0,
    pendingTasks: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const userId = session?.user?.id;
      if (!userId) return;

      // Initialize stats with default values
      const newStats = {
        totalRevenue: 0,
        activeClients: 0,
        pendingTasks: 0,
        monthlyGrowth: 0
      };

      try {
        // Try to fetch payments data
        const { data: payments } = await supabase
          .from('client_payments')
          .select('amount');
        
        if (payments) {
          newStats.totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        }
      } catch (error) {
        console.log('Payments table not available:', error);
      }

      try {
        // Try to fetch active clients count
        const { count } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        
        if (count !== null) {
          newStats.activeClients = count;
        }
      } catch (error) {
        console.log('Clients table not available:', error);
      }

      try {
        // Try to fetch pending tasks count
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        if (count !== null) {
          newStats.pendingTasks = count;
        }
      } catch (error) {
        console.log('Tasks table not available:', error);
      }

      // Calculate monthly growth if possible
      try {
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        
        const { data: lastMonthPayments } = await supabase
          .from('client_payments')
          .select('amount')
          .gte('created_at', lastMonthStart.toISOString());

        if (lastMonthPayments) {
          const lastMonthRevenue = lastMonthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
          newStats.monthlyGrowth = lastMonthRevenue ? ((newStats.totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
          newStats.monthlyGrowth = Math.round(newStats.monthlyGrowth * 10) / 10;
        }
      } catch (error) {
        console.log('Monthly growth calculation not available:', error);
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const overviewData: Array<{
    title: string;
    value: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    trend: number;
    color: string;
  }> = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: 'cash' as keyof typeof MaterialCommunityIcons.glyphMap,
      trend: stats.monthlyGrowth,
      color: theme.colors.primary,
    },
    {
      title: 'Active Clients',
      value: stats.activeClients.toString(),
      icon: 'account-group' as keyof typeof MaterialCommunityIcons.glyphMap,
      trend: 0,
      color: theme.colors.secondary,
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks.toString(),
      icon: 'clipboard-list-outline' as keyof typeof MaterialCommunityIcons.glyphMap,
      trend: 0,
      color: theme.colors.tertiary,
    },
    {
      title: 'Monthly Growth',
      value: `${stats.monthlyGrowth}%`,
      icon: 'trending-up' as keyof typeof MaterialCommunityIcons.glyphMap,
      trend: stats.monthlyGrowth,
      color: theme.colors.primary,
    },
  ];

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    container: {
      flex: 1,
    },
    content: {
      paddingBottom: 80,
      paddingTop: 12,
    },
    header: {
      padding: 12,
      backgroundColor: 'grey',
      borderRadius: 12,
      marginHorizontal: 12,
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.secondary,
    },
    section: {
      marginTop: 12,
      marginHorizontal: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor: 'grey',
      padding: 5,
      borderRadius: 8,
    },
    sectionIcon: {
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
    },
    overviewItem: {
      width: screenWidth < 600 ? '50%' : '25%',
      padding: 6,
    },
    chartContainer: {
      borderRadius: 12,
      padding: 1,
      marginBottom: 12,
    },
    quickActionsContainer: {
      backgroundColor: 'transparent',
      borderRadius: 16,
      padding: 1,
      marginBottom: 12,
      minHeight: 200,
      overflow: 'visible',
    },
    activitiesContainer: {
      backgroundColor: 'transparent',
      borderRadius: 20,
      padding: 1,
      marginBottom: 12,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    logo: {
      width: 100,
      height: 40,
      resizeMode: 'contain',
      marginTop: 8,
      marginHorizontal: 250,
      paddingTop: 10,
      paddingBottom: 40,
      zIndex: 1000,
      position: 'absolute',
      bottom: 20,
      left: 30,
    },
  });

  const renderQuickActions = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons 
            name="lightning-bolt" 
            size={24} 
            color={theme.colors.primary}
            style={styles.sectionIcon}
          />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <Surface style={[styles.quickActionsContainer, { elevation: 1 }]}>
          <QuickActions />
        </Surface>
      </View>
    );
  };

  return (
    <AppLayout>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchDashboardStats} />
          }
          removeClippedSubviews={false}
        >
          <Surface style={styles.header} elevation={0}>
            <Text style={styles.headerTitle}>Welcome to Stoty Lab </Text>
            <Text style={styles.headerSubtitle}>Managment App</Text>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
          </Surface>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="chart-line" 
                size={24} 
                color={theme.colors.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Performance</Text>
            </View>
            <View style={styles.chartContainer}>
              <PerformanceCharts />
            </View>
          </View>

          {renderQuickActions()}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="clock-outline" 
                size={24} 
                color={theme.colors.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Recent Activities</Text>
            </View>
            <View style={styles.activitiesContainer}>
              <RecentActivities />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="chart-box-outline" 
                size={24} 
                color={theme.colors.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Overview</Text>
            </View>
            <View style={styles.overviewGrid}>
              {overviewData.map((data, index) => (
                <View key={index} style={styles.overviewItem}>
                  <OverviewWidget {...data} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppLayout>
  );
};  
export default DashboardScreen; 