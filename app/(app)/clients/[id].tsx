import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity } from 'react-native';
import { Text, Card, Button, List, Divider, Portal, Modal, ActivityIndicator, useTheme, IconButton, DataTable } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NewClientForm } from '@/app/(app)/clients/new';
import { ClientPaymentForm } from '@/app/(app)/clients/payment';
import { supabase } from '@/lib/supabase';
import { routes } from '@/app/routes';
import { AppLayout } from '@/components/layout/AppLayout';

type Payment = {
  id: number;
  client_id: number;
  amount: number;
  payment_date: string;
  payment_month: string;
  description: string;
  payment_method: string;
};

type PaymentFormData = {
  client_id: number;
  amount: number;
  payment_date: string;
  payment_month: string;
  description: string;
  payment_method: string;
  payment_type?: string;
};

type PaymentInsert = {
  client_id: number;
  amount: number;
  payment_date: string;
  payment_type: string;
  description: string | null;
  payment_method: string;
};

type Client = {
  id: number;
  client_payments?: Payment[];
  company_name: string;
  manager_name: string;
  field_type: string | null;
  monthly_subscription: number;
  status: 'active' | 'inactive' | 'pending';
  phone_number: string | null;
  address: string | null;
  notes: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  created_at: string;
  updated_at: string;
};

type ClientUpdate = Partial<Omit<Client, 'id' | 'client_payments'>>;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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

