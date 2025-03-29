import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Avatar, TouchableRipple, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { SafeAreaView } from 'react-native-safe-area-context';

type User = {
  id: string;
  full_name: string;
  avatar_url?: string;
  email: string;
};

export default function NewPrivateChatScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const currentUser = session?.user;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .neq('id', currentUser?.id)
        .order('full_name');

      if (error) throw error;
      setUsers(users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (user: User) => {
    try {
      // Check if chat already exists
      const { data: existingChats, error: chatError } = await supabase
        .from('chats')
        .select(`
          id, 
          chat_participants!inner(user_id)
        `)
        .eq('type', 'private');

      if (chatError) throw chatError;

      // Filter chats that have both users
      const matchingChat = existingChats?.filter(chat => {
        const participants = chat.chat_participants.map((p: any) => p.user_id);
        return participants.includes(currentUser?.id) && participants.includes(user.id) && participants.length === 2;
      })[0];

      let chatId;

      if (matchingChat) {
        // Use existing chat
        chatId = matchingChat.id;
      } else {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            type: 'private',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        chatId = newChat.id;

        // Add participants
        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert([
            { chat_id: chatId, user_id: currentUser?.id },
            { chat_id: chatId, user_id: user.id }
          ]);

        if (participantsError) throw participantsError;
      }

      // Navigate to chat
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const renderUserItem = ({ item: user }: { item: User }) => (
    <TouchableRipple
      onPress={() => handleUserSelect(user)}
      style={styles.userItem}
    >
      <View style={styles.userContent}>
        {user.avatar_url ? (
          <Avatar.Image
            size={40}
            source={{ uri: user.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <Avatar.Text
            size={40}
            label={user.full_name.substring(0, 2)}
            style={styles.avatar}
          />
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.full_name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>
    </TouchableRipple>
  );

  return (
    <AppLayout>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            New Chat
          </Text>
        </View>

        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <FlatList
          data={users.filter(user =>
            user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.userList}
          refreshing={loading}
          onRefresh={loadUsers}
        />
      </SafeAreaView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
  searchBar: {
    margin: 16,
    borderRadius: 0,
  },
  userList: {
    paddingHorizontal: 16,
  },
  userItem: {
    marginBottom: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
}); 