import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, RefreshControl, TouchableOpacity, Image, Modal, Dimensions, ScrollView, Linking, Keyboard } from 'react-native';
import { Text, Avatar, IconButton, useTheme, TextInput, Portal, Menu } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import EmojiPicker from 'rn-emoji-keyboard';
import * as FileSystem from 'expo-file-system';
import { ImageEditor } from '@/app/components/ImageEditor';
import { decode } from 'base64-arraybuffer';

interface UserMetadata {
  full_name: string;
  avatar_url?: string;
}

interface MessageData {
  chat_id: string;
  user_id: string | undefined;
  message: string;
  message_type: 'text' | 'audio' | 'image' | 'file';
  audio_url?: string;
  attachment_url?: string;
  attachment_type?: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  chat_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'audio' | 'image' | 'file';
  audio_url?: string;
  attachment_url?: string;
  attachment_type?: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  status: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
    user_metadata: UserMetadata;
  };
}

const PUBLIC_CHAT_ID = '00000000-0000-0000-0000-000000000000';

export default function PublicChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const [playingAudio, setPlayingAudio] = useState<{ [key: string]: Audio.Sound | null }>({});
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageEditorVisible, setIsImageEditorVisible] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const currentUser = session?.user;
  const flatListRef = useRef<FlatList>(null);

  const initializePublicChat = async () => {
    try {
      // Check if public chat exists
      const { data: existingChat, error: checkError } = await supabase
        .from('chats')
        .select('id')
        .eq('id', PUBLIC_CHAT_ID)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // If public chat doesn't exist, create it
      if (!existingChat) {
        const { error: createError } = await supabase
          .from('chats')
          .insert({
            id: PUBLIC_CHAT_ID,
            name: 'Public Chat',
            type: 'public',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) throw createError;
      }
    } catch (error) {
      console.error('Error initializing public chat:', error);
      Alert.alert('Error', 'Failed to initialize public chat');
    }
  };

  useEffect(() => {
    const setup = async () => {
      await initializePublicChat();
      await loadMessages();
      await setupAudioMode();
    };
    
    setup();
    
    // Add keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (messages.length > 0) {
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      }
    );
    
    // Subscribe to new messages
    const channel = supabase
      .channel('public_chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${PUBLIC_CHAT_ID}`
      }, async (payload) => {
        // Load the complete message with user data
        const { data: newMessage } = await supabase
          .from('messages')
          .select(`
            *,
            user:profiles(
              id,
              full_name,
              avatar_url,
              email,
              user_metadata
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (newMessage) {
          setMessages(currentMessages => [...currentMessages, newMessage]);
          // Use a slightly longer timeout to ensure the message is rendered before scrolling
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      keyboardDidShowListener.remove();
    };
  }, []);

  const setupAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error setting up audio mode:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:profiles(
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('chat_id', PUBLIC_CHAT_ID)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        Alert.alert('Error', 'Failed to load messages. Pull down to retry.');
        return;
      }
      
      setMessages(messages || []);
      
      // Scroll to bottom after loading messages with a slight delay to ensure rendering
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSendMessage = async (type: 'text' | 'audio' | 'image' | 'file' = 'text', url?: string) => {
    if (type === 'text' && !messageInput.trim()) return;

    try {
      // Create optimistic message with proper typing
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        chat_id: PUBLIC_CHAT_ID,
        user_id: currentUser?.id || '',
        message: type === 'text' ? messageInput.trim() : '',
        message_type: type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_edited: false,
        status: 'sending',
        user: {
          id: currentUser?.id || '',
          email: currentUser?.email || '',
          full_name: currentUser?.user_metadata?.name || '',
          avatar_url: currentUser?.user_metadata?.avatar_url,
          user_metadata: {
            full_name: currentUser?.user_metadata?.name || '',
            avatar_url: currentUser?.user_metadata?.avatar_url
          }
        }
      };

      if (type === 'audio') {
        optimisticMessage.audio_url = url;
        optimisticMessage.message = 'Audio message';
      } else if (type === 'image' || type === 'file') {
        optimisticMessage.attachment_url = url;
        optimisticMessage.attachment_type = type;
        optimisticMessage.message = type === 'image' ? 'Image' : 'File attachment';
      }

      // Add optimistic message immediately
      setMessages(currentMessages => [...currentMessages, optimisticMessage]);
      
      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      const messageData = {
        chat_id: PUBLIC_CHAT_ID,
        user_id: currentUser?.id,
        message: type === 'text' ? messageInput.trim() : '',
        message_type: type,
        audio_url: type === 'audio' ? url : undefined,
        attachment_url: (type === 'image' || type === 'file') ? url : undefined,
        attachment_type: (type === 'image' || type === 'file') ? type : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      if (type === 'text') {
        setMessageInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      // Remove optimistic message on error
      setMessages(currentMessages => 
        currentMessages.filter(msg => !msg.id.startsWith('temp-'))
      );
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to record audio');
        return;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      if (uri) {
        try {
          // Upload audio file
          const fileName = `audio_${Date.now()}.m4a`;
          
          // Try to read the file directly using FileSystem instead of fetch
          const fileInfo = await FileSystem.getInfoAsync(uri);
          
          if (!fileInfo.exists) {
            throw new Error("Recorded audio file not found");
          }
          
          // Read file using FileSystem
          const fileContent = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          // Upload using base64 decode method (more reliable than blob)
          const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(fileName, decode(fileContent), {
              contentType: 'audio/m4a'
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(fileName);

          await handleSendMessage('audio', publicUrl);
        } catch (uploadError) {
          console.error('Error uploading audio:', uploadError);
          Alert.alert(
            'Audio Upload Failed',
            'The recording was successful, but we couldn\'t upload it. Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
      setIsRecording(false);
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch {
          // Ignore errors when trying to stop already failed recording
        }
        setRecording(null);
      }
    }
  };

  const cancelRecording = async () => {
    try {
      if (!recording) return;
      
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setIsRecording(false);
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      
      // No upload or message sending happens here
    } catch (error) {
      console.error('Error canceling recording:', error);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setIsImageEditorVisible(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true // This ensures the file is accessible
      });
      
      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const fileName = `file_${Date.now()}_${file.name}`;
        
        // Read file as base64
        const fileContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64
        });

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, decode(fileContent), {
            contentType: file.mimeType || 'application/octet-stream'
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);

        await handleSendMessage('file', publicUrl);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    const start = messageInput.substring(0, cursorPosition);
    const end = messageInput.substring(cursorPosition);
    const newText = start + emoji.emoji + end;
    setMessageInput(newText);
    setCursorPosition(cursorPosition + emoji.emoji.length);
  };

  const playAudio = async (messageId: string, audioUrl?: string) => {
    if (!audioUrl) return;
    
    try {
      // Stop currently playing audio if any
      if (playingMessageId && playingAudio[playingMessageId]) {
        await playingAudio[playingMessageId]?.stopAsync();
      }

      // If clicking on currently playing audio, stop it
      if (playingMessageId === messageId) {
        setPlayingMessageId(null);
        return;
      }

      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: audioUrl });
      await sound.playAsync();
      
      setPlayingAudio({ ...playingAudio, [messageId]: sound });
      setPlayingMessageId(messageId);

      // Handle audio completion
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingMessageId(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio message');
    }
  };

  const renderMessage = ({ item: message }: { item: ChatMessage }) => {
    const isOwnMessage = message.user_id === currentUser?.id;
    const messageTime = format(new Date(message.created_at), 'HH:mm');
    
    // Custom avatar display
    const renderAvatar = () => {
      if (message.user.avatar_url) {
        return (
          <Avatar.Image
            size={32}
            source={{ uri: message.user.avatar_url }}
            style={styles.messageAvatar}
          />
        );
      } else {
        return (
          <Avatar.Text
            size={32}
            label={message.user.full_name.substring(0, 2).toUpperCase()}
            style={styles.messageAvatar}
            color="#fff"
            labelStyle={{ fontSize: 14 }}
          />
        );
      }
    };

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && renderAvatar()}
        
        <View style={[
          styles.messageContent,
          isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent
        ]}>
          {!isOwnMessage && (
            <Text style={styles.messageSender}>{message.user.full_name}</Text>
          )}
          
          {message.message_type === 'text' && (
            <Text style={styles.messageText}>{message.message}</Text>
          )}

          {message.message_type === 'audio' && (
            <TouchableOpacity
              onPress={() => playAudio(message.id, message.audio_url)}
              style={styles.audioContainer}
            >
              <MaterialCommunityIcons
                name={playingMessageId === message.id ? 'pause' : 'play'}
                size={24}
                color="#fff"
              />
              <View style={styles.audioWaveform}>
                <View style={styles.audioProgress}>
                  <View style={[
                    styles.audioProgressBar,
                    playingMessageId === message.id ? styles.audioProgressActive : null
                  ]} />
                </View>
              </View>
              <Text style={styles.audioTime}>0:15</Text>
            </TouchableOpacity>
          )}

          {message.message_type === 'image' && (
            <TouchableOpacity
              onPress={() => {
                if (message.attachment_url) {
                  Linking.openURL(message.attachment_url);
                }
              }}
            >
              <Image
                source={{ uri: message.attachment_url }}
                style={styles.imageAttachment}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {message.message_type === 'file' && (
            <TouchableOpacity
              onPress={() => Linking.openURL(message.attachment_url || '')}
              style={styles.fileAttachment}
            >
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#fff" />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>Document</Text>
                <Text style={styles.fileDesc}>Tap to open</Text>
              </View>
            </TouchableOpacity>
          )}

          <Text style={styles.messageTime}>
            {messageTime}
            {isOwnMessage && (
              <MaterialCommunityIcons
                name="check-all"
                size={14}
                color="#64748b"
                style={{ marginLeft: 4 }}
              />
            )}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <AppLayout>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
          />
          <Text variant="titleLarge" style={styles.title}>Public Chat</Text>
          <IconButton
            icon="video"
            size={24}
            onPress={() => {
              Alert.alert('Coming Soon', 'Video call feature is coming soon!');
            }}
          />
        </View>

        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyList
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadMessages();
                }}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
                progressBackgroundColor="#1e293b"
              />
            }
            onContentSizeChange={() => {
              if (messages.length > 0 && !refreshing) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            onLayout={() => {
              if (messages.length > 0 && !refreshing) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyStateContainer}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#3b82f6" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="chat-outline" size={64} color="rgba(255, 255, 255, 0.2)" />
                    <Text style={styles.emptyStateText}>No messages yet. Start the conversation!</Text>
                  </>
                )}
              </View>
            )}
          />
        </View>

        <View style={styles.inputContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 160 : 70}
          >
            <View style={styles.inputRow}>
              {!isRecording ? (
                // Regular input row when not recording
                <>
                  <IconButton
                    icon="paperclip"
                    size={24}
                    onPress={() => setShowAttachmentMenu(true)}
                    style={styles.inputIcon}
                  />
                  <View style={styles.textInputContainer}>
                    <IconButton
                      icon="emoticon-outline"
                      size={24}
                      onPress={() => setIsEmojiPickerVisible(true)}
                      style={styles.emojiIcon}
                    />
                    <TextInput
                      ref={inputRef}
                      value={messageInput}
                      onChangeText={setMessageInput}
                      placeholder="Type a message..."
                      style={styles.input}
                      multiline
                      mode="flat"
                      underlineColor="transparent"
                      onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
                    />
                    <IconButton
                      icon="camera"
                      size={22}
                      onPress={handleImagePick}
                      style={styles.cameraIcon}
                    />
                  </View>
                  <View style={styles.sendButtonContainer}>
                    {messageInput.trim() ? (
                      <IconButton
                        icon="send"
                        size={24}
                        onPress={() => handleSendMessage()}
                        style={styles.sendButton}
                        iconColor="#fff"
                      />
                    ) : (
                      <IconButton
                        icon="microphone"
                        size={24}
                        onPress={startRecording}
                        style={styles.micButton}
                        iconColor="#fff"
                      />
                    )}
                  </View>
                </>
              ) : (
                // Recording controls when recording is active
                <View style={styles.recordingContainer}>
                  <MaterialCommunityIcons name="microphone" size={24} color="#fff" style={styles.recordingIcon} />
                  <Text style={styles.recordingText}>
                    Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </Text>
                  <View style={styles.recordingControls}>
                    <TouchableOpacity
                      onPress={cancelRecording}
                      style={styles.cancelButton}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={stopRecording}
                      style={styles.stopButton}
                    >
                      <Text style={styles.stopButtonText}>Send</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>

        <Portal>
          <Menu
            visible={showAttachmentMenu}
            onDismiss={() => setShowAttachmentMenu(false)}
            anchor={{ x: Dimensions.get('window').width - 20, y: Dimensions.get('window').height - 80 }}
          >
            <Menu.Item
              onPress={() => {
                setShowAttachmentMenu(false);
                handleImagePick();
              }}
              title="Image"
              leadingIcon="image"
            />
            <Menu.Item
              onPress={() => {
                setShowAttachmentMenu(false);
                handleFilePick();
              }}
              title="File"
              leadingIcon="file"
            />
          </Menu>
        </Portal>

        {isEmojiPickerVisible && (
          <EmojiPicker
            onEmojiSelected={handleEmojiSelect}
            open={isEmojiPickerVisible}
            onClose={() => setIsEmojiPickerVisible(false)}
          />
        )}

        {isImageEditorVisible && selectedImage && (
          <ImageEditor
            visible={isImageEditorVisible}
            imageUri={selectedImage}
            onClose={() => {
              setIsImageEditorVisible(false);
              setSelectedImage(null);
            }}
            onSave={async (editedUri) => {
              setIsImageEditorVisible(false);
              setSelectedImage(null);

              try {
                // For local file URIs, we need to read the file first
                const fileContent = await FileSystem.readAsStringAsync(editedUri, {
                  encoding: FileSystem.EncodingType.Base64
                });

              const fileName = `image_${Date.now()}.jpg`;
              const { error: uploadError, data } = await supabase.storage
                .from('chat-attachments')
                  .upload(fileName, decode(fileContent), {
                  contentType: 'image/jpeg'
                });

              if (uploadError) {
                console.error('Error uploading image:', uploadError);
                Alert.alert('Error', 'Failed to upload image');
                return;
              }

              const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(fileName);

              await handleSendMessage('image', publicUrl);
              } catch (error) {
                console.error('Error saving image:', error);
                Alert.alert('Error', 'Failed to save image');
              }
            }}
          />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  title: {
    color: '#fff',
  },
  chatContainer: {
    flex: 1,
    paddingBottom: 150, // Increased space for both input container and navbar
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.6)',
  },
  messageContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 10,
    borderWidth: 0.5,
    minWidth: 80,
  },
  ownMessageContent: {
    backgroundColor: '#1d4ed8',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  otherMessageContent: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageSender: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 2,
  },
  inputContainer: {
    padding: 8,
    backgroundColor: '#0f172a',
    position: 'absolute',
    bottom: 70, // Position above the navbar
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    marginHorizontal: 4,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    maxHeight: 100,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#fff',
    borderWidth: 0,
  },
  inputIcon: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  emojiIcon: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  cameraIcon: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  sendButtonContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    margin: 0,
    backgroundColor: '#1d4ed8',
    borderRadius: 24,
    width: 44,
    height: 44,
  },
  micButton: {
    margin: 0,
    backgroundColor: '#1d4ed8',
    borderRadius: 24,
    width: 44,
    height: 44,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 56,
    marginHorizontal: 8,
  },
  recordingIcon: {
    color: '#ef4444',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  audioWaveform: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  audioProgress: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  audioProgressBar: {
    width: '50%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  audioProgressActive: {
    backgroundColor: '#ef4444',
  },
  audioTime: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
  },
  imageAttachment: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginVertical: 4,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  fileInfo: {
    marginLeft: 8,
  },
  fileName: {
    color: '#fff',
    fontSize: 14,
  },
  fileDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});