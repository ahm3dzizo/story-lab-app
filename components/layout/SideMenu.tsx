import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Pressable, Dimensions, Platform } from 'react-native';
import { Avatar, Drawer, Text, useTheme, Portal, IconButton } from 'react-native-paper';
import { useRouter, usePathname, LinkProps } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { routes } from '@/app/routes';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { responsiveSpacing, responsiveFontSize } from '@/app/utils/responsive';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 360);

type AppRoute = LinkProps['href'];

interface MenuItem {
  key: string;
  title: string;
  icon: string;
  roles?: string[];
  route: AppRoute;
}

// Define UserData type similar to SettingsScreen
type UserData = {
  id: number;
  auth_id?: string;
  email: string;
  username: string;
  avatar_url?: string;
  department?: string;
  location?: string;
  phone?: string;
  role?: string;
  created_at: string;
  updated_at: string;
  partners?: Array<{
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
    profile_picture_url?: string;
    specialization?: string;
    user_id?: string;
  }>;
  employees?: Array<{
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
    department: string;
    position: string;
    user_id?: string;
  }>;
};

interface SideMenuProps {
  visible?: boolean;
  onClose?: () => void;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', title: 'Dashboard', icon: 'view-dashboard', route: routes.app.dashboard },
  { key: 'clients', title: 'Clients', icon: 'account-group', route: routes.app.clients.root },
  { key: 'partners', title: 'Partners', icon: 'handshake', route: routes.app.partners.root },
  { key: 'employees', title: 'Employees', icon: 'account-tie', route: routes.app.employees.root },
  { key: 'expenses', title: 'Expenses', icon: 'cash-multiple', route: routes.app.expenses.root },
  { key: 'tasks', title: 'Tasks', icon: 'clipboard-check-outline', route: routes.app.tasks.root },
  { key: 'logomotion', title: 'Animated Logo', icon: 'animation', route: routes.app.logomotion },
  { key: 'chat', title: 'Chat', icon: 'chat', route: '/(app)/chat' as AppRoute },
  { key: 'gemini', title: 'Gemini AI', icon: 'robot', route: '/(app)/chat/gemini' as AppRoute },
];

