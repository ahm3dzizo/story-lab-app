import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';

interface ApiKeyInputModalProps {
  visible: boolean;
  initialValue: string;
  onClose: () => void;
  onSubmit: (apiKey: string) => void;
}

export const ApiKeyInputModal = ({
  visible,
  initialValue,
  onClose,
  onSubmit,
}: ApiKeyInputModalProps) => {
  const [apiKey, setApiKey] = useState(initialValue);

  const handleSubmit = () => {
    onSubmit(apiKey);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Pressable style={styles.modalView} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Gemini API Key</Text>
            <Text style={styles.description}>
              Please enter your Gemini API key to use the AI chat feature. 
              You can get one from Google AI Studio.
            </Text>
            
            <TextInput
              label="API Key"
              value={apiKey}
              onChangeText={setApiKey}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              secureTextEntry={true}
            />
            
            <View style={styles.buttonContainer}>
              <Button 
                mode="outlined" 
                onPress={onClose} 
                style={styles.button}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSubmit} 
                style={styles.button}
                disabled={!apiKey.trim()}
              >
                Save
              </Button>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    width: '100%',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
}); 