import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, useTheme, Surface, TextInput, HelperText, IconButton, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const NewPaymentScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('credit-card');
  const [notes, setNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Mock client data - In real app, fetch from API based on id
  const client = {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@company.com',
    company: 'Tech Solutions Inc.',
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backButton: {
      marginRight: 16,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: 16,
      opacity: 0.7,
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    paymentMethods: {
      marginBottom: 24,
    },
    methodCardWrapper: {
      marginBottom: 16,
    },
    methodCard: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    methodCardSelected: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    methodCardContent: {
      padding: 16,
    },
    methodHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    methodIcon: {
      marginRight: 12,
    },
    methodTitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    methodDescription: {
      fontSize: 14,
      opacity: 0.7,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to create payment
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log('Payment created successfully');
      router.back();
    } catch (error) {
      console.error('Failed to create payment:', error);
      // Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods = [
    { id: 'credit-card', label: 'Credit Card', icon: 'credit-card-outline' },
    { id: 'bank-transfer', label: 'Bank Transfer', icon: 'bank-outline' },
    { id: 'paypal', label: 'PayPal', icon: 'cash-multiple' },
  ] as const;

  const PaymentMethodCard = ({ 
    id, 
    title, 
    description, 
    icon 
  }: { 
    id: string; 
    title: string; 
    description: string; 
    icon: keyof typeof MaterialCommunityIcons.glyphMap; 
  }) => (
    <Pressable
      onPress={() => setPaymentMethod(id)}
      style={({ pressed }) => [
        styles.methodCardWrapper,
        pressed && { opacity: 0.7 }
      ]}
    >
      <Surface
        style={[
          styles.methodCard,
          paymentMethod === id && styles.methodCardSelected,
        ]}
        elevation={2}
      >
        <View style={styles.methodCardContent}>
          <View style={styles.methodHeader}>
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color={paymentMethod === id ? theme.colors.primary : theme.colors.onSurfaceVariant}
              style={styles.methodIcon}
            />
            <Text style={[
              styles.methodTitle,
              paymentMethod === id && { color: theme.colors.primary }
            ]}>
              {title}
            </Text>
          </View>
          <Text style={styles.methodDescription}>{description}</Text>
        </View>
      </Surface>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <View style={styles.headerContent}>
            <Text style={styles.title}>New Payment</Text>
            <Text style={styles.subtitle}>{client.name} - {client.company}</Text>
          </View>
        </View>
      </Surface>

      <ScrollView>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MaterialCommunityIcons name="cash" size={24} color={theme.colors.primary} />
              Payment Details
            </Text>
            <TextInput
              label="Amount ($)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              error={!!errors.amount}
              left={<TextInput.Icon icon="currency-usd" />}
            />
            <HelperText type="error" visible={!!errors.amount}>
              {errors.amount}
            </HelperText>

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              error={!!errors.description}
              style={{ marginTop: 12 }}
            />
            <HelperText type="error" visible={!!errors.description}>
              {errors.description}
            </HelperText>

            <TextInput
              label="Additional Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={{ marginTop: 12 }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MaterialCommunityIcons name="credit-card" size={24} color={theme.colors.primary} />
              Payment Method
            </Text>
            <View style={styles.paymentMethods}>
              <PaymentMethodCard
                id="credit-card"
                title="Credit Card"
                description="Pay securely with your credit card"
                icon="credit-card-outline"
              />
              <PaymentMethodCard
                id="bank-transfer"
                title="Bank Transfer"
                description="Direct transfer from your bank account"
                icon="bank-outline"
              />
              <PaymentMethodCard
                id="paypal"
                title="PayPal"
                description="Pay using your PayPal account"
                icon="cash-multiple"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <Surface style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={{ flex: 1 }}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={{ flex: 1 }}
        >
          Create Payment
        </Button>
      </Surface>
    </View>
  );
};

export default NewPaymentScreen; 