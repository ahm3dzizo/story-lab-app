import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ImageBackground, Platform } from 'react-native';
import { Portal } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { SideMenu } from './SideMenu';
import { NotificationsPanel } from '../ui/NotificationsPanel';
import { NotificationsService } from '@/lib/services/notifications';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Notification } from '@/lib/services/notifications';

interface AppLayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
}

export const AppLayout = ({ children, showBack = false }: AppLayoutProps) => {
  const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
  const [isNotificationsPanelVisible, setIsNotificationsPanelVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] = useState(false);
  const [notificationPage, setNotificationPage] = useState(0);
  const notificationsPerPage = 10;
  const { session } = useAuth();
  const notificationsService = NotificationsService.getInstance();

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      subscribeToNotifications();
    }
    return () => {
      notificationsService.unsubscribeAll();
    };
  }, [session]);

  const fetchNotifications = async (append = false) => {
    if (!session?.user?.id) return;
    
    const page = append ? notificationPage + 1 : 0;
    if (append) {
      setIsLoadingMoreNotifications(true);
    }
    
    try {
      const enhancedNotifications = await notificationsService.fetchNotificationsWithDetails(
        session.user.id,
        notificationsPerPage,
        page * notificationsPerPage
      );
      
      if (append) {
        setNotifications(prev => [...prev, ...enhancedNotifications]);
      } else {
        setNotifications(enhancedNotifications);
      }
      
      setHasMoreNotifications(enhancedNotifications.length === notificationsPerPage);
      if (append) {
        setNotificationPage(page);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (append) {
        setIsLoadingMoreNotifications(false);
      }
    }
  };

  const loadMoreNotifications = () => {
    fetchNotifications(true);
  };

  const subscribeToNotifications = () => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    notificationsService.subscribeToNotifications(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationsService.subscribeToEmployeeEvents(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationsService.subscribeToClientEvents(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationsService.subscribeToMessages(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationsService.subscribeToTasks(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationsService.subscribeToFinancialEvents(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationsService.subscribeToPartnerEvents(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationsService.subscribeToDepartmentEvents(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationsService.subscribeToPositionEvents(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationsService.subscribeToInvoiceEvents(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });
  };

  const handleMenuPress = () => {
    setIsSideMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsSideMenuVisible(false);
  };

  const handleNotificationsPress = () => {
    setIsNotificationsPanelVisible(true);
  };

  const handleNotificationsClose = () => {
    setIsNotificationsPanelVisible(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationsService.markAsRead(id);
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!session?.user?.id) return;
    await notificationsService.markAllAsRead(session.user.id);
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, is_read: true }))
    );
  };

  return (
    <>
      <ImageBackground 
        source={Platform.select({
          ios: require('@/assets/images/background.jpg'),
          android: require('@/assets/images/background.jpg'),
        })}
        style={styles.background}
        resizeMode="cover"
      >
        <BlurView intensity={50} style={styles.blurOverlay} tint="dark" />
        <View style={[styles.container, styles.backgroundOverlay]}>
          <Header
            showBack={showBack}
            showMenu={!showBack}
            showNotifications
            notificationCount={notifications.filter(n => !n.is_read).length}
            onMenuPress={handleMenuPress}
            onNotificationsPress={handleNotificationsPress}
          />

          <View style={styles.content}>
            {children}
          </View>

          <BottomNavigation />

          <SideMenu
            visible={isSideMenuVisible}
            onClose={handleMenuClose}
          />
        </View>
      </ImageBackground>

      <Portal>
        <View 
          style={StyleSheet.absoluteFill} 
          pointerEvents={isNotificationsPanelVisible ? "auto" : "none"}
        >
          <NotificationsPanel
            visible={isNotificationsPanelVisible}
            onClose={handleNotificationsClose}
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onLoadMore={loadMoreNotifications}
            hasMoreNotifications={hasMoreNotifications}
            isLoading={isLoadingMoreNotifications}
          />
        </View>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'ffffff',
  },
  blurOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  backgroundOverlay: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
}); 