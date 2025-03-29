import React from 'react';
import { StyleSheet, View, Animated, Pressable, ScrollView, ViewStyle } from 'react-native';
import {
  Text,
  useTheme,
  IconButton,
  Button,
  MD3Theme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { GradientCard } from './GradientCard';
import { gradients, shadows } from '@/lib/theme';

interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  source?: 'task' | 'message' | 'employee' | 'client' | 'system' | 'partner' | 'department' | 'position';
  reference_id?: string;
  reference_type?: string;
}

interface NotificationsPanelProps {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onLoadMore?: () => void;
  hasMoreNotifications?: boolean;
  isLoading?: boolean;
}

export function NotificationsPanel({
  visible,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onLoadMore,
  hasMoreNotifications = false,
  isLoading = false,
}: NotificationsPanelProps) {
  const theme = useTheme<MD3Theme>();
  const translateY = React.useRef(new Animated.Value(-500)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -500,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return 'information';
      case 'warning':
        return 'alert';
      case 'error':
        return 'alert-circle';
      case 'success':
        return 'check-circle';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info':
        return theme.colors.primary;
      case 'warning':
        return theme.colors.tertiary;
      case 'error':
        return theme.colors.error;
      case 'success':
        return theme.colors.secondaryContainer;
      default:
        return theme.colors.onSurface;
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'task':
        return 'clipboard-check';
      case 'message':
        return 'message-text';
      case 'employee':
        return 'account';
      case 'client':
        return 'briefcase';
      case 'system':
        return 'cog';
      case 'partner':
        return 'handshake';
      case 'department':
        return 'domain';
      case 'position':
        return 'badge-account-horizontal';
      default:
        return 'bell';
    }
  };

  return (
    <>
      {visible && (
        <Pressable
          style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={onClose}
        />
      )}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
            opacity,
            backgroundColor: theme.colors.surface,
          }
        ]}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
          <View style={styles.headerContent}>
            <Text style={[theme.fonts.titleLarge, styles.title, { color: theme.colors.onSurface }]}>
              Notifications
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              iconColor={theme.colors.onSurface}
            />
          </View>
          {notifications.length > 0 && (
            <Button
              mode="contained-tonal"
              onPress={onMarkAllAsRead}
              style={styles.markAllButton}
              disabled={notifications.every(n => n.is_read)}
            >
              Mark All as Read
            </Button>
          )}
        </View>

        <ScrollView style={styles.content}>
          {notifications.length === 0 ? (
            <GradientCard gradient={gradients.surface as [string, string]} style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="bell-off"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No notifications
              </Text>
            </GradientCard>
          ) : (
            <>
              {notifications.map((notification) => (
                <GradientCard
                  key={notification.id}
                  gradient={notification.is_read ? gradients.surface as [string, string] : gradients.card as [string, string]}
                  style={Object.assign({}, styles.notificationCard, notification.is_read ? styles.readCard : {})}
                >
                  <View style={styles.notificationHeader}>
                    <View style={styles.iconContainer}>
                      <MaterialCommunityIcons
                        name={getNotificationIcon(notification.type)}
                        size={24}
                        color={getNotificationColor(notification.type)}
                      />
                      {notification.source && (
                        <MaterialCommunityIcons
                          name={getSourceIcon(notification.source)}
                          size={16}
                          color={theme.colors.onSurfaceVariant}
                          style={[styles.sourceIcon, { backgroundColor: theme.colors.surface }]}
                        />
                      )}
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, { color: theme.colors.onSurface }]}>
                        {notification.title}
                      </Text>
                      <Text style={[styles.notificationMessage, { color: theme.colors.onSurfaceVariant }]}>
                        {notification.message}
                      </Text>
                      <Text style={[styles.notificationTime, { color: theme.colors.onSurfaceVariant }]}>
                        {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                      </Text>
                    </View>
                    {!notification.is_read && (
                      <IconButton
                        icon="check"
                        size={20}
                        onPress={() => onMarkAsRead(notification.id)}
                        iconColor={theme.colors.primary}
                      />
                    )}
                  </View>
                </GradientCard>
              ))}
              
              {hasMoreNotifications && (
                <Button
                  mode="contained-tonal"
                  onPress={onLoadMore}
                  style={styles.loadMoreButton}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Load More
                </Button>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  } as ViewStyle,
  container: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 350,
    maxHeight: '80%',
    zIndex: 1001,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.large,
  } as ViewStyle,
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
  markAllButton: {
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  emptyCard: {
    margin: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    opacity: 0.7,
  },
  notificationCard: {
    margin: 8,
    marginHorizontal: 16,
  } as ViewStyle,
  readCard: {
    opacity: 0.8,
  } as ViewStyle,
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 4,
  },
  loadMoreButton: {
    margin: 16,
  },
  iconContainer: {
    position: 'relative',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceIcon: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    borderRadius: 8,
    padding: 2,
  },
}); 