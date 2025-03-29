import React from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Button, useTheme, TextInput, Surface, IconButton, Avatar, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';

const EditProfileScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatar, setAvatar] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const userId = session?.user?.id;
      const userEmail = session?.user?.email;
      
      if (!userId || !userEmail) {
        throw new Error('No user ID or email found in session');
      }

      // Fetch user profile from the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile data:', profileError);
      }

      if (profileData) {
        console.log('Profile data loaded:', profileData);
        const [first = '', last = ''] = (profileData.full_name || '').split(' ');
        setFirstName(first);
        setLastName(last);
        setEmail(profileData.email);
        
        // Handle avatar URL formatting
        if (profileData.avatar_url) {
          // If it's already a full URL, use it directly
          if (profileData.avatar_url.startsWith('http')) {
            setAvatar(profileData.avatar_url);
          } else {
            // If it's just a path, convert it to a full URL
            const { data: { publicUrl } } = supabase.storage
              .from('profile-pictures')
              .getPublicUrl(profileData.avatar_url);
            setAvatar(publicUrl);
          }
        } else {
          setAvatar('');
        }
        
        setDepartment(profileData.department || '');
        setLocation(profileData.location || '');
        setBio(profileData.bio || '');
        setPhone(profileData.phone || '');
        return;
      }

      // Fallback: If no profile found, try to get data from users table
      console.log('No profile found, checking users table as fallback');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user data:', userError);
      } else if (userData) {
        const [first = '', last = ''] = (userData.username || '').split(' ');
        setFirstName(first);
        setLastName(last);
        setEmail(userData.email);
        
        // Handle avatar URL from users table
        if (userData.avatar_url) {
          // Try both buckets for backward compatibility
          if (userData.avatar_url.startsWith('http')) {
            setAvatar(userData.avatar_url);
          } else {
            // Try profile-pictures first, then avatars as fallback
            try {
              const { data: { publicUrl: profilePicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(userData.avatar_url);
                
              // Check if we can access this URL
              const response = await fetch(profilePicUrl, { method: 'HEAD' });
              if (response.ok) {
                setAvatar(profilePicUrl);
              } else {
                // Try avatars bucket as fallback
                const { data: { publicUrl: avatarsUrl } } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(userData.avatar_url);
                setAvatar(avatarsUrl);
              }
            } catch (error) {
              console.warn('Error checking avatar URL, using avatars bucket:', error);
              const { data: { publicUrl: avatarsUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(userData.avatar_url);
              setAvatar(avatarsUrl);
            }
          }
        } else {
          setAvatar('');
        }
        
        setDepartment(userData.department || '');
        setLocation(userData.location || '');
        setBio(userData.bio || '');
        setPhone(userData.phone || '');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      gap: 16,
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: 14,
      opacity: 0.7,
      marginTop: 4,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarWrapper: {
      position: 'relative',
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      padding: 8,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
    },
    field: {
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  // Function to ensure the profile-pictures bucket exists
  const ensureProfilePicturesBucket = async () => {
    try {
      // Check if bucket exists by attempting to get bucket details
      const { data, error } = await supabase.storage.getBucket('profile-pictures');
      
      // Check if the error is a "not found" error (bucket doesn't exist)
      if (error && (error.message?.includes('not found') || error.message?.includes('does not exist'))) {
        console.log('profile-pictures bucket does not exist, creating it...');
        
        // Create the bucket if it doesn't exist
        const { data: bucketData, error: createError } = await supabase.storage.createBucket(
          'profile-pictures',
          {
            public: true, // Make images publicly accessible
            fileSizeLimit: 5 * 1024 * 1024, // 5MB limit per file
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          }
        );
        
        if (createError) {
          console.error('Failed to create profile-pictures bucket:', createError);
          throw new Error(`Failed to create bucket: ${createError.message}`);
        }
        
        console.log('profile-pictures bucket created successfully');
      } else if (error) {
        console.error('Error checking for profile-pictures bucket:', error);
      } else {
        console.log('profile-pictures bucket already exists');
      }
    } catch (error) {
      console.error('Error in ensureProfilePicturesBucket:', error);
      // Don't throw here - we'll try to upload anyway and handle errors there
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6, // Reducing quality further to ensure smaller file size
        base64: true, // Request base64 data
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Image selected, preparing for upload...');
        
        // Ensure the target bucket exists
        await ensureProfilePicturesBucket();
        
        // Create simplified filename using just user ID
        const userId = session?.user?.id;
        const timestamp = new Date().getTime();
        const fileExt = 'jpg'; // Force jpg extension for consistency
        const filePath = `${userId}_avatar_${timestamp}.${fileExt}`;
        
        console.log(`Preparing to upload to profile-pictures/${filePath}`);
        
        let uploadError = null;
        let uploadData = null;
        
        // First try to upload using base64 if available
        if (asset.base64) {
          console.log(`Image has base64 data (length: ${asset.base64.length}), trying base64 upload...`);
        
        // Create the full data URL format that Supabase needs
          const fileData = `data:image/jpeg;base64,${asset.base64}`;
        
        // Upload using the uploadBase64 helper function
          const result = await uploadBase64Image(filePath, fileData);
          uploadData = result.data;
          uploadError = result.error;
          
          if (!uploadError) {
            console.log('Base64 upload succeeded!');
          } else {
            console.log('Base64 upload failed, will try URI upload method...');
          }
        } else {
          console.log('No base64 data available, will try URI upload method...');
        }
        
        // If base64 upload failed or wasn't available, try using URI method
        if (!uploadData && asset.uri) {
          try {
            console.log('Trying direct URI upload method...');
            
            // Fetch the image as a blob
            const response = await fetch(asset.uri);
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            console.log(`Image fetched as blob (size: ${blob.size} bytes), uploading...`);
            
            // Upload the blob
            const { data, error } = await supabase.storage
              .from('profile-pictures')
              .upload(filePath, blob, {
                contentType: 'image/jpeg',
                upsert: true,
              });
              
            uploadData = data;
            uploadError = error;
            
            if (error) {
              console.error('URI upload method failed:', error);
            } else {
              console.log('URI upload method succeeded!');
            }
          } catch (blobError) {
            console.error('Error in URI upload method:', blobError);
            uploadError = blobError instanceof Error ? blobError : new Error('Unknown blob error');
          }
        }

        // Check if either upload method succeeded
        if (uploadError) {
          console.error('All upload methods failed, last error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message || 'Unknown error'}`);
        }

        console.log('Upload successful, getting public URL...');

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath);
          
        console.log('Public URL obtained:', publicUrl);

        // Update avatar URL in state
        setAvatar(publicUrl);
        
        // Update avatar in profile
        await updateProfileAvatar(publicUrl);
        
        Alert.alert('Success', 'Profile picture uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // More detailed error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred during upload';
        
      Alert.alert(
        'Upload Failed', 
        `Unable to upload profile picture: ${errorMessage}. Please try again later.`
      );
    }
  };

  // Helper function to upload base64 encoded image
  const uploadBase64Image = async (filePath: string, base64Data: string) => {
    try {
      console.log(`Starting base64 upload for ${filePath}...`);
      
      // Ensure base64Data starts with the correct data URL prefix
      let formattedData = base64Data;
      if (!base64Data.startsWith('data:')) {
        console.log('Adding data URL prefix to base64 data...');
        formattedData = `data:image/jpeg;base64,${base64Data}`;
      }
      
      // Log the first 50 characters to help with debugging
      console.log(`Base64 data starts with: ${formattedData.substring(0, 50)}...`);
      
      // Upload directly using the decode method which handles base64
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, formattedData, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      
      if (error) {
        console.error('Error in base64 upload:', error);
        console.error('Error details:', JSON.stringify(error));
      } else {
        console.log('Base64 upload successful:', data);
      }
      
      return { data, error };
    } catch (uploadError) {
      console.error('Exception during base64 upload:', uploadError);
      if (uploadError instanceof Error) {
        console.error('Error message:', uploadError.message);
        console.error('Error stack:', uploadError.stack);
      }
      return { 
        data: null, 
        error: uploadError instanceof Error ? uploadError : new Error('Unknown upload error') 
      };
    }
  };
  
  // Helper function to update profile with new avatar URL
  const updateProfileAvatar = async (avatarUrl: string) => {
    try {
      const userId = session?.user?.id;
      if (!userId) return;
      
      console.log('Updating profile with new avatar URL...');
      
      // Update only the avatar_url field in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
        
      if (profileError) {
        console.error('Error updating profile avatar:', profileError);
      } else {
        console.log('Profile avatar updated successfully');
      }
      
      // Also update avatar_url in users table for backward compatibility
      try {
        const { error: userError } = await supabase
          .from('users')
          .update({ avatar_url: avatarUrl })
          .eq('auth_id', userId);
          
        if (userError) {
          console.warn('Warning: Could not update users table avatar:', userError);
        }
      } catch (error) {
        console.warn('Error updating users table avatar:', error);
      }
    } catch (error) {
      console.error('Error in updateProfileAvatar:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const userId = session?.user?.id;
      const userEmail = session?.user?.email;
      
      if (!userId || !userEmail) {
        throw new Error('No user ID or email found in session');
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      // Update profile in the profiles table with only fields that exist in the schema
      // Note: bio field is excluded as it doesn't exist in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email.trim(),
          full_name: fullName,
          department,
          location,
          phone,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Store bio field in the users table, where it might exist
      try {
        const { error: userError } = await supabase
          .from('users')
          .update({
            username: fullName,
            email: email.trim(),
            department,
            location,
            bio, // Keep bio in the users table update
            phone,
          })
          .eq('auth_id', userId);

        if (userError) {
          console.warn('Warning: Could not update users table:', userError);
        }
      } catch (userUpdateError) {
        console.warn('Warning: Error updating users table:', userUpdateError);
      }

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Update your personal information</Text>
          </View>
        </View>

        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Avatar.Image 
              size={120} 
              source={avatar ? { uri: avatar } : require('@/assets/images/defaultavatar.png')} 
            />
            <IconButton
              icon="camera"
              size={20}
              iconColor="white"
              style={styles.editAvatarButton}
              onPress={handlePickImage}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="account-details" size={24} color={theme.colors.primary} />
            Personal Information
          </Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <TextInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                error={!!errors.firstName}
              />
              <HelperText type="error" visible={!!errors.firstName}>
                {errors.firstName}
              </HelperText>
            </View>
            <View style={styles.field}>
              <TextInput
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                error={!!errors.lastName}
              />
              <HelperText type="error" visible={!!errors.lastName}>
                {errors.lastName}
              </HelperText>
            </View>
          </View>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>
          <TextInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={!!errors.phone}
          />
          <HelperText type="error" visible={!!errors.phone}>
            {errors.phone}
          </HelperText>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="office-building" size={24} color={theme.colors.primary} />
            Work Information
          </Text>
          <TextInput
            label="Department"
            value={department}
            onChangeText={setDepartment}
            error={!!errors.department}
          />
          <HelperText type="error" visible={!!errors.department}>
            {errors.department}
          </HelperText>
          <TextInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            error={!!errors.location}
          />
          <HelperText type="error" visible={!!errors.location}>
            {errors.location}
          </HelperText>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="text-box" size={24} color={theme.colors.primary} />
            Bio
          </Text>
          <TextInput
            label="Professional Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => {/* Navigate back */}}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={{ flex: 1 }}
          >
            Save Changes
          </Button>
        </View>
      </Surface>
    </ScrollView>
  );
};

export default EditProfileScreen; 