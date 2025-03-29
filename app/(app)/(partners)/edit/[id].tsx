import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { PartnerRegistrationForm } from '@/app/(app)/(partners)/new';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Partner } from '@/types/partner.types';

export default function EditPartnerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (partnerData: Partial<Partner>) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('partners')
        .update(partnerData)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Navigate back to partner profile
      router.back();
    } catch (error) {
      console.error('Error updating partner:', error);
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  if (error) {
    return (
      <AppLayout showBack>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
            Go Back
          </Button>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBack>
      <ScrollView style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>Edit Partner</Text>
        <PartnerRegistrationForm 
          onSubmit={handleSubmit}
          mode="edit"
        />
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 24,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
  },
}); 