export const SideMenu = ({
  visible = false,
  onClose,
}: SideMenuProps) => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const translateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    
    if (visible) {
      translateX.setValue(-MENU_WIDTH);
      opacity.setValue(0);
      
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -MENU_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, isReady, translateX, opacity]);

  // Fetch user data when session changes or component is mounted
  useEffect(() => {
    if (session?.user?.id || session?.user?.email) {
      fetchUserData();
    }
  }, [session]);

  // Function to fetch user data - simplified version of SettingsScreen's fetchUserData
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userEmail = session?.user?.email;
      const userId = session?.user?.id;
      
      if (!userEmail && !userId) {
        console.error('No user email or ID found in session');
        setLoading(false);
        return;
      }

      // Direct email lookup - most reliable method
      if (userEmail) {
        // Try users table first
        const { data: usersByEmail, error: userEmailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail);
          
        if (!userEmailError && usersByEmail?.length) {
          console.log('SideMenu: Found user in users table');
          const userData = usersByEmail[0];
          const enhancedData = await enhanceUserData(userData);
          setUserData(enhancedData);
          setLoading(false);
          return;
        }
        
        // Try partners table next
        const { data: partnersByEmail, error: partnerEmailError } = await supabase
          .from('partners')
          .select('*')
          .eq('email', userEmail);
          
        if (!partnerEmailError && partnersByEmail?.length) {
          console.log('SideMenu: Found user in partners table');
          const partnerData = partnersByEmail[0];
          const syntheticUser = {
            id: partnerData.id,
            email: partnerData.email,
            username: partnerData.email?.split('@')[0] || 'User',
            auth_id: userId,
            role: 'Partner',
            partners: [partnerData],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUserData(syntheticUser as UserData);
          setLoading(false);
          return;
        }
        
        // Try employees table as last resort
        const { data: employeesByEmail, error: employeeEmailError } = await supabase
          .from('employees')
          .select('*')
          .eq('email', userEmail);
          
        if (!employeeEmailError && employeesByEmail?.length) {
          console.log('SideMenu: Found user in employees table');
          const employeeData = employeesByEmail[0];
          const syntheticUser = {
            id: employeeData.id,
            email: employeeData.email,
            username: employeeData.email?.split('@')[0] || 'User',
            auth_id: userId,
            role: employeeData.position || 'Employee',
            employees: [employeeData],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUserData(syntheticUser as UserData);
          setLoading(false);
          return;
        }
      }
      
      // If we get here, we couldn't find the user data
      console.log('SideMenu: Could not find user data in any table');
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      setLoading(false);
    }
  };

  // Helper function to fetch related data - simplified from SettingsScreen
  const enhanceUserData = async (userData: any) => {
    try {
      // Clone the user data to avoid mutation problems
      const enhancedData = { ...userData };
      
      // If we don't have partners data, try to fetch it
      if (!enhancedData.partners && userData.auth_id) {
        const { data: partners } = await supabase
          .from('partners')
          .select('*')
          .eq('user_id', userData.auth_id);
          
        if (partners && partners.length > 0) {
          enhancedData.partners = partners;
        }
      }
      
      // If we don't have employees data, try to fetch it
      if (!enhancedData.employees && userData.auth_id) {
        const { data: employees } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', userData.auth_id);
          
        if (employees && employees.length > 0) {
          enhancedData.employees = employees;
        }
      }
      
      // Set role based on available data
      enhancedData.role = enhancedData.role || 
                          (enhancedData.partners?.[0] ? 'Partner' : '') || 
                          (enhancedData.employees?.[0] ? enhancedData.employees[0].position || 'Employee' : '') || 
                          'User';
      
      return enhancedData;
    } catch (error) {
      console.error('Error enhancing user data:', error);
      return userData; // Return original data if enhancement fails
    }
  };

  // Get display values from userData
  const userName = userData?.username || 
                   userData?.partners?.[0]?.full_name?.split(' ')[0] || 
                   userData?.employees?.[0]?.full_name?.split(' ')[0] ||
                   userData?.email?.split('@')[0] || 
                   'User';
                   
  const userRole = userData?.role
                 ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
                 : 'User';

  const handleNavigation = (route: AppRoute) => {
    onClose?.();
    setTimeout(() => {
      router.replace(route);
    }, 100);
  };

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleLogout = () => {
    onClose?.();
    setTimeout(() => {
      router.replace(routes.auth.logout);
    }, 100);
  };

  const filteredMenuItems = menuItems.filter(
    item => !item.roles || item.roles.includes(userRole)
  );

  const isRouteActive = (route: AppRoute) => {
    try {
      const routeStr = route.toString();
      return pathname.startsWith(routeStr);
    } catch (e) {
      return false;
    }
  };

  const getAvatarSource = () => {
    try {
      if (userData?.avatar_url) {
        return { uri: userData.avatar_url };
      } else if (userData?.partners?.[0]?.profile_picture_url) {
        return { uri: userData.partners[0].profile_picture_url };
      } else {
        return require('@/assets/images/defaultavatar.png');
      }
    } catch (e) {
      return require('@/assets/images/defaultavatar.png');
    }
  };

  if (!isReady) return null;

  const menuContent = (
    <BlurView intensity={100} style={styles.drawer}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.headerContent}>
            <Avatar.Image
              size={64}
              source={getAvatarSource()}
              style={[styles.avatar, loading && { opacity: 0.5 }]}
            />
            <View style={styles.userInfo}>
              <Text variant="titleMedium" style={[styles.userName, { color: theme.colors.onPrimary }]}>
                {loading ? 'Loading...' : userName}
              </Text>
              <Text variant="bodySmall" style={[styles.userRole, { color: theme.colors.onPrimary }]}>
                {loading ? '...' : userRole}
              </Text>
            </View>
          </View>
          <IconButton
            icon="close"
            iconColor={theme.colors.onPrimary}
            size={24}
            onPress={() => {
              if (!loading && onClose) {
                onClose();
              }
            }}
            style={styles.closeButton}
            disabled={loading}
          />
        </View>

        <View style={styles.content}>
          {filteredMenuItems.map((item) => (
            <Drawer.Item
              key={item.key}
              icon={item.icon}
              label={item.title}
              active={isRouteActive(item.route)}
              onPress={() => handleNavigation(item.route)}
              style={[
                styles.menuItem,
                isRouteActive(item.route) && styles.activeMenuItem,
              ]}
              theme={{
                colors: {
                  ...theme.colors,
                  onSurfaceVariant: '#000000',
                  onSurface: '#000000',
                  primary: '#000000',
                },
              }}
              disabled={loading}
            />
          ))}
        </View>

        <Animated.View style={[styles.logoutContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutGradient,
              { opacity: pressed || loading ? 0.7 : 1 },
            ]}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF4949']}
              style={styles.logout}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#ffffff" />
              <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </BlurView>
  );

  return (
    <Portal>
      <Pressable 
        style={[styles.backdrop, { display: visible ? 'flex' : 'none' }]} 
        onPress={() => {
          if (!loading && onClose) {
            onClose();
          }
        }}
      >
        <Animated.View style={[styles.backdrop, { opacity }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX }] },
        ]}
      >
        {menuContent}
      </Animated.View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: MENU_WIDTH,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  drawer: {
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: '#ffffff',
    borderTopRightRadius: responsiveSpacing(16),
    borderBottomRightRadius: responsiveSpacing(16),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: responsiveSpacing(16),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  closeButton: {
    margin: responsiveSpacing(-6),
    marginTop: responsiveSpacing(-3),
  },
  avatar: {
    marginBottom: responsiveSpacing(12),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  userInfo: {
    gap: responsiveSpacing(2),
  },
  userName: {
    fontWeight: '600',
    fontSize: responsiveFontSize(16),
  },
  userRole: {
    opacity: 0.9,
    fontSize: responsiveFontSize(14),
  },
  content: {
    flex: 1,
    paddingTop: responsiveSpacing(6),
  },
  menuItem: {
    borderRadius: responsiveSpacing(8),
    marginHorizontal: responsiveSpacing(6),
    marginVertical: responsiveSpacing(1),
    height: responsiveSpacing(44),
    color: 'red',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoutContainer: {
    paddingHorizontal: responsiveSpacing(6),
    marginTop: 'auto',
    marginBottom: responsiveSpacing(12),
  },
  logoutGradient: {
    borderRadius: responsiveSpacing(8),
    overflow: 'hidden',
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsiveSpacing(10),
    gap: responsiveSpacing(6),
  },
  logoutText: {
    color: '#ffffff',
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
  },
}); 