import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Pressable, Alert, Dimensions, TouchableHighlight, RefreshControl } from 'react-native';
import { Text, Avatar, IconButton, useTheme, Searchbar, FAB, Portal, Menu } from 'react-native-paper';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

type Chat = {
  id: string;
  name?: string;
  type: 'public' | 'private' | 'group';
  unread_count: number;
  created_at: string;
  updated_at: string;
  participants?: {
    user: {
      id: string;
      full_name: string;
      avatar_url?: string;
    }
  }[];
  last_message?: {
    id: string;
    message: string;
    message_type?: string;
  created_at: string;
    user_id?: string;
    user: {
      id: string;
      full_name: string;
      avatar_url?: string;
    }
  };
};

export default function ChatScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { session } = useAuth();
  const currentUser = session?.user;
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatMenu, setShowNewChatMenu] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [mutedChats, setMutedChats] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadChats();
    // Subscribe to realtime updates
    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        loadChats();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const loadChats = async () => {
    try {
      setLoading(true);
      
      // First, add the public chat
      const publicChat: Chat = {
        id: 'public',
        name: 'Public Chat',
        type: 'public',
        unread_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Fetch last message for public chat
      const { data: publicMessages, error: publicMessageError } = await supabase
        .from('messages')
        .select(`
          id, 
          message, 
          message_type,
          created_at, 
          user_id
        `)
        .eq('chat_id', 'public')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!publicMessageError && publicMessages && publicMessages.length > 0) {
        const lastMsg = publicMessages[0];
        
        // Get user info separately
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', lastMsg.user_id)
          .single();
        
        if (!userError && userData) {
          publicChat.last_message = {
            id: lastMsg.id,
            message: lastMsg.message,
            message_type: lastMsg.message_type,
            created_at: lastMsg.created_at,
            user_id: lastMsg.user_id,
            user: {
              id: userData.id,
              full_name: userData.full_name,
              avatar_url: userData.avatar_url
            }
          };
          publicChat.updated_at = lastMsg.created_at;
        }
      }

      // Fetch private and group chats
      const { data: privateChats, error: privateError } = await supabase
        .from('chats')
        .select(`
          id,
          name,
          type,
          created_at,
          updated_at,
          participants:chat_participants(
            user:profiles(
              id,
              full_name, 
              avatar_url
            )
          )
        `)
        .neq('type', 'public')
        .order('updated_at', { ascending: false });

      if (privateError) throw privateError;

      // Process private chats with proper typing
      const processedChats = await Promise.all((privateChats || []).map(async (chat) => {
        const chatObj: Chat = {
          id: chat.id,
          name: chat.name,
          type: chat.type,
          unread_count: 0,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          participants: chat.participants?.map((p: any) => ({
            user: {
              id: p.user?.id || '',
              full_name: p.user?.full_name || '',
              avatar_url: p.user?.avatar_url
            }
          })) || []
        };

        // Fetch last message for this chat
        const { data: chatMessages, error: messageError } = await supabase
          .from('messages')
          .select(`
            id, 
            message, 
            message_type,
            created_at, 
            user_id
          `)
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!messageError && chatMessages && chatMessages.length > 0) {
          const lastMsg = chatMessages[0];
          
          // Get user info separately
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', lastMsg.user_id)
            .single();
          
          if (!userError && userData) {
            chatObj.last_message = {
              id: lastMsg.id,
              message: lastMsg.message,
              message_type: lastMsg.message_type,
              created_at: lastMsg.created_at,
              user_id: lastMsg.user_id,
              user: {
                id: userData.id,
                full_name: userData.full_name,
                avatar_url: userData.avatar_url
              }
            };
            chatObj.updated_at = lastMsg.created_at;
          }
        }

        return chatObj;
      }));

      // Combine public chat with private/group chats and sort by updated_at
      const allChats = [publicChat, ...processedChats].sort((a, b) => {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      
      setChats(allChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleNewPrivateChat = () => {
    router.push('/chat/new/private');
    setShowNewChatMenu(false);
  };

  const handleNewGroupChat = () => {
    router.push('/chat/new/group');
    setShowNewChatMenu(false);
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  const handleChatPress = (chat: Chat) => {
    if (chat.type === 'public') {
      router.push('/chat/public');
    } else {
      router.push(`/chat/${chat.id}`);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (chatId === 'public') {
      Alert.alert('Cannot delete public chat');
      return;
    }
    
    try {
      // Delete chat participants first due to foreign key constraints
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId);

      if (participantsError) throw participantsError;
      
      // Then delete the chat
      const { error: chatError } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
        
      if (chatError) throw chatError;
      
      // Update the local state
      setChats(chats.filter(chat => chat.id !== chatId));
      setShowChatMenu(false);
    } catch (error) {
      console.error('Error deleting chat:', error);
      Alert.alert('Error', 'Failed to delete chat');
    }
  };

  const handleMarkAsRead = (chatId: string) => {
    // Implement mark as read functionality
    // This would typically update a read status in the database
    setChats(chats.map(chat => 
      chat.id === chatId ? { ...chat, unread_count: 0 } : chat
    ));
    setShowChatMenu(false);
  };

  const handleToggleMute = (chatId: string) => {
    setMutedChats(prev => {
      const newMuted = new Set(prev);
      if (newMuted.has(chatId)) {
        newMuted.delete(chatId);
      } else {
        newMuted.add(chatId);
      }
      return newMuted;
    });
    setShowChatMenu(false);
  };

  const getChatTypeBadge = (chat: Chat) => {
    if (chat.type === 'public') {
      return (
        <View style={styles.chatTypeBadge}>
          <Text style={styles.chatTypeBadgeText}>PUBLIC</Text>
        </View>
      );
    } else if (chat.type === 'group') {
      return (
        <View style={styles.chatTypeBadge}>
          <Text style={styles.chatTypeBadgeText}>GROUP</Text>
        </View>
      );
    }
    return null;
  };

  const renderChatItem = ({ item: chat }: { item: Chat }) => {
    const lastMessageTime = chat.last_message?.created_at 
      ? formatMessageDate(chat.last_message.created_at) 
      : '';
    
    const otherParticipant = chat.type === 'private'
      ? chat.participants?.find(p => p.user.id !== currentUser?.id)
      : null;
    
    const chatName = chat.type === 'public' 
      ? 'Public Chat' 
      : chat.type === 'private' 
        ? otherParticipant?.user.full_name || 'Chat' 
        : chat.name || 'Group';
    
    // Determine message status icon (sent, delivered, read)
    const getMessageStatusIcon = () => {
      // For demo purposes, we'll show different statuses based on message ID length
      const messageId = chat.last_message?.id || "";
      if (!messageId) return null;
      
      if (chat.last_message?.user_id === currentUser?.id) {
        if (messageId.length % 3 === 0) {
          return (
            <MaterialCommunityIcons
              name="check-all"
              size={16}
              color="#3b82f6"
              style={styles.messageStatus}
            />
          );
        } else if (messageId.length % 3 === 1) {
          return (
            <MaterialCommunityIcons
              name="check-all"
              size={16}
              color="rgba(255, 255, 255, 0.6)"
              style={styles.messageStatus}
            />
          );
        } else {
          return (
            <MaterialCommunityIcons
              name="check"
              size={16}
              color="rgba(255, 255, 255, 0.6)"
              style={styles.messageStatus}
            />
          );
        }
      }
      return null;
    };

    // Format message preview based on message type
    const getMessagePreview = () => {
      if (!chat.last_message) return null;
      
      const messageType = chat.last_message.message_type || 'text';
      const senderPrefix = chat.type !== 'private' && chat.last_message.user ? (
        <Text style={styles.senderName}>
          {chat.last_message.user.full_name}:{' '}
        </Text>
      ) : null;
      
      switch (messageType) {
        case 'audio':
          return (
            <Text 
              style={[
                styles.messagePreview, 
                mutedChats.has(chat.id) && styles.mutedText,
                chat.unread_count > 0 && styles.unreadMessage
              ]} 
              numberOfLines={1}
            >
              {senderPrefix}
              <MaterialCommunityIcons name="microphone" size={14} color="#3b82f6" />
              {' Audio message'}
            </Text>
          );
        case 'image':
          return (
            <Text 
              style={[
                styles.messagePreview, 
                mutedChats.has(chat.id) && styles.mutedText,
                chat.unread_count > 0 && styles.unreadMessage
              ]} 
              numberOfLines={1}
            >
              {senderPrefix}
              <MaterialCommunityIcons name="image" size={14} color="#3b82f6" />
              {' Photo'}
            </Text>
          );
        case 'file':
          return (
            <Text 
              style={[
                styles.messagePreview, 
                mutedChats.has(chat.id) && styles.mutedText,
                chat.unread_count > 0 && styles.unreadMessage
              ]} 
              numberOfLines={1}
            >
              {senderPrefix}
              <MaterialCommunityIcons name="file-document" size={14} color="#3b82f6" />
              {' File'}
            </Text>
          );
        default:
          return (
            <Text 
              style={[
                styles.messagePreview, 
                mutedChats.has(chat.id) && styles.mutedText,
                chat.unread_count > 0 && styles.unreadMessage
              ]} 
              numberOfLines={1}
            >
              {senderPrefix}
              {chat.last_message.message}
            </Text>
          );
      }
    };
    
    return (
      <TouchableHighlight
        underlayColor="#1a2b4a"
      onPress={() => handleChatPress(chat)}
        onLongPress={() => {
          setSelectedChatId(chat.id);
          setShowChatMenu(true);
          // Center the menu on the pressed chat
          const yOffset = 120 + (chats.indexOf(chat) * 80);
          setMenuPosition({ x: Dimensions.get('window').width / 2, y: yOffset });
        }}
        style={[
          styles.chatCard,
          mutedChats.has(chat.id) && styles.mutedChat
        ]}
      >
        <View style={styles.chatCardContent}>
          {/* Avatar section */}
          <View style={styles.avatarContainer}>
      {chat.type === 'public' ? (
        <Avatar.Icon
          size={50}
          icon="forum"
          style={styles.avatar}
        />
      ) : chat.type === 'private' ? (
              otherParticipant?.user.avatar_url ? (
            <Avatar.Image 
            size={50}
                  source={{ uri: otherParticipant.user.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <Avatar.Text
            size={50}
                  label={otherParticipant?.user.full_name.substring(0, 2) || '??'}
            style={styles.avatar}
          />
        )
      ) : (
        <Avatar.Text
          size={50}
          label={chat.name?.substring(0, 2) || 'G'}
          style={styles.avatar}
        />
      )}
          </View>

          {/* Chat info section */}
          <View style={styles.chatDetails}>
        <View style={styles.chatHeader}>
              <View style={styles.chatNameContainer}>
                <Text 
                  style={[
                    styles.chatName, 
                    mutedChats.has(chat.id) && styles.mutedText,
                    chat.unread_count > 0 && styles.unreadChatName
                  ]} 
                  numberOfLines={1}
                >
                  {chatName}
          </Text>
                {getChatTypeBadge(chat)}
                {mutedChats.has(chat.id) && (
                  <MaterialCommunityIcons
                    name="volume-off"
                    size={14}
                    color="rgba(255, 255, 255, 0.6)"
                    style={styles.muteIcon}
                  />
          )}
        </View>
              <Text style={[styles.messageTime, mutedChats.has(chat.id) && styles.mutedText]}>
                {lastMessageTime}
              </Text>
            </View>
            
            {/* Message preview */}
            <View style={styles.messagePreviewContainer}>
              {chat.last_message ? (
                <View style={styles.lastMessageRow}>
                  {/* Check marks for message status */}
                  {getMessageStatusIcon()}
                  
                  {/* Message preview based on type */}
                  {getMessagePreview()}
                  
            {chat.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {chat.unread_count}
            </Text>
              </View>
            )}
          </View>
              ) : (
                <Text style={[styles.noMessages, mutedChats.has(chat.id) && styles.mutedText]}>
                  No messages yet
                </Text>
              )}
            </View>
          </View>
          
          {/* Action buttons */}
          <View style={styles.chatActions}>
            {mutedChats.has(chat.id) ? (
              <IconButton
                icon="bell"
                size={20}
                iconColor="rgba(255, 255, 255, 0.6)"
                style={styles.actionButton}
                onPress={() => handleToggleMute(chat.id)}
              />
            ) : (
              <IconButton
                icon="bell-off"
                size={20}
                iconColor="rgba(255, 255, 255, 0.6)"
                style={styles.actionButton}
                onPress={() => handleToggleMute(chat.id)}
              />
            )}
            
            {chat.id !== 'public' && (
              <IconButton
                icon="delete-outline"
                size={20}
                iconColor="rgba(255, 255, 255, 0.6)"
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Chat',
                    'Are you sure you want to delete this chat?',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Delete',
                        onPress: () => handleDeleteChat(chat.id),
                        style: 'destructive',
                      },
                    ]
                  );
                }}
              />
        )}
      </View>
        </View>
      </TouchableHighlight>
  );
  };

  const isPublicChat = chats.some(chat => chat.type === 'public');

  useEffect(() => {
    loadChats();

    // Set up subscription for new messages
    const subscription = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // When a new message comes in, reload the chats to update the order and last message
          loadChats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshChats = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  return (
    <AppLayout>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Chats
          </Text>
        </View>

        <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search chats..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
            iconColor="#8b9cb5"
            inputStyle={styles.searchInput}
            elevation={0}
        />
        </View>

        <FlatList
          data={chats.filter(chat => 
            chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.type === 'public' && 'Public Chat'.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.participants?.[0]?.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshChats}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
              progressBackgroundColor="#1e293b"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={64}
                color="rgba(255, 255, 255, 0.2)"
              />
              <Text style={styles.emptyStateText}>
                No chats yet. Start a new conversation!
              </Text>
      </View>
          }
        />

        <Portal>
          <Menu
            visible={showChatMenu}
            onDismiss={() => setShowChatMenu(false)}
            anchor={menuPosition}
          >
            <Menu.Item
              onPress={() => {
                setShowChatMenu(false);
                if (selectedChatId) handleMarkAsRead(selectedChatId);
              }}
              title="Mark as Read"
              leadingIcon="email-open-outline"
            />
            <Menu.Item
              onPress={() => {
                setShowChatMenu(false);
                if (selectedChatId) handleToggleMute(selectedChatId);
              }}
              title={mutedChats.has(selectedChatId || '') ? "Unmute Notifications" : "Mute Notifications"}
              leadingIcon={mutedChats.has(selectedChatId || '') ? "bell" : "bell-off"}
            />
            <Menu.Item
              onPress={() => {
                setShowChatMenu(false);
                if (selectedChatId && selectedChatId !== 'public') {
                  Alert.alert(
                    'Delete Chat',
                    'Are you sure you want to delete this chat?',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Delete',
                        onPress: () => selectedChatId && handleDeleteChat(selectedChatId),
                        style: 'destructive',
                      },
                    ]
                  );
                } else if (selectedChatId === 'public') {
                  Alert.alert('Cannot Delete', 'The public chat cannot be deleted');
                }
              }}
              title="Delete Chat"
              leadingIcon="delete-outline"
              disabled={selectedChatId === 'public'}
            />
          </Menu>

          <FAB.Group
            open={showNewChatMenu}
            visible={pathname === '/chat' || pathname === '/chat/'}
            icon={showNewChatMenu ? 'close' : 'plus'}
            actions={[
              {
                icon: 'account-multiple',
                label: 'New Group Chat',
                onPress: handleNewGroupChat,
              },
              {
                icon: 'account',
                label: 'New Private Chat',
                onPress: handleNewPrivateChat,
              },
            ]}
            onStateChange={({ open }) => setShowNewChatMenu(open)}
            style={styles.fab}
          />
        </Portal>
      </SafeAreaView>
    </AppLayout>
  );
}
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    backgroundColor: '#0a1022',
    },
    header: {
    padding: 16,
      flexDirection: 'row',
    justifyContent: 'space-between',
      alignItems: 'center',
  },
  title: {
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
  },
  searchBar: {
    marginVertical: 0,
    marginHorizontal: 0,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    elevation: 0,
  },
  searchInput: {
    color: '#fff',
    fontSize: 16,
  },
  chatList: {
    paddingHorizontal: 0,
    paddingBottom: 70,
  },
  chatCard: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatDetails: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
      marginBottom: 4,
    },
  chatNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatName: {
    fontSize: 16,
      fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  lastMessage: {
      flexDirection: 'row',
    justifyContent: 'space-between',
      alignItems: 'center',
  },
  messagePreview: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flexShrink: 1,
  },
  senderName: {
    fontWeight: '600',
    color: '#3b82f6',
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
      alignItems: 'center',
    justifyContent: 'center',
      marginLeft: 8,
    },
  unreadCount: {
    color: '#fff',
      fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 16,
      fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
    },
  fab: {
      position: 'absolute',
    margin: 1,
    right: -10,
    bottom: 65,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButtonLabel: {
    color: '#fff',
    },
  chatMenuButton: {
    marginLeft: 0,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mutedChat: {
    opacity: 0.7,
    borderStyle: 'dashed',
  },
  mutedText: {
    opacity: 0.6,
  },
  unreadChatName: {
    fontWeight: '700',
    color: '#f8fafc',
  },
  muteIcon: {
    marginLeft: 6,
  },
  messageStatus: {
    marginRight: 4,
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '85%',
  },
  unreadMessage: {
    color: '#e2e8f0',
    fontWeight: '500',
  },
  noMessages: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
  chatTypeBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  chatTypeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  chatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: 8,
  },
  actionButton: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  });