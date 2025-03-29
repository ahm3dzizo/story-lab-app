import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Avatar, Checkbox, Button, TextInput, useTheme } from 'react-native-paper';
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
  selected?: boolean;
};

export default function NewGroupChatScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
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

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.size < 2) {
      return;
    }

    try {
      // Create new group chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          name: groupName.trim(),
          type: 'group',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating group chat:', createError);
        throw createError;
      }

      // Add participants including current user
      const participants = [
        { chat_id: newChat.id, user_id: currentUser?.id },
        ...Array.from(selectedUsers).map(userId => ({
          chat_id: newChat.id,
          user_id: userId
        }))
      ];

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      // Navigate to new group chat
      router.push(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error creating group chat:', error);
    }
  };

  const renderUserItem = ({ item: user }: { item: User }) => (
    <View style={styles.userItem}>
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
        <Checkbox
          status={selectedUsers.has(user.id) ? 'checked' : 'unchecked'}
          onPress={() => toggleUserSelection(user.id)}
        />
      </View>
    </View>
  );

  return (
    <AppLayout>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            New Group
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            style={styles.groupNameInput}
            mode="outlined"
          />

          <Searchbar
            placeholder="Search users..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

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

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.size < 2}
            style={styles.createButton}
          >
            Create Group ({selectedUsers.size} selected)
          </Button>
        </View>
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
  form: {
    padding: 16,
    gap: 16,
  },
  groupNameInput: {
    backgroundColor: '#0f172a',
  },
  searchBar: {
    borderRadius: 0,
  },
  userList: {
    paddingHorizontal: 16,
    paddingBottom: 120,
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
  footer: {
    padding: 1,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#transparent',
    zIndex: 5,
    marginBottom: 77,
  },
  createButton: {
    borderRadius: 0,
    marginVertical: 1,
    height: 50,
  },
}); 