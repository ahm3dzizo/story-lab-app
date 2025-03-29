import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, Alert, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { Text, Portal, Modal, Button, Surface, Avatar, ActivityIndicator, Chip, useTheme, Dialog, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ClientPaymentForm } from '@/app/(app)/clients/payment';
import { supabase } from '@/lib/supabase';
import { routes } from '@/app/routes';
import type { Database } from '@/types/database.types';
import { AppLayout } from '@/components/layout/AppLayout';

type ClientWithPayments = Database['public']['Tables']['clients']['Row'] & {
  client_payments: Array<Database['public']['Tables']['client_payments']['Row']>;
};

type Client = ClientWithPayments & {
  total_payments?: number;
  last_payment_date?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
};

type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type PaymentInsert = Database['public']['Tables']['client_payments']['Insert'];
type ActiveForm = 'payment' | null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '0f172a',
    paddingBottom: 80,
  },
  content: {
    flex: 1,
  },
  header: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  headerContent: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: '600',
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  headerButtonWrapper: {
    flex: 1,
  },
  headerButton: {
    borderRadius: 8,
  },
  clientsList: {
    paddingTop: 8,
    paddingBottom: 30,
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  card: {
    backgroundColor: '#0f172a',
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 4,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  socialMediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
  },
  socialIcon: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
    paddingVertical: 2,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    flexWrap: 'wrap' as 'wrap',
    gap: 8,
    marginTop: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
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
  actionButton: {
    flex: 1,
    minWidth: 100,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    elevation: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 10,
    right: 16,
    flexDirection: 'row',
    gap: 1,
    zIndex: 1,
  },
});

const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url.trim() === '') return false;
  
  // If the URL doesn't start with http:// or https://, prepend https://
  let normalizedUrl = url;
  if (!url.match(/^https?:\/\//)) {
    normalizedUrl = `https://${url}`;
  }
  
  try {
    new URL(normalizedUrl);
    return true;
  } catch (e) {
    return false;
  }
};

// Add this helper function for consistent URL handling
const getNormalizedUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (!url.match(/^https?:\/\//)) {
    return `https://${url}`;
  }
  return url;
};

