import React, { useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Button, Portal, Dialog, useTheme, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/auth/AuthContext';
import { ProfileAvatar } from './ProfileAvatar';

interface AvatarUploadProps {
  size?: number;
  showEditButton?: boolean;
  onUploadComplete?: (url: string) => void;
}

export function AvatarUpload({ size = 64, showEditButton = true, onUploadComplete }: AvatarUploadProps) {
  const theme = useTheme();
  const { user, updatePreferences } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const pickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access media library was denied');
        setShowDialog(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to pick image');
      setShowDialog(true);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      setError(null);

      // Get the file extension and ensure it's an image type
      const ext = uri.substring(uri.lastIndexOf('.') + 1).toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        throw new Error('Please select a valid image file (JPG, PNG, or GIF)');
      }

      // Create file name with timestamp to avoid conflicts
      const fileName = `${user?.id}/${Date.now()}.${ext}`;

      // Convert uri to blob with proper type
      try {
        const response = await fetch(uri);
        if (!response.ok) throw new Error('Failed to fetch image data');
        
        const blob = await response.blob();
        if (!blob) throw new Error('Failed to create blob from image');

        // Validate file size (max 1MB)
        if (blob.size > 1024 * 1024) {
          throw new Error('Image size must be less than 1MB');
        }

        // Ensure proper content type
        const contentType = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif'
        }[ext] || 'image/jpeg';

        // Create a new blob with proper type
        const imageBlob = new Blob([blob], { type: contentType });

        // Try upload with retry logic
        let uploadAttempts = 0;
        const maxAttempts = 3;
        let uploadError;

        while (uploadAttempts < maxAttempts) {
          try {
            const { data, error: uploadErr } = await supabase.storage
              .from('avatars')
              .upload(fileName, imageBlob, {
                upsert: true,
                contentType,
                cacheControl: '3600',
              });

            if (uploadErr) {
              if (uploadErr.message.includes('row-level security')) {
                throw new Error('Permission denied. Please check if you are logged in.');
              }
              throw uploadErr;
            }

            if (!data) throw new Error('Upload successful but no data returned');

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);

            // Delete old avatar if exists
            if (user?.avatarUrl) {
              try {
                const oldFileName = user.avatarUrl.split('/').pop();
                if (oldFileName) {
                  await supabase.storage
                    .from('avatars')
                    .remove([`${user.id}/${oldFileName}`]);
                }
              } catch (error) {
                console.warn('Failed to delete old avatar:', error);
                // Don't throw error here as the upload was successful
              }
            }

            // Update user preferences with new avatar URL
            await updatePreferences({ avatar_url: publicUrl });

            // Call the callback if provided
            if (onUploadComplete) {
              onUploadComplete(publicUrl);
            }

            // Upload successful, break the retry loop
            return;

          } catch (error) {
            uploadError = error;
            uploadAttempts++;
            
            // If this isn't the last attempt, wait before retrying
            if (uploadAttempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
            }
          }
        }

        // If we get here, all upload attempts failed
        throw uploadError || new Error('Failed to upload after multiple attempts');

      } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Failed to process image. Please try again with a different image.');
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      let errorMessage = 'Failed to upload image';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowDialog(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProfileAvatar
        imageUrl={user?.avatarUrl}
        name={user?.fullName}
        size={size}
      />
      
      {showEditButton && (
        <Button
          mode="contained-tonal"
          onPress={pickImage}
          loading={uploading}
          disabled={uploading}
          style={styles.editButton}
        >
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </Button>
      )}

      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Text>{error}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  editButton: {
    marginTop: 8,
  },
}); 