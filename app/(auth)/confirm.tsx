import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ImageBackground } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { routes } from '../../app/routes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function ConfirmScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const { token_hash, type } = useLocalSearchParams();

  useEffect(() => {
    verifyEmail();
  }, [token_hash]);

  const verifyEmail = async () => {
    try {
      if (!token_hash || type !== 'email_change' && type !== 'signup') {
        setError('رابط التحقق غير صالح');
        setLoading(false);
        return;
      }

      // Verify the email
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token_hash as string,
        type: type === 'signup' ? 'signup' : 'email_change',
      });

      if (verifyError) throw verifyError;

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.replace(routes.auth.login);
      }, 3000);

    } catch (error: any) {
      console.error('Email verification error:', error);
      setError('حدث خطأ أثناء التحقق من البريد الإلكتروني');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/background.jpg')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.85 }}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Surface style={styles.card} elevation={4}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>تأكيد البريد الإلكتروني</Text>
          </View>

          {loading ? (
            <View style={styles.contentContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>
                جاري التحقق من البريد الإلكتروني...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.contentContainer}>
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
              <Button
                mode="contained"
                onPress={() => router.push(routes.auth.login)}
                style={styles.button}
              >
                العودة إلى تسجيل الدخول
              </Button>
            </View>
          ) : success ? (
            <View style={styles.contentContainer}>
              <View style={styles.successContainer}>
                <MaterialCommunityIcons name="check-circle-outline" size={48} color="#34C759" />
                <Text style={styles.successText}>
                  تم تأكيد البريد الإلكتروني بنجاح
                </Text>
                <Text style={styles.redirectText}>
                  سيتم تحويلك إلى صفحة تسجيل الدخول...
                </Text>
              </View>
            </View>
          ) : null}
        </Surface>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    padding: 32,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontWeight: '800',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  contentContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#FF3B30',
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#34C759',
  },
  redirectText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
    elevation: 4,
  },
}); 