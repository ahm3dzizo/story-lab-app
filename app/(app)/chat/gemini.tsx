import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLayout } from '@/components/layout/AppLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeminiService } from '@/lib/services/gemini';
import { useTheme, IconButton } from 'react-native-paper';

// Message interface
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function GeminiChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const geminiService = GeminiService.getInstance();
  const theme = useTheme();
  
  // Set up the chat on component mount
  useEffect(() => {
    // Load saved API key if available
    const loadApiKey = async () => {
      try {
        const savedApiKey = await AsyncStorage.getItem('gemini_api_key');
        if (savedApiKey) {
          geminiService.setApiKey(savedApiKey);
        }
      } catch (error) {
        console.error('Error loading API key:', error);
      }
    };

    loadApiKey();
    
    // Add welcome message
    setMessages([
      {
        id: 'welcome',
        text: 'Hello! I\'m Gemini AI. How can I help you today?',
        isUser: false,
        timestamp: new Date()
      }
    ]);
  }, []);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Make sure flatlist scrolls to the end
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Call Gemini API
      const response = await geminiService.generateContent(userMessage.text);
      
      if (response) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
          text: response,
        isUser: false,
          timestamp: new Date()
      };

        setMessages(prevMessages => [...prevMessages, aiMessage]);
      
        // Scroll to the new message
      setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error: any) {
      // Handle error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, there was an error: ${error.message || 'Unknown error'}`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear the conversation
  const handleClearConversation = () => {
    setMessages([
      {
        id: 'welcome',
        text: 'Hello! I\'m Gemini AI. How can I help you today?',
        isUser: false,
        timestamp: new Date()
      }
    ]);
  };

  // Render a chat message
  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.aiBubble
      ]}
    >
      <Text style={[styles.messageText, item.isUser ? styles.userText : styles.aiText]}>
        {item.text}
              </Text>
            </View>
  );

  return (
    <AppLayout>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: '#0f172a' }]}>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>Gemini AI</Text>
          <TouchableOpacity onPress={handleClearConversation} style={styles.clearButton}>
            <MaterialCommunityIcons name="restart" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input container styled like public chat */}
        <View style={styles.inputContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 160 : 70}
          >
            <View style={styles.inputRow}>
              <View style={styles.textInputContainer}>
                <IconButton
                  icon="emoticon-outline"
                  size={24}
                  iconColor="#fff"
                  style={styles.emojiIcon}
                  onPress={() => {}}
                />
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type a message..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  style={styles.input}
                  multiline
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
                />
              </View>
              
              <View style={styles.sendButtonContainer}>
                <IconButton
                  icon={isLoading ? "loading" : "send"}
                  iconColor="#fff"
                  size={24}
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.disabledButton,
                  ]}
                  disabled={!inputText.trim() || isLoading}
                  onPress={handleSendMessage}
                />
                    </View>
                  </View>
          </KeyboardAvoidingView>
                    </View>
      </SafeAreaView>
    </AppLayout>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
  },
  messageList: {
    padding: 16,
    paddingBottom: 120, // Increased to provide space for input above navbar
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4371E2', // Updated color to match chat
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b', // Dark theme color to match public chat
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#ffffff', // Updated to white for dark theme
  },
  inputContainer: {
    padding: 8,
    backgroundColor: '#0f172a', // Dark blue background like public chat
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
    backgroundColor: '#1e293b', // Lighter blue background for input
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
  emojiIcon: {
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
    backgroundColor: '#1d4ed8', // Blue send button
    borderRadius: 24,
    width: 44,
    height: 44,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle disabled state
    opacity: 0.7,
  },
}); 