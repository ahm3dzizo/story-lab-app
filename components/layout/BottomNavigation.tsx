import React from 'react';
import { StyleSheet, View, Pressable, Dimensions, Platform } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { usePathname, useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { responsiveSpacing, responsiveFontSize } from '@/app/utils/responsive';
import { routes } from '@/app/routes';

type Route = {
  key: string;
  title: string;
  focusedIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  unfocusedIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  href: Parameters<typeof Link>[0]['href'];
};

export const BottomNavigation = () => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const windowWidth = Dimensions.get('window').width;
  const isIOS = Platform.OS === 'ios';

  // Navigation routes for mobile
  const navigationRoutes: Route[] = [
    { 
      key: 'dashboard',
      title: 'Home',
      focusedIcon: 'view-dashboard',
      unfocusedIcon: 'view-dashboard-outline',
      href: '/(app)/(dashboard)' as any
    },
    { 
      key: 'employees',
      title: 'Employees',
      focusedIcon: 'account-group',
      unfocusedIcon: 'account-group-outline',
      href: '/(app)/(employees)' as any
    },
    { 
      key: 'clients',
      title: 'Clients',
      focusedIcon: 'briefcase-account',
      unfocusedIcon: 'briefcase-account-outline',
      href: '/(app)/clients' as any
    },
    { 
      key: 'partners',
      title: 'Partners',
      focusedIcon: 'handshake',
      unfocusedIcon: 'handshake-outline',
      href: '/(app)/(partners)' as any
    },
    { 
      key: 'expenses',
      title: 'Expenses',
      focusedIcon: 'currency-usd',
      unfocusedIcon: 'currency-usd-off',
      href: '/(app)/(expenses)' as any
    }
  ];

  const getActiveRouteIndex = (): number => {
    // Handle special case for root path and dashboard
    if (pathname === '/(app)' || pathname === '/(app)/' || pathname.includes('/(app)/(dashboard)')) {
      return 0; // Dashboard index
    }

    // Handle employees route
    if (pathname.includes('/(app)/(employees)')) {
      return 1; // Employees index
    }

    // Handle clients route
    if (pathname.includes('/(app)/clients')) {
      return 2; // Clients index
    }

    // Handle partners route
    if (pathname.includes('/(app)/(partners)')) {
      return 3; // Partners index
    }

    // Handle expenses route
    if (pathname.includes('/(app)/(expenses)')) {
      return 4; // Expenses index
    }

    // Extract the main route segment and handle grouped routes
    const segments = pathname.split('/');
    const mainRoute = segments[2] || '';
    const routePattern = mainRoute.replace(/^\(|\)$/g, ''); // Remove parentheses

    // Find matching route
    const index = navigationRoutes.findIndex(route => {
      // Handle different href types safely
      const routeHref = typeof route.href === 'string' 
        ? route.href 
        : (route.href as any).pathname || '';
      
      const routeSegments = routeHref.toString().split('/');
      const routePath = routeSegments[2] || '';
      const cleanRoutePath = routePath.replace(/^\(|\)$/g, ''); // Remove parentheses
      
      return cleanRoutePath === routePattern;
    });

    return index >= 0 ? index : 0;
  };

  const handleNavigation = (route: Route) => {
    router.replace(route.href);
  };

  const activeIndex = getActiveRouteIndex();

  return (
    <View style={styles.navWrapper}>
      <BlurView 
        intensity={isIOS ? 60 : 90} 
        tint="dark"
        style={[
          styles.container, 
          { 
            paddingBottom: Math.max(insets.bottom, 10),
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }
        ]}
      >
        <View style={styles.gradientBorder} />
        <View style={styles.navigationBar}>
          {navigationRoutes.map((route, index) => {
            const isActive = index === activeIndex;
            
            return (
              <Pressable
                key={route.key}
                style={[
                  styles.navItem,
                  { width: windowWidth / navigationRoutes.length }
                ]}
                onPress={() => handleNavigation(route)}
                android_ripple={{ 
                  color: theme.colors.primaryContainer, 
                  borderless: true,
                  radius: 24
                }}
              >
                <View style={[
                  styles.navItemContent,
                  isActive && styles.activeNavItem
                ]}>
                  <MaterialCommunityIcons
                    name={isActive ? route.focusedIcon : route.unfocusedIcon}
                    size={24}
                    color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
                    style={[
                      styles.icon,
                      isActive && styles.activeIcon
                    ]}
                  />
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.navLabel,
                      { 
                        color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant,
                        opacity: isActive ? 1 : 0.7,
                        fontWeight: isActive ? '600' : '400'
                      },
                    ]}
                  >
                    {route.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  container: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderTopWidth: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: responsiveSpacing(60),
    paddingHorizontal: responsiveSpacing(8),
  },
  navItem: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing(8),
    paddingHorizontal: responsiveSpacing(12),
    borderRadius: 20,
  },
  activeNavItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navLabel: {
    fontSize: responsiveFontSize(10),
    marginTop: responsiveSpacing(4),
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  icon: {
    opacity: 0.9,
  },
  activeIcon: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  activeIndicator: {
    height: responsiveSpacing(3),
    width: responsiveSpacing(20),
    borderRadius: responsiveSpacing(1.5),
    marginTop: responsiveSpacing(4),
  },
}); 