export function ClientProfileScreen() {
  const [client, setClient] = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id, mode } = useLocalSearchParams<{ id: string, mode?: string }>();
  const router = useRouter();
  const theme = useTheme();
  
  // Check if we're in standalone mode (opened from "Details" button)
  const isStandalone = mode === 'standalone';
  // Check if we're in edit mode (opened from "Edit" button)
  const isEditMode = mode === 'edit';

  const loadClientData = async (retry = 0) => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: clientError } = await supabase
        .from('clients')
        .select('*, client_payments(*), facebook_url, instagram_url, tiktok_url')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      if (!data) throw new Error('No data received');

      setClient(data as Client);
      setPayments(data.client_payments || []);
    } catch (err) {
      console.error('Error loading client:', err);
      const error = err as Error;
      
      if (retry < MAX_RETRIES) {
        setError(`Loading failed. Retrying... (${retry + 1}/${MAX_RETRIES})`);
        setTimeout(() => loadClientData(retry + 1), RETRY_DELAY);
      } else {
        setError('Failed to load client data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadClientData();
  };

  const handleCallClient = (phoneNumber: string | null) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }

    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'Phone calls are not supported on this device');
          return;
        }
        return Linking.openURL(url);
      })
      .catch(err => {
        console.error('Error making phone call:', err);
        Alert.alert('Error', 'Failed to make phone call');
      });
  };

  const handleUpdateClient = async (data: ClientUpdate) => {
    if (!client) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', client.id);

      if (error) throw error;

      await loadClientData();
      
      // If in edit mode, navigate back to the client profile
      if (isEditMode) {
        router.replace(`/clients/${client.id}`);
      } else {
        setEditModalVisible(false);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      Alert.alert('Error', 'Failed to update client');
    }
  };

  const handleAddPayment = async (payment: PaymentInsert) => {
    try {
      const { error } = await supabase
        .from('client_payments')
        .insert(payment);

      if (error) throw error;

      await loadClientData();
      setPaymentModalVisible(false);
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment');
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    try {
      const { error } = await supabase
        .from('client_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      await loadClientData();
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      Alert.alert('Error', 'Failed to delete payment');
    }
  };

  const handleConfirmDelete = () => {
    if (selectedPayment) {
      handleDeletePayment(selectedPayment.id);
    }
  };

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const renderStatusBadge = (status: string) => {
    const colors = {
      active: '#34C759',
      inactive: '#FF3B30',
    };

    return (
      <View style={[styles.statusBadge, { backgroundColor: colors[status as keyof typeof colors] || '#999' }]}>
        <Text style={styles.statusText}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" style={styles.loader} />
        </SafeAreaView>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text variant="bodyLarge" style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={handleRetry}>
              Retry
            </Button>
          </View>
        </SafeAreaView>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text variant="bodyLarge" style={styles.errorText}>Client not found</Text>
            <Button mode="contained" onPress={() => router.back()}>
              Go Back
            </Button>
          </View>
        </SafeAreaView>
      </AppLayout>
    );
  }

  // TypeScript type guard to ensure client is not null
  const isValidClient = (client: Client | null): client is Client => {
    return client !== null;
  };

  if (!isValidClient(client)) {
    return null;
  }

  // Now client is type-checked and not null
  const lastPayment = client.client_payments?.[0];
  
  // Navigate to edit screen - defined after client is validated as not null
  const handleEditClient = () => {
    router.push(`/clients/${client.id}?mode=edit`);
  };

  // If in edit mode, render the edit form instead of the profile
  if (isEditMode) {
    return (
      <AppLayout>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.standaloneHeader}>
            <Button
              icon="arrow-left"
              mode="text"
              onPress={() => router.replace(`/clients/${client.id}`)}
              style={styles.backButton}
            >
              Back to Client
            </Button>
          </View>
          <ScrollView>
            <Card style={styles.card}>
              <Card.Content>
                <NewClientForm
                  onSubmit={handleUpdateClient}
                  initialData={client}
                  mode="edit"
                  onClose={() => router.replace(`/clients/${client.id}`)}
                />
              </Card.Content>
            </Card>
          </ScrollView>
        </SafeAreaView>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {isStandalone && (
            <View style={styles.standaloneHeader}>
              <Button
                icon="arrow-left"
                mode="text"
                onPress={() => router.back()}
                style={styles.backButton}
              >
                Back to Clients
              </Button>
            </View>
          )}
          <ScrollView>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.header}>
                  <View style={styles.headerContent}>
                    <Text variant="titleLarge">{client.company_name}</Text>
                    <Text variant="bodyMedium">{client.manager_name}</Text>
                    {client.phone_number && (
                      <Text variant="bodyMedium">{client.phone_number}</Text>
                    )}
                  </View>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      onPress={() => handleCallClient(client.phone_number)}
                      disabled={!client.phone_number}
                      style={styles.iconButton}
                      activeOpacity={0.7}
                    >
                      <IconButton
                        icon="phone"
                        mode="contained"
                        disabled={!client.phone_number}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleEditClient}
                      style={styles.iconButton}
                      activeOpacity={0.7}
                    >
                      <IconButton
                        icon="pencil"
                        mode="contained"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text variant="bodyMedium">Monthly Subscription:</Text>
                    <Text variant="bodyMedium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(client.monthly_subscription)}
                    </Text>
                  </View>
                  {client.field_type && (
                    <View style={styles.detailRow}>
                      <Text variant="bodyMedium">Field Type:</Text>
                      <Text variant="bodyMedium">{client.field_type}</Text>
                    </View>
                  )}
                  {client.address && (
                    <View style={styles.detailRow}>
                      <Text variant="bodyMedium">Address:</Text>
                      <Text variant="bodyMedium">{client.address}</Text>
                    </View>
                  )}
                  {client.notes && (
                    <View style={styles.detailRow}>
                      <Text variant="bodyMedium">Notes:</Text>
                      <Text variant="bodyMedium">{client.notes}</Text>
                    </View>
                  )}
                  
                  {/* Social Media Icons - Only displayed when valid URLs are available */}
                  {(isValidUrl(client.facebook_url) || isValidUrl(client.instagram_url) || isValidUrl(client.tiktok_url)) && (
                    <View style={styles.socialMediaContainer}>
                      <Text variant="bodyMedium" style={styles.socialTitle}>Social Media:</Text>
                      <View style={styles.socialIconsRow}>
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
                            <MaterialCommunityIcons name="facebook" size={24} color="#1877F2" />
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
                            <MaterialCommunityIcons name="instagram" size={24} color="#E4405F" />
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
                            <MaterialCommunityIcons name="video-box" size={24} color="#00F2EA" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium">Payment History</Text>
                  <IconButton
                    icon="plus"
                    mode="contained"
                    onPress={() => setPaymentModalVisible(true)}
                  />
                </View>
                
                <List.Section>
                  {payments.map((payment) => (
                    <List.Item
                      key={payment.id}
                      title={`$${payment.amount.toFixed(2)}`}
                      description={payment.description || 'No description'}
                      left={props => <List.Icon {...props} icon="cash" />}
                      right={props => (
                        <View style={styles.paymentActions}>
                          <Text variant="bodySmall">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </Text>
                          <IconButton
                            {...props}
                            icon="delete"
                            onPress={() => handleDeletePayment(payment.id)}
                          />
                        </View>
                      )}
                    />
                  ))}
                </List.Section>
              </Card.Content>
            </Card>
          </ScrollView>

          <Portal>
            <Modal
              visible={paymentModalVisible}
              onDismiss={() => setPaymentModalVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <ClientPaymentForm
                onSubmit={handleAddPayment}
                clients={[client]}
                onClose={() => setPaymentModalVisible(false)}
                onRefresh={loadClientData}
              />
            </Modal>

            <Modal
              visible={deleteModalVisible}
              onDismiss={() => setDeleteModalVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <View style={styles.deleteModal}>
                <Text variant="titleMedium">Confirm Delete</Text>
                <Text variant="bodyMedium">
                  Are you sure you want to delete this payment?
                </Text>
                <View style={styles.deleteModalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setDeleteModalVisible(false)}
                    style={styles.deleteModalButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleConfirmDelete}
                    style={styles.deleteModalButton}
                  >
                    Delete
                  </Button>
                </View>
              </View>
            </Modal>
          </Portal>
        </View>
      </SafeAreaView>
    </AppLayout>
  );
}

export default ClientProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginBottom: 16,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerActions: {
    marginLeft: 16,
  },
  name: {
    marginBottom: 4,
  },
  managerName: {
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButton: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  card: {
    marginBottom: 16,
  },
  paymentCard: {
    marginBottom: 32,
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paymentButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  safeArea: {
    flex: 1,
  },
  loader: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  deleteModal: {
    padding: 16,
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  deleteModalButton: {
    flex: 1,
  },
  iconButton: {
    padding: 8,
  },
  standaloneHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  socialMediaContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  socialTitle: {
    marginBottom: 8,
  },
  socialIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  socialIcon: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}); 