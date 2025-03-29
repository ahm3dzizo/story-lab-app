import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ImageBackground, Dimensions } from 'react-native';
import { Text, TextInput, Button, Surface, useTheme, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { routes } from '../../app/routes';
import { useAuth } from '../../lib/auth/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { supabase } from '../../lib/supabase';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const { signIn } = useAuth();

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
    },

    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    formContainer: {
      padding: 32,
      borderRadius: 24,
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(10px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
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
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 32,
      textAlign: 'center',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      shadowOpacity: 1,
    },
    subtitle: {
      textAlign: 'center',
      color: theme.colors.secondary,
      opacity: 0.9,
      fontSize: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      backgroundColor: 'transparent',
      height: 56,
      color: '#000000',
    },
    inputContent: {
      backgroundColor: 'transparent',
      color: '#000000',
    },
    inputLabel: {
      color: '#000000',
    },
    button: {
      marginTop: 32,
      marginBottom: 20,
      borderRadius: 12,
      elevation: 4,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    buttonContent: {
      paddingVertical: 8,
      height: 56,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 59, 48, 0.15)',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 59, 48, 0.3)',
    },
    errorText: {
      color: '#FF3B30',
      marginLeft: 12,
      flex: 1,
      textAlign: 'right',
      fontSize: 14,
    },
    linksContainer: {
      alignItems: 'center',
      marginTop: 16,
      gap: 16,
    },
    forgotPassword: {
      opacity: 0.9,
    },
    createAccountContainer: {
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    createAccountText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    createAccountButton: {
      borderRadius: 12,
      borderColor: theme.colors.primary,
    },
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`Attempting to sign in from login screen with email: ${email.substring(0, 3)}***`);
      console.log(`App running in ${__DEV__ ? 'development' : 'production'} mode`);

      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        console.error('Login error details:', signInError.message);
        
        if (!__DEV__ && signInError.message.includes('غير متوقع')) {
          console.log('Using fallback login flow for production mode...');
          
          setTimeout(async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session) {
                console.log('Session found after fallback check, navigating...');
                router.replace('/(app)/(dashboard)');
                return;
              } else {
                setError('حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى');
              }
            } catch (e) {
              console.error('Fallback login check failed:', e);
            } finally {
              setLoading(false);
            }
          }, 3000);
          
          return;
        }
        
        if (signInError.message.includes('Invalid login credentials')) {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        } else if (signInError.message.includes('تعذر الاتصال')) {
          setError(signInError.message); // Network connectivity error
        } else if (signInError.message.includes('Too many requests')) {
          setError('تم تجاوز الحد الأقصى لعدد المحاولات. يرجى المحاولة لاحقًا');
        } else if (signInError.message.includes('Failed to fetch')) {
          setError('فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت');
        } else {
          setError('حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى');
        }
        setLoading(false);
        return;
      }

      console.log('Login successful, redirecting to dashboard');
      router.replace('/(app)/(dashboard)');
    } catch (error: any) {
      console.error('Login error:', error);
      setError('حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى');
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Surface style={styles.formContainer} elevation={4}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>
                مرحباً بك
              </Text>
              <Text style={styles.subtitle}>
                قم بتسجيل الدخول للمتابعة
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#FF3B30" />
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="at" size={24} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                label="البريد الإلكتروني"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={styles.input}
                textColor="#000000"
                underlineColor="transparent"
                activeUnderlineColor={theme.colors.primary}
                error={!!error}
                mode="flat"
                contentStyle={styles.inputContent}
                theme={{
                  colors: {
                    text: '#000000',
                    placeholder: '#000000',
                    primary: theme.colors.primary,
                    onSurfaceVariant: '#000000',
                  }
                }}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="shield-key-outline" size={24} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                label="كلمة المرور"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                textColor="#000000"
                underlineColor="transparent"
                activeUnderlineColor={theme.colors.primary}
                error={!!error}
                mode="flat"
                contentStyle={styles.inputContent}
                theme={{
                  colors: {
                    text: '#000000',
                    placeholder: '#000000',
                    primary: theme.colors.primary,
                    onSurfaceVariant: '#000000',
                  }
                }}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    color={theme.colors.primary}
                  />
                }
              />
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={{ fontSize: 16, fontWeight: '600' }}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>

            <View style={styles.linksContainer}>
              <Button
                mode="text"
                onPress={() => router.push(routes.auth.forgotPassword)}
                disabled={loading}
                textColor={theme.colors.primary}
                style={styles.forgotPassword}
                labelStyle={{ fontSize: 15 }}
              >
                نسيت كلمة المرور؟
              </Button>

              <View style={styles.createAccountContainer}>
                <Text style={styles.createAccountText}>
                  ليس لديك حساب؟
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => router.push(routes.auth.register)}
                  style={styles.createAccountButton}
                  icon="account-plus"
                >
                  إنشاء حساب جديد
                </Button>
              </View>
            </View>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
} 