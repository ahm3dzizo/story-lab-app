import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Card, Button, Avatar, List, Divider, Portal, Modal, ActivityIndicator, Chip, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PartnerRegistrationForm } from '../(partners)/new';
import { ProfitDistributionForm } from '../(partners)/distribution';
import { supabase } from '@/lib/supabase';
import { Partner, PartnerInsert } from '@/types/partner.types';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { ResponsiveDataTable } from '@/components/tables/ResponsiveDataTable';
import { createResponsiveStyles } from '@/app/styles/responsive';
import { getGridColumns, responsiveSpacing } from '@/app/utils/responsive';
import { routes } from '@/app/routes';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Fix the route path
const PARTNER_DISTRIBUTION_ROUTE = '/(app)/(partners)/distribution';

// Extend the responsive styles with custom styles for this screen
const extendedStyles = (theme: any) => {
  const baseStyles = createResponsiveStyles(theme);
  return {
    ...baseStyles,
    retryButton: {
      marginTop: responsiveSpacing(8),
    },
    backButton: {
      marginTop: responsiveSpacing(8),
    },
    distributionHistoryCard: {
      marginBottom: responsiveSpacing(60),
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    deleteDetailText: {
      marginBottom: responsiveSpacing(8),
      marginLeft: responsiveSpacing(16),
      color: 'rgba(0, 0, 0, 0.7)',
    },
  };
};

// Extended Partner type to handle additional properties that might be used
interface ExtendedPartner extends Partner {
  company_name?: string;
  contact_name?: string;
  profit_share_percentage?: number;
  partnership_type?: string;
  address?: string;
  distributions?: any[];
}

export const PartnerProfileScreen: React.FC = () => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [partner, setPartner] = useState<ExtendedPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [monthlyNetProfit, setMonthlyNetProfit] = useState<number | null>(null);
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Get the theme for responsive styles
  const theme = useTheme();
  const responsiveStyles = extendedStyles(theme);
  const gridColumns = getGridColumns();

  console.log('PartnerProfileScreen mounted with params:', params);

  useEffect(() => {
    console.log('useEffect triggered with params:', params);
    const fetchData = async () => {
      if (!params?.id) {
        console.log('No ID in params, setting error');
        setError('No partner ID provided');
        setLoading(false);
        return;
      }
      try {
        await Promise.all([
          loadPartnerData(),
          loadMonthlyNetProfit()
        ]);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err instanceof Error ? err.message : 'Failed to load partner data');
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.id]);

  const loadMonthlyNetProfit = async () => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('financial_records')
        .select('net_profit')
        .gte('record_date', firstDayOfMonth.toISOString())
        .lte('record_date', lastDayOfMonth.toISOString())
        .order('record_date', { ascending: false });

      if (error) throw error;
      
      // Get the most recent record if any exist
      const latestRecord = data?.[0];
      setMonthlyNetProfit(latestRecord?.net_profit || 0);
    } catch (err) {
      console.error('Error loading monthly net profit:', err);
      setMonthlyNetProfit(0);
    }
  };

  const loadPartnerData = async (retry = 0) => {
    try {
      console.log('Loading partner data, attempt:', retry + 1);
      setLoading(true);
      setError(null);

      if (!params?.id) {
        throw new Error('Partner ID is required');
      }

      const partnerId = Number(params.id);
      if (isNaN(partnerId)) {
        throw new Error('Invalid partner ID format');
      }

      // Get current date info for this month's data
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      console.log('Fetching partner data for ID:', partnerId);

      // First fetch partner data
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (partnerError) {
        console.error('Error fetching partner:', partnerError);
        throw partnerError;
      }
      
      if (!partnerData) {
        console.error('Partner not found');
        throw new Error('Partner not found');
      }

      // Fetch distributions for this partner
      const { data: distributionsData, error: distributionsError } = await supabase
        .from('partner_profit_distributions')
        .select('*')
        .eq('partner_id', partnerId)
        .order('distribution_date', { ascending: false });

      if (distributionsError) {
        console.error('Error fetching distributions:', distributionsError);
        throw distributionsError;
      }

      // Fetch this month's expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, "partner-id"')
        .eq('partner-id', partnerId)
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

      // Calculate company month profit
      const monthRevenue = revenueData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const monthExpenses = expensesData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const monthSalaries = salariesData?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
      const companyMonthProfit = monthRevenue - monthExpenses - monthSalaries;

      // Calculate this month's expenses for the partner
      const thisMonthExpenses = expensesData?.reduce((sum, expense) => 
        sum + (Number(expense.amount) || 0), 0) || 0;

      // Calculate this month's profit (proportional to shares_percentage)
      const thisMonthProfit = (partnerData.shares_percentage || 0) / 100 * companyMonthProfit;

      // Process the data to match our Partner type
      const processedPartner: ExtendedPartner = {
        ...partnerData,
        partner_profit_distributions: distributionsData || [],
        total_distributions: distributionsData?.reduce(
          (sum: number, dist: { distribution_amount: number }) => 
            sum + (Number(dist.distribution_amount) || 0),
          0
        ) || 0,
        last_distribution_date: distributionsData?.[0]?.distribution_date || null,
        this_month_expenses: thisMonthExpenses,
        this_month_profit: thisMonthProfit,
        total_month: thisMonthProfit + thisMonthExpenses, // Net value for the month
      };

      console.log('Setting processed partner data:', processedPartner);
      setPartner(processedPartner);
      setRetryCount(0);
      setError(null);
    } catch (err) {
      console.error('Error in loadPartnerData:', err);
      
      if (retry < MAX_RETRIES) {
        console.log(`Retrying... Attempt ${retry + 1} of ${MAX_RETRIES}`);
        setError(`Loading failed. Retrying... (${retry + 1}/${MAX_RETRIES})`);
        setTimeout(() => loadPartnerData(retry + 1), RETRY_DELAY);
        setRetryCount(retry + 1);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to load partner data: ${errorMessage}`);
        setRetryCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#999' }]}>
          <Text style={styles.statusText}>PENDING</Text>
        </View>
      );
    }

    const colors = {
      active: '#34C759',
      inactive: '#FF3B30',
      pending: '#999',
    };

    const statusColor = colors[status.toLowerCase() as keyof typeof colors] || '#999';
    const displayStatus = status.toUpperCase();

    return (
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{displayStatus}</Text>
      </View>
    );
  };

  const handleDeletePartner = async () => {
    try {
      // Show confirmation dialog
      Alert.alert(
        "Delete Partner",
        "Are you sure you want to delete this partner? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              // First delete related records if needed
              // For example, delete profit distributions
      const { error: distributionsError } = await supabase
        .from('partner_profit_distributions')
        .delete()
                .eq('partner_id', params.id);

      if (distributionsError) {
                console.error('Error deleting partner distributions:', distributionsError);
                Alert.alert('Error', 'Failed to delete partner distributions.');
                return;
              }

              // Then delete the partner
              const { error } = await supabase
        .from('partners')
        .delete()
                .eq('id', params.id);

              if (error) {
                console.error('Error deleting partner:', error);
                Alert.alert('Error', 'Failed to delete partner. Please try again.');
                return;
              }

              Alert.alert('Success', 'Partner deleted successfully!');
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleDeletePartner:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[responsiveStyles.container, responsiveStyles.centerContent]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !partner) {
    return (
      <View style={[responsiveStyles.container, responsiveStyles.centerContent]}>
        <Text style={responsiveStyles.errorText}>{error || 'Partner not found'}</Text>
        <View style={responsiveStyles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={() => loadPartnerData()} 
            style={responsiveStyles.retryButton}
          >
            Retry
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => router.back()} 
            style={responsiveStyles.backButton}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  // Adapt to the actual Partner type properties
  const companyName = partner.company_name || partner.full_name || '';
  const contactName = partner.contact_name || '';
  const profitSharePercentage = partner.profit_share_percentage || partner.shares_percentage || 0;
  const partnershipType = partner.partnership_type || 'Standard';
  const partnerAddress = partner.address || '';
  const partnerDistributions = partner.distributions || partner.partner_profit_distributions || [];

  return (
    <SafeAreaView style={responsiveStyles.container}>
      <ScrollView style={responsiveStyles.contentContainer}>
        <Card style={responsiveStyles.card}>
          <Surface style={styles.header} elevation={0}>
            <View style={styles.headerTop}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons 
                  name="account-circle"
                  size={32}
                  color="#fff"
                />
              </View>
              <View style={styles.headerInfo}>
                <Text variant="headlineMedium" style={styles.title}>
                  {companyName}
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                  {contactName}
                </Text>
                {renderStatusBadge(partner.status)}
              </View>
            </View>

            <View style={styles.headerActions}>
              <Button
                mode="contained"
                onPress={() => router.push(`/(app)/(partners)/edit/${partner.id}`)}
                icon="account-edit"
                style={responsiveStyles.actionButton}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ height: 40 }}
              >
                Edit Profile
              </Button>
              <Button
                mode="contained"
                onPress={handleDeletePartner}
                icon="delete"
                style={responsiveStyles.actionButton}
                buttonColor="#FF3B30"
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ height: 40 }}
              >
                Delete
              </Button>
            </View>
          </Surface>

          <Divider style={responsiveStyles.divider} />

          <List.Section>
            <List.Item
              title="Email"
              description={partner.email}
              left={props => <List.Icon {...props} icon="email" />}
            />
            <List.Item
              title="Phone"
              description={partner.phone_number}
              left={props => <List.Icon {...props} icon="phone" />}
            />
            <List.Item
              title="Partnership Type"
              description={partnershipType}
              left={props => <List.Icon {...props} icon="handshake" />}
            />
            <List.Item
              title="Profit Share"
              description={`${profitSharePercentage}%`}
              left={props => <List.Icon {...props} icon="percent" />}
            />
            {partnerAddress && (
              <List.Item
                title="Address"
                description={partnerAddress}
                left={props => <List.Icon {...props} icon="map-marker" />}
              />
            )}
          </List.Section>
        </Card>

        <Card style={responsiveStyles.card}>
          <Card.Title title="Financial Overview" />
          <Card.Content>
            <ResponsiveGrid columns={gridColumns === 1 ? 2 : 3}>
              <View style={responsiveStyles.statItem}>
                <Text style={responsiveStyles.statLabel}>Monthly Net Profit</Text>
                <Text style={responsiveStyles.statValue}>
                  ${monthlyNetProfit?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={responsiveStyles.statItem}>
                <Text style={responsiveStyles.statLabel}>Profit Share</Text>
                <Text style={responsiveStyles.statValue}>
                  ${((monthlyNetProfit || 0) * (profitSharePercentage / 100)).toLocaleString()}
                </Text>
              </View>
              <View style={responsiveStyles.statItem}>
                <Text style={responsiveStyles.statLabel}>Share Percentage</Text>
                <Text style={responsiveStyles.statValue}>{profitSharePercentage}%</Text>
              </View>
            </ResponsiveGrid>
          </Card.Content>
        </Card>

        <Card style={responsiveStyles.distributionHistoryCard}>
          <Card.Title 
            title="Distribution History" 
            right={(props) => (
              <Button 
                mode="contained" 
                onPress={() => router.push(PARTNER_DISTRIBUTION_ROUTE)}
                icon="cash-plus"
                style={{ marginRight: 8 }}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ height: 36 }}
              >
                New Distribution
              </Button>
            )}
          />
          <Card.Content>
            {partnerDistributions && partnerDistributions.length > 0 ? (
              <ResponsiveDataTable
                columns={[
                  { id: 'distribution_date', label: 'Date' },
                  { id: 'amount', label: 'Amount', numeric: true, render: (value) => `$${parseFloat(value).toLocaleString()}` },
                  { id: 'description', label: 'Description' },
                ]}
                data={partnerDistributions}
                emptyMessage="No distributions recorded yet"
              />
            ) : (
              <Text style={styles.noDistributionsText}>No distributions recorded yet</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Modal
          visible={showDeleteConfirm}
          onDismiss={() => setShowDeleteConfirm(false)}
          contentContainerStyle={responsiveStyles.modalContent}
        >
          <View style={responsiveStyles.modalHeader}>
            <Text variant="titleLarge">Delete Partner</Text>
            <Button
              mode="text"
              onPress={() => setShowDeleteConfirm(false)}
              icon="close"
            >
              Close
            </Button>
          </View>
          <View style={responsiveStyles.deleteConfirmContent}>
            <Text variant="bodyLarge" style={responsiveStyles.warningText}>
              Are you sure you want to delete this partner?
            </Text>
            <Text variant="bodyMedium" style={responsiveStyles.deleteDetailText}>
              • Partner: {companyName}
            </Text>
            <Text variant="bodyMedium" style={responsiveStyles.deleteDetailText}>
              • Contact: {contactName}
            </Text>
            <Text variant="bodyMedium" style={responsiveStyles.deleteDetailText}>
              • Profit Share: {profitSharePercentage}%
            </Text>
            <Text variant="bodyLarge" style={responsiveStyles.warningText}>
              This action cannot be undone.
            </Text>
            <View style={responsiveStyles.deleteActions}>
              <Button
                mode="outlined"
                onPress={() => setShowDeleteConfirm(false)}
                style={responsiveStyles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleDeletePartner}
                loading={deleteLoading}
                disabled={deleteLoading}
                buttonColor="#FF3B30"
                style={responsiveStyles.confirmDeleteButton}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Partner'}
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

// Keep the original styles for backward compatibility
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'ffffff',
    paddingBottom:30,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerSection: {
    padding: 16,
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatar: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  specialization: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
  },
  statItem: {
    width: '33.33%',
    padding: 8,
    alignItems: 'center',
  },
  amount: {
    color: '#fff',
    fontWeight: '600',
    marginVertical: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  distributionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 150,
    marginBottom: 16,
  },
  date: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  distributionHistoryCard: {
    marginBottom: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  distributionsList: {
    paddingBottom: 16,
  },
  noDistributionsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    padding: 24,
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
  deleteConfirmContent: {
    padding: 16,
  },
  deleteWarningText: {
    marginBottom: 16,
    color: '#FF3B30',
  },
  deleteDetailText: {
    marginBottom: 8,
    marginLeft: 16,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 24,
  },
  cancelButton: {
    minWidth: 100,
  },
  confirmDeleteButton: {
    minWidth: 100,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 60,
  },
  retryButton: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 8,
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
});

export default PartnerProfileScreen; 