export const ClientManagementScreen: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const { form } = useLocalSearchParams();

  const getThemedStyles = (theme: any) => ({
    header: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
  });

  const themedStyles = getThemedStyles(theme);

  // Update navigation calls
  const handleClientPress = (clientId: number) => {
    router.push(routes.app.clients.profile(clientId));
  };

  // Function to open client profile in a new screen
  const handleClientOpenInNewScreen = (clientId: number) => {
    // Use direct path navigation
    router.push(`/clients/${clientId}?mode=standalone`);
  };

  const handlePaymentPress = (clientId: number) => {
    router.push({
      pathname: "/(app)/clients/payment/new",
      params: { clientId: clientId.toString() }
    });
  };

  useEffect(() => {
    if (form === 'payment') {
      setActiveForm('payment');
    }
    loadClients();
  }, [form]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select(`
          *,
          client_payments (
            amount,
            payment_date
          ),
          facebook_url,
          instagram_url,
          tiktok_url
        `)
        .order('company_name');

      if (fetchError) throw fetchError;

      const clientsWithStats = (data || []).map((client: ClientWithPayments) => ({
        ...client,
        total_payments: client.client_payments?.reduce(
          (sum: number, payment: Database['public']['Tables']['client_payments']['Row']) => sum + (payment.amount || 0),
          0
        ) || 0,
        last_payment_date: client.client_payments?.[0]?.payment_date || null,
      }));

      setClients(clientsWithStats);
    } catch (err) {
      console.error('Error loading clients:', err);
      if (err instanceof Error) {
        setError(`Failed to load clients: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteClient) return;
    
    try {
      setLoading(true);
      setError(null);

      // First, delete all payments for this client
      const { error: paymentsError } = await supabase
        .from('client_payments')
        .delete()
        .eq('client_id', deleteClient.id);

      if (paymentsError) {
        console.error('Error deleting client payments:', paymentsError);
        throw new Error('Failed to delete client payments');
      }

      // Then delete the client
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', deleteClient.id);

      if (clientError) {
        console.error('Error deleting client:', clientError);
        throw new Error('Failed to delete client');
      }

      // Update local state
      setClients(prevClients => prevClients.filter(c => c.id !== deleteClient.id));
      setDeleteClient(null);
      
      Alert.alert('Success', 'Client deleted successfully');
    } catch (err) {
      console.error('Error in delete operation:', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to delete client. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewClient = async (clientData: ClientInsert) => {
    try {
      const { error } = await supabase
        .from('clients')
        .insert(clientData);

      if (error) throw error;

      setActiveForm(null);
      loadClients();
    } catch (error) {
      console.error('Error creating client:', error);
      Alert.alert(
        'Error',
        'Failed to create client. Please try again.'
      );
    }
  };

  const handleNewPayment = async (paymentData: PaymentInsert) => {
    try {
      // Add payment_month field derived from payment_date
      const paymentDate = new Date(paymentData.payment_date);
      const paymentMonth = String(paymentDate.getMonth() + 1).padStart(2, '0');
      
      const { error } = await supabase
        .from('client_payments')
        .insert({
          ...paymentData,
          payment_month: paymentMonth
        });

      if (error) throw error;

      setActiveForm(null);
      loadClients();
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert(
        'Error',
        'Failed to record payment. Please try again.'
      );
    }
  };

  const renderForm = () => {
    switch (activeForm) {
      case 'payment':
        if (loading) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading clients...</Text>
            </View>
          );
        }
        if (error) {
          return (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button mode="contained" onPress={loadClients} style={{ marginTop: 16 }}>
                Retry
              </Button>
            </View>
          );
        }
        if (clients.length === 0) {
          return (
            <View style={styles.loadingContainer}>
              <Text style={{ color: theme.colors.onSurface }}>No clients available. Please add a client first.</Text>
              <Button 
                mode="contained" 
                onPress={() => router.push(routes.app.clients.new)}
                style={{ marginTop: 16 }}
                icon="account-plus"
              >
                Add Client
              </Button>
            </View>
          );
        }
        return (
          <ClientPaymentForm 
            onSubmit={handleNewPayment} 
            clients={clients} 
            onClose={() => setActiveForm(null)}
          />
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return theme.colors.primary;
      case 'inactive':
        return theme.colors.error;
      case 'pending':
        return theme.colors.tertiary;
      default:
        return theme.colors.surface;
    }
  };

  const renderClientCard = ({ item: client }: { item: Client }) => (
    <View style={styles.cardWrapper}>
      <Surface style={styles.card} elevation={0}>
        <Pressable
          onPress={() => handleClientPress(client.id)}
          style={({ pressed }) => [
            styles.cardHeader,
            pressed && { opacity: 5 }
          ]}
        >
          <View style={styles.cardInfo}>
            <Text variant="titleMedium" style={{ fontSize: 16, fontWeight: '600' }}>{client.company_name}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>
              {client.manager_name}
            </Text>
          </View>
          <Chip 
            mode="flat" 
            style={{ backgroundColor: getStatusColor(client.status) }}
            textStyle={{ color: theme.colors.surface, fontSize: 11 }}
          >
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </Chip>
        </Pressable>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="cash-multiple" size={18} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.metaText}>Monthly: ${client.monthly_subscription}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="briefcase-outline" size={18} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.metaText}>
              {client.field_type || 'Not specified'}
            </Text>
          </View>
        </View>
        
        {/* Social Media Icons - Only shown if at least one social media value exists with a valid URL */}
        {(isValidUrl(client.facebook_url) || isValidUrl(client.instagram_url) || isValidUrl(client.tiktok_url)) && (
          <View style={styles.socialMediaContainer}>
            {isValidUrl(client.facebook_url) && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => {
                  const normalizedUrl = getNormalizedUrl(client.facebook_url);
                  Linking.canOpenURL(normalizedUrl)
                    .then(supported => {
                      if (supported) {
                        return Linking.openURL(normalizedUrl);
                      } else {
                        Alert.alert('Error', 'Cannot open this URL');
                      }
                    })
                    .catch(err => {
                      console.error('Error opening URL:', err);
                      Alert.alert('Error', 'Failed to open Facebook page');
                    });
                }}
              >
                <MaterialCommunityIcons name="facebook" size={22} color="#1877F2" />
              </TouchableOpacity>
            )}
            
            {isValidUrl(client.instagram_url) && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => {
                  const normalizedUrl = getNormalizedUrl(client.instagram_url);
                  Linking.canOpenURL(normalizedUrl)
                    .then(supported => {
                      if (supported) {
                        return Linking.openURL(normalizedUrl);
                      } else {
                        Alert.alert('Error', 'Cannot open this URL');
                      }
                    })
                    .catch(err => {
                      console.error('Error opening URL:', err);
                      Alert.alert('Error', 'Failed to open Instagram page');
                    });
                }}
              >
                <MaterialCommunityIcons name="instagram" size={22} color="#E4405F" />
              </TouchableOpacity>
            )}
            
            {isValidUrl(client.tiktok_url) && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => {
                  const normalizedUrl = getNormalizedUrl(client.tiktok_url);
                  Linking.canOpenURL(normalizedUrl)
                    .then(supported => {
                      if (supported) {
                        return Linking.openURL(normalizedUrl);
                      } else {
                        Alert.alert('Error', 'Cannot open this URL');
                      }
                    })
                    .catch(err => {
                      console.error('Error opening URL:', err);
                      Alert.alert('Error', 'Failed to open TikTok page');
                    });
                }}
              >
                <MaterialCommunityIcons name="video-box" size={22} color="#00F2EA" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.cardStats}>
          <View style={styles.stat}>
            {(() => {
              const currentDate = new Date();
              const currentMonth = currentDate.getMonth();
              const currentYear = currentDate.getFullYear();
              const thisMonthPayments = client.client_payments?.reduce((sum, payment) => {
                const paymentDate = new Date(payment.payment_date);
                if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
                  return sum + payment.amount;
                }
                return sum;
              }, 0) || 0;
              
              return (
                <>
                  <Text variant="titleMedium" style={{ color: '#fff', fontSize: 15, marginBottom: 2 }}>
                    ${thisMonthPayments.toLocaleString()}
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}>
                    This Month
                  </Text>
                </>
              );
            })()}
          </View>
          <View style={[styles.stat, { borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Text variant="titleMedium" style={{ color: '#fff', fontSize: 15, marginBottom: 2 }}>
              {client.last_payment_date 
                ? new Date(client.last_payment_date).toLocaleDateString()
                : 'No payments'
              }
            </Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}>
              Last Payment
            </Text>
          </View>
          <View style={[styles.stat, { borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.1)' }]}>
            {(() => {
              const currentDate = new Date();
              const currentMonth = currentDate.getMonth();
              const currentYear = currentDate.getFullYear();
              const thisMonthPayments = client.client_payments?.reduce((sum, payment) => {
                const paymentDate = new Date(payment.payment_date);
                if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
                  return sum + payment.amount;
                }
                return sum;
              }, 0) || 0;
              const difference = client.monthly_subscription - thisMonthPayments;
              const color = difference > 0 ? '#ef4444' : difference < 0 ? '#22c55e' : '#fff';
              
              return (
                <>
                  <Text variant="titleMedium" style={{ color, fontSize: 15, marginBottom: 2 }}>
                    ${Math.abs(difference).toLocaleString()}
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}>
                    {difference > 0 ? 'Due' : difference < 0 ? 'Overpaid' : 'Paid'}
                  </Text>
                </>
              );
            })()}
          </View>
        </View>

        <View style={styles.cardActions}>
          <Button
            mode="outlined"
            icon="trash-can-outline"
            textColor={theme.colors.error}
            style={[styles.actionButton, { borderColor: 'rgba(255, 59, 48, 0.4)', borderWidth: 1.5 }]}
            contentStyle={{ height: 36, paddingHorizontal: 4 }}
            labelStyle={{ fontSize: 12, fontWeight: '500',marginVertical: 4 }}
            onPress={(e) => {
              e.stopPropagation();
              setDeleteClient(client);
            }}
          >
            Delete
          </Button>
          <Button
            mode="outlined"
            icon="cash-plus"
            style={[styles.actionButton, { borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 0.5 }]}
            contentStyle={{ height: 36, paddingHorizontal: 4, flexDirection: 'row' }}
            labelStyle={{ fontSize: 12, fontWeight: '500', marginLeft: 19,marginVertical: 4 }}
            textColor="#fff"
            onPress={(e) => {
              e.stopPropagation();
              handlePaymentPress(client.id);
            }}
          >
            Payment
          </Button>
          <Button
            mode="contained"
            icon="open-in-new"
            style={[styles.actionButton, { borderWidth: 0 }]}
            contentStyle={{ height: 36, paddingHorizontal: 4 }}
            labelStyle={{ fontSize: 12, fontWeight: '500', marginVertical: 4 }}
            buttonColor="rgba(58, 120, 255, 0.25)"
            textColor="#fff"
            onPress={(e) => {
              e.stopPropagation();
              handleClientOpenInNewScreen(client.id);
            }}
          >
            Details
          </Button>
        </View>
      </Surface>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text variant="titleLarge" style={styles.title}>
          Client Management
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.headerButtonWrapper}
            onPress={() => router.push(routes.app.clients.new)}
            activeOpacity={0.7}
          >
            <Button
              mode="contained"
              icon="account-plus"
              style={[styles.headerButton, { marginRight: 8 }]}
              contentStyle={{ height: 45 }}
            >
              New Client
            </Button>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButtonWrapper}
            onPress={() => setActiveForm('payment')}
            activeOpacity={0.7}
          >
            <Button
              mode="contained"
              icon="cash-plus"
              style={styles.headerButton}
              contentStyle={{ height: 45 }}
            >
              New Payment
            </Button>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadClients}>Retry</Button>
      </View>
    );
  }

  return (
    <AppLayout>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Client Management
          </Text>

          <FlatList
            data={clients}
            renderItem={renderClientCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.clientsList}
            refreshing={loading}
            onRefresh={loadClients}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="account-search"
                  size={40}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, fontSize: 14, marginTop: 8 }}>
                  No clients found
                </Text>
                <Button
                  mode="contained"
                  onPress={() => router.push(routes.app.clients.new)}
                  icon="account-plus"
                  style={{ marginTop: 12 }}
                  labelStyle={{ fontSize: 13 }}
                  contentStyle={{ height: 40 }}
                >
                  Add Your First Client
                </Button>
              </View>
            }
          />

          <View style={styles.fabContainer}>
            <Button 
              mode="contained" 
              onPress={() => router.push('/(app)/clients/payment/new')}
              icon="cash-plus" 
              style={{ marginRight: 8 }}
            >
              Add Payment
            </Button>
            <Button 
              mode="contained" 
              onPress={() => router.push(routes.app.clients.new)}
              icon="plus" 
            >
              Add Client
            </Button>
          </View>

          <Portal>
            <Dialog visible={!!deleteClient} onDismiss={() => setDeleteClient(null)}>
              <Dialog.Title>Delete Client</Dialog.Title>
              <Dialog.Content>
                <Text>Are you sure you want to delete this client? This action cannot be undone.</Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDeleteClient(null)}>Cancel</Button>
                <Button onPress={handleDeleteClient}>Delete</Button>
              </Dialog.Actions>
            </Dialog>

            <Modal
              visible={activeForm === 'payment'}
              onDismiss={() => setActiveForm(null)}
              contentContainerStyle={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={{ fontSize: 18 }}>
                  Record Payment
                </Text>
                <Button
                  mode="text"
                  onPress={() => setActiveForm(null)}
                  icon="close"
                  labelStyle={{ fontSize: 13 }}
                >
                  Close
                </Button>
              </View>
              {renderForm()}
            </Modal>
          </Portal>
        </View>
      </SafeAreaView>
    </AppLayout>
  );
};

export default ClientManagementScreen;