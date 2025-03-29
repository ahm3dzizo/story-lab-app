import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { routes } from '@/app/routes';
import { View, ActivityIndicator } from 'react-native';

export default function LogoutScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut();
        router.replace(routes.auth.login);
      } catch (error) {
        console.error('Error during logout:', error);
        router.replace(routes.auth.login);
      }
    };

    handleLogout();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
} 