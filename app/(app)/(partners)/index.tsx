import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Portal, Modal, Button, Surface, Avatar, ActivityIndicator, Chip, useTheme, Dialog } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PartnerRegistrationForm } from '../(partners)/new';
import { ProfitDistributionForm } from '../(partners)/distribution';
import { supabase } from '@/lib/supabase';
import { routes } from '@/app/routes';
import { AppLayout } from '@/components/layout/AppLayout';
import { Partner, PartnerInsert, ProfitDistribution } from '@/types/partner.types';
import { responsiveSpacing } from '@/app/utils/responsive';

type ActiveForm = 'registration' | 'distribution' | null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 70,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 24,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  partnersList: {
    paddingTop: 16,
    paddingBottom: 30,
  },
  cardContainer: {
    margin: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  card: {
    padding: 16,
    backgroundColor: '#0f172a',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  textContainer: {
    gap: 4,
  },
  name: {
    color: '#fff',
    fontWeight: '600',
  },
  email: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusChip: {
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: 110,
    borderRadius: 12,
    height: 45,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#000000',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  deleteDialog: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  fabButton: {
    borderRadius: 16,
    minWidth: 48,
    height: 48,
    overflow: 'hidden',
  },
  fabButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: '100%',
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  fabIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  primaryFab: {
    backgroundColor: '#3b82f6', // bright blue
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryFab: {
    backgroundColor: '#3b82f6',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
});

export const PartnerManagementScreen: React.FC = () => {
  const theme = useTheme();
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletePartner, setDeletePartner] = useState<Partner | null>(null);
  const { form } = useLocalSearchParams();
  const router = useRouter();

  // Theme-dependent styles
  const themedStyles = {
    primaryFabButton: {
      backgroundColor: theme.colors.primary,
    }
  };

  useEffect(() => {
    if (form === 'distribution') {
      setActiveForm('distribution');
    }
    loadPartners();
  }, [form]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current date info for this month's data
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      console.log('Fetching partners data...');
      // First fetch partners
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .order('full_name');

      if (partnersError) throw partnersError;

      if (!partnersData) throw new Error('No partners data received');

      // Fetch all distributions
      const { data: distributionsData, error: distributionsError } = await supabase
        .from('partner_profit_distributions')
        .select('*')
        .order('distribution_date', { ascending: false });

      if (distributionsError) throw distributionsError;

      // Fetch this month's expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, "partner-id"')
        .gte('expense_date', firstDayOfMonth)
        .lte('expense_date', lastDayOfMonth);

      if (expensesError) throw expensesError;

      // Fetch revenue (client payments) for the month
      const { data: revenueData, error: revenueError } = await supabase
        .from('client_payments')
        .select('amount')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      if (revenueError) throw revenueError;

      // Fetch salaries for the month
      const { data: salariesData, error: salariesError } = await supabase
        .from('salary_payments')
        .select('amount')
        .gte('payment_date', firstDayOfMonth)
        .lte('payment_date', lastDayOfMonth);

      if (salariesError) throw salariesError;

      // Calculate company month profit using the same logic as PerformanceCharts
      const monthRevenue = revenueData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const monthExpenses = expensesData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const monthSalaries = salariesData?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
      const companyMonthProfit = monthRevenue - monthExpenses - monthSalaries;

      // Process the data to match our Partner type
      const processedPartners: Partner[] = partnersData.map(partner => {
        const partnerDistributions = distributionsData?.filter(
          dist => dist.partner_id === partner.id
        ) || [];
        
        const total_distributions = partnerDistributions.reduce(
          (sum: number, dist: { distribution_amount: number }) => 
            sum + (Number(dist.distribution_amount) || 0),
          0
        );

        const last_distribution_date = partnerDistributions.length > 0 
          ? partnerDistributions[0].distribution_date 
          : null;

        // Calculate this month's expenses for the partner
        const thisMonthExpenses = expensesData
          ?.filter(expense => expense['partner-id'] === partner.id)
          .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0) || 0;

        // Calculate this month's profit (assuming it's proportional to shares_percentage)
        const thisMonthProfit = (partner.shares_percentage || 0) / 100 * companyMonthProfit; // Calculate partner's share of company profit

        return {
          ...partner,
          partner_profit_distributions: partnerDistributions,
          total_distributions,
          last_distribution_date,
          this_month_expenses: thisMonthExpenses,
          this_month_profit: thisMonthProfit,
          total_month: thisMonthProfit + thisMonthExpenses, // Calculate total month
        };
      });

      setPartners(processedPartners);
      setError(null);
    } catch (err) {
      console.error('Detailed error loading partners:', err);
      if (err instanceof Error) {
        setError(`Failed to load partners: ${err.message}`);
      } else {
        setError('Failed to load partners: Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!deletePartner) return;
    
    try {
      setLoading(true);

      // First, delete all profit distributions for this partner
      const { error: distributionsError } = await supabase
        .from('partner_profit_distributions')
        .delete()
        .eq('partner_id', deletePartner.id);

      if (distributionsError) throw distributionsError;

      // Delete all expenses associated with this partner
      const { error: expensesError } = await supabase
        .from('expenses')
        .delete()
        .eq('partner_id', deletePartner.id);

      if (expensesError) throw expensesError;

      // Finally delete the partner
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', deletePartner.id);

      if (error) throw error;

      setPartners(partners.filter(p => p.id !== deletePartner.id));
      setDeletePartner(null);
    } catch (err) {
      console.error('Error deleting partner:', err);
      if (err instanceof Error) {
        setError(`Failed to delete partner: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerSubmit = async (partnerData: PartnerInsert) => {
    try {
      const { data, error } = await supabase.from('partners').insert(partnerData);
      
      if (error) {
        console.error('Error creating partner:', error);
        setError(`Failed to create partner: ${error.message}`);
        return;
      }

      setActiveForm(null);
      loadPartners();
    } catch (error) {
      console.error('Error creating partner:', error);
      if (error instanceof Error) {
        setError(`Failed to create partner: ${error.message}`);
      }
    }
  };

  const handleDistributionSubmit = async (distributionData: ProfitDistribution) => {
    try {
      const { data, error } = await supabase
        .from('partner_profit_distributions')
        .insert(distributionData);

      if (error) {
        console.error('Error recording distribution:', error);
        setError(`Failed to record distribution: ${error.message}`);
        return;
      }

      setActiveForm(null);
      loadPartners();
    } catch (error) {
      console.error('Error recording distribution:', error);
      if (error instanceof Error) {
        setError(`Failed to record distribution: ${error.message}`);
      }
    }
  };

  const renderForm = () => {
    switch (activeForm) {
      case 'registration':
        return <PartnerRegistrationForm onSubmit={handlePartnerSubmit} />;
      case 'distribution':
        return <ProfitDistributionForm partners={partners} onSubmit={handleDistributionSubmit} />;
      default:
        return null;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          color: '#22c55e',
        };
      case 'inactive':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.7)',
        };
    }
  };

  const renderPartnerCard = ({ item: partner }: { item: Partner }) => {
    // Calculate monthly payments
    const monthlyDistributions = partner.partner_profit_distributions?.filter(dist => {
      const distDate = new Date(dist.distribution_date);
      const now = new Date();
      return distDate.getMonth() === now.getMonth() && distDate.getFullYear() === now.getFullYear();
    }) || [];

    const totalMonthlyDistributions = monthlyDistributions.reduce(
      (sum, dist) => sum + (Number(dist.distribution_amount) || 0),
      0
    );

    const remainingAmount = (partner.this_month_profit || 0) - totalMonthlyDistributions;

    const handleProfileNavigation = () => {
      router.push(`/(app)/(partners)/${partner.id}`);
    };

    const statusStyle = getStatusStyle(partner.status);

    return (
      <Surface style={styles.cardContainer} elevation={1}>
        <Pressable
          style={styles.card}
          onPress={handleProfileNavigation}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <View style={styles.nameContainer}>
                <Avatar.Text
                  size={40}
                  label={partner.full_name.split(' ').map(n => n[0]).join('')}
                  style={styles.avatar}
                />
                <View style={styles.textContainer}>
                  <Text variant="titleMedium" style={styles.name}>
                    {partner.full_name}
                  </Text>
                  <Text variant="bodySmall" style={styles.email}>
                    {partner.email}
                  </Text>
                </View>
              </View>
              <Chip
                mode="flat"
                style={[
                  styles.statusChip,
                  { backgroundColor: statusStyle.backgroundColor }
                ]}
                textStyle={[
                  styles.statusText,
                  { color: statusStyle.color }
                ]}
              >
                  {partner.status}
              </Chip>
            </View>
          </View>

          <View style={styles.cardStats}>
            <View style={styles.stat}>
              <Text variant="bodySmall" style={styles.statLabel}>This Month's Profit</Text>
              <Text variant="titleMedium" style={styles.statValue}>
                ${(partner.this_month_profit || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text variant="bodySmall" style={styles.statLabel}>This Month's Expenses</Text>
              <Text variant="titleMedium" style={styles.statValue}>
                ${(partner.this_month_expenses || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text variant="bodySmall" style={styles.statLabel}>Total Month</Text>
              <Text variant="titleMedium" style={styles.statValue}>
                ${(partner.total_month || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.cardStats}>
            <View style={styles.stat}>
              <Text variant="bodySmall" style={styles.statLabel}>Monthly Distributed</Text>
              <Text variant="titleMedium" style={[styles.statValue, { color: '#34C759' }]}>
                ${totalMonthlyDistributions.toLocaleString()}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text variant="bodySmall" style={styles.statLabel}>Remaining</Text>
              <Text variant="titleMedium" style={[styles.statValue, { color: remainingAmount >= 0 ? '#FF9500' : '#FF3B30' }]}>
                ${remainingAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text variant="bodySmall" style={styles.statLabel}>Share Percentage</Text>
              <Text variant="titleMedium" style={styles.statValue}>
                {partner.shares_percentage}%
              </Text>
            </View>
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="calendar" size={16} color="#94A3B8" />
              <Text variant="bodySmall" style={styles.metaText}>
                Joined {new Date(partner.join_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="cash-multiple" size={16} color="#94A3B8" />
              <Text variant="bodySmall" style={styles.metaText}>
                Total: ${(partner.total_distributions || 0).toLocaleString()}
              </Text>
            </View>
            {partner.last_distribution_date && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#94A3B8" />
                <Text variant="bodySmall" style={styles.metaText}>
                  Last: {new Date(partner.last_distribution_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Surface>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error: {error}</Text>
        <Button mode="contained" onPress={loadPartners}>Retry</Button>
      </View>
    );
  }

  return (
    <AppLayout>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Partner Management
          </Text>

          <FlatList
            data={partners}
            renderItem={renderPartnerCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.partnersList}
            refreshing={loading}
            onRefresh={loadPartners}
          />

          <View style={styles.fabContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.fabButton,
                styles.primaryFab,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
              ]}
              onPress={() => router.push('/(app)/(partners)/distribution')}
            >
              <View style={styles.fabButtonInner}>
                <View style={styles.fabIconWrapper}>
                  <MaterialCommunityIcons 
                    name="cash-multiple" 
                    size={22} 
                    color="#fff"
                  />
                </View>
                <Text style={[styles.fabLabel, { color: '#fff' }]}>
                  Profit Distribution
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.fabButton,
                styles.secondaryFab,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
              ]}
              onPress={() => router.push(routes.app.partners.new)}
            >
              <View style={styles.fabButtonInner}>
                <View style={styles.fabIconWrapper}>
                  <MaterialCommunityIcons 
                    name="plus" 
                    size={22} 
                    color="#fff"
                  />
                </View>
                <Text style={[styles.fabLabel, { color: '#fff' }]}>
                  Add Partner
                </Text>
              </View>
            </Pressable>
          </View>

          <Portal>
            <Dialog
              visible={deletePartner !== null}
              onDismiss={() => setDeletePartner(null)}
              style={styles.deleteDialog}
            >
              <Dialog.Title>Delete Partner</Dialog.Title>
              <Dialog.Content>
                <Text>
                  Are you sure you want to delete {deletePartner?.full_name}? This will also delete:
                </Text>
                <Text style={{ marginTop: 8 }}>
                  • All profit distribution records
                </Text>
                <Text>
                  • All expenses associated with this partner
                </Text>
                <Text style={{ marginTop: 12, color: theme.colors.error }}>
                  This action cannot be undone.
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDeletePartner(null)}>Cancel</Button>
                <Button 
                  onPress={handleDeletePartner}
                  textColor={theme.colors.error}
                  loading={loading}
                >
                  Delete
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
      </SafeAreaView>
    </AppLayout>
  );
};

export default PartnerManagementScreen; 