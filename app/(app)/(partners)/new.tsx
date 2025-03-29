import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, useWindowDimensions, Platform } from 'react-native';
import { Button, Card, Text, ProgressBar, useTheme, IconButton, Surface, Chip } from 'react-native-paper';
import { FormField } from '@/app/features/shared/components/forms/FormField';
import { SelectField } from '@/app/features/shared/components/forms/SelectField';
import * as ImagePicker from 'expo-image-picker';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Partner, PartnerInsert } from '@/types/partner.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { AppLayout } from '@/components/layout/AppLayout';

interface PartnerRegistrationFormProps {
  onSubmit: (data: PartnerInsert) => Promise<void>;
  mode?: 'create' | 'edit';
  onClose?: () => void;
}

type PartnerStatus = 'active' | 'inactive' | 'pending';

interface FormData {
  fullName: string;
  email: string;
  sharesPercentage: string;
  phoneNumber: string;
  specialization: string;
  profilePicture?: string;
  status: PartnerStatus;
}

interface FormErrors {
  [key: string]: string;
}

const specializations = [
  { label: 'Business Development', value: 'business_development', icon: 'chart-line' },
  { label: 'Technology', value: 'technology', icon: 'laptop' },
  { label: 'Marketing', value: 'marketing', icon: 'bullhorn' },
  { label: 'Operations', value: 'operations', icon: 'cogs' },
  { label: 'Legal', value: 'legal', icon: 'gavel' },
  { label: 'Other', value: 'other', icon: 'dots-horizontal' },
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
];

export const PartnerRegistrationForm: React.FC<PartnerRegistrationFormProps> = ({
  onSubmit,
  mode = 'create',
  onClose,
}) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { id } = useLocalSearchParams<{ id: string }>();

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    sharesPercentage: '',
    phoneNumber: '',
    specialization: '',
    profilePicture: undefined,
    status: 'active',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isValidStatus = (status: string): status is PartnerStatus => {
    return ['active', 'inactive', 'pending'].includes(status);
  };

  useEffect(() => {
    if (mode === 'edit' && id) {
      loadPartnerData();
    }
  }, [id]);

  const loadPartnerData = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          fullName: data.full_name,
          email: data.email,
          sharesPercentage: data.shares_percentage?.toString() || '',
          phoneNumber: data.phone_number || '',
          specialization: data.specialization || '',
          profilePicture: data.profile_picture_url,
          status: isValidStatus(data.status) ? data.status : 'active',
        });
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
    }
  };

  const getFormProgress = () => {
    const fields = ['fullName', 'email', 'sharesPercentage', 'specialization'];
    const filledFields = fields.filter(field => !!formData[field as keyof FormData]);
    return filledFields.length / fields.length;
  };

  const validateEmail = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If we found a partner with this email and it's not the current partner
      if (data && (!id || parseInt(id) !== data.id)) {
        setErrors(prev => ({
          ...prev,
          email: 'This email is already registered to another partner'
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking email:', error);
      return true; // Allow submission on error to not block the user
    }
  };

  const validateForm = async () => {
    const newErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    const sharesRegex = /^\d+(\.\d{0,2})?$/;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.sharesPercentage.trim()) {
      newErrors.sharesPercentage = 'Shares percentage is required';
    } else if (!sharesRegex.test(formData.sharesPercentage) || 
               parseFloat(formData.sharesPercentage) < 0 || 
               parseFloat(formData.sharesPercentage) > 100) {
      newErrors.sharesPercentage = 'Please enter a valid percentage (0-100)';
    }

    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.specialization) {
      newErrors.specialization = 'Specialization is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Only check email uniqueness if there are no other errors
      const isEmailValid = await validateEmail(formData.email);
      return isEmailValid;
    }

    return false;
  };

  const uploadProfilePicture = async (uri: string): Promise<string | undefined> => {
    try {
      console.log('Starting upload with URI:', uri);
      
      // Handle file:// URIs for React Native
      let imageUri = uri;
      if (Platform.OS === 'ios' && uri.startsWith('file://')) {
        imageUri = uri.replace('file://', '');
      }

      // For Android, we need to handle content:// URIs
      if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        imageUri = fileInfo.uri;
      }

      console.log('Processed URI:', imageUri);

      // First try to read the file using FileSystem
      try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        console.log('File info:', fileInfo);
        
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }

        // Read the file as base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64
        });

        // Convert base64 to blob
        const response = await fetch(`data:image/jpeg;base64,${base64}`);
        const blob = await response.blob();

        console.log('Successfully created blob:', {
          size: blob.size,
          type: blob.type
        });

        if (blob.size > 5 * 1024 * 1024) {
          throw new Error('Image size must be less than 5MB');
        }

        const fileName = `${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
        const filePath = `${fileName}`;

        console.log('Uploading to Supabase:', { fileName, filePath });

        // Use supabaseAdmin for storage operations
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('profile-pictures')
          .upload(filePath, blob, {
            contentType: blob.type,
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log('Upload successful:', uploadData);

        // Get the public URL
        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('profile-pictures')
          .getPublicUrl(filePath);

        console.log('Generated public URL:', publicUrl);
        return publicUrl;

      } catch (fileError: any) {
        console.error('Error handling file:', fileError);
        throw new Error(`File handling failed: ${fileError.message || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      if (error instanceof Error) {
        throw new Error(`Upload failed: ${error.message}`);
      }
      throw new Error('Upload failed: Unknown error occurred');
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      const isValid = await validateForm();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      let profilePictureUrl = formData.profilePicture;
      
      // Upload new profile picture if it's a local file
      if (formData.profilePicture && formData.profilePicture.startsWith('file://')) {
        profilePictureUrl = await uploadProfilePicture(formData.profilePicture);
        if (!profilePictureUrl) {
          throw new Error('Failed to upload profile picture');
        }
        setUploadProgress(0.5);
      }

      // Check total shares percentage
      const { data: existingPartners, error: sharesError } = await supabase
        .from('partners')
        .select('shares_percentage, id')
        .eq('status', 'active');

      if (sharesError) {
        console.error('Error fetching existing partners:', sharesError);
        throw sharesError;
      }

      const currentShares = existingPartners?.reduce(
        (sum: number, partner: { shares_percentage: number; id: number }) => {
          if (id && parseInt(id) === partner.id) {
            return sum;
          }
          return sum + (partner.shares_percentage || 0);
        },
        0
      ) || 0;

      const newShares = Number(formData.sharesPercentage);
      if (isNaN(newShares)) {
        throw new Error('Invalid shares percentage value');
      }

      const totalShares = currentShares + newShares;

      if (totalShares > 100) {
        const availableShares = 100 - currentShares + (id ? existingPartners.find(p => p.id === parseInt(id))?.shares_percentage || 0 : 0);
        setErrors(prev => ({
          ...prev,
          sharesPercentage: `Total shares would exceed 100%. Available: ${availableShares}%`
        }));
        throw new Error(`Total shares would exceed 100%. Available: ${availableShares}%`);
      }

      // Create user first using Supabase Auth
      const tempPassword = Math.random().toString(36).slice(-8);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: tempPassword,
        options: {
          data: {
            role: 'partner',
            full_name: formData.fullName.trim()
          }
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error('Failed to create user account');
      }

      if (!authData.user) {
        throw new Error('No user data returned from auth signup');
      }

      // First ensure the user exists in the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: formData.email.trim().toLowerCase(),
          role: 'partner',
          is_active: true
        })
        .select()
        .single();

      if (userError) {
        console.error('Error ensuring user exists:', userError);
        throw new Error('Failed to create user account');
      }

      const partnerData: PartnerInsert = {
        user_id: authData.user.id || null,
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        shares_percentage: newShares,
        phone_number: formData.phoneNumber ? formData.phoneNumber.trim() : undefined,
        specialization: formData.specialization ? formData.specialization.trim() : undefined,
        profile_picture_url: profilePictureUrl || undefined,
        status: formData.status,
        join_date: new Date().toISOString()
      };

      setUploadProgress(0.75);
      
      // Insert partner using the auth user's ID
      const { error } = await supabase
        .from('partners')
        .insert(partnerData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        if (error.code === '22P02') {
          throw new Error('Database schema needs to be updated. Please contact your administrator.');
        }
        throw error;
      }

      // Send email to the user with their temporary password
      Alert.alert(
        'Partner Created',
        `Please inform the partner that they can sign in with their email and temporary password: ${tempPassword}`
      );

      setUploadProgress(1);
      
      // Call onSubmit after successful creation
      await onSubmit(partnerData);

    } catch (error: any) {
      console.error('Error submitting form:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to create partner. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleChange = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        setFormData((prev) => ({ ...prev, profilePicture: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Image Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-circle" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Profile Image</Text>
          </View>
          <View style={styles.imageSection}>
            <Surface style={styles.imageContainer} elevation={2}>
              {formData.profilePicture ? (
                <>
                  <Image
                    source={{ uri: formData.profilePicture }}
                    style={styles.profileImage}
                  />
                  <IconButton
                    icon="pencil"
                    mode="contained"
                    size={20}
                    onPress={handleImagePick}
                    style={styles.editImageButton}
                  />
                </>
              ) : (
                <View style={styles.placeholderContainer}>
                  <MaterialCommunityIcons
                    name="account-circle"
                    size={64}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Button
                    mode="contained"
                    onPress={handleImagePick}
                    style={styles.addImageButton}
                  >
                    Add Photo
                  </Button>
                </View>
              )}
            </Surface>
          </View>
        </Card.Content>
      </Card>

      {/* Basic Information Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="card-account-details" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Basic Information</Text>
          </View>
          <View style={[styles.formFields, isMobile ? styles.formFieldsMobile : {}]}>
            <FormField
              label="Full Name"
              value={formData.fullName}
              onChangeText={handleChange('fullName')}
              error={errors.fullName}
              required
              style={styles.field}
            />
            <FormField
              label="Email"
              value={formData.email}
              onChangeText={handleChange('email')}
              keyboardType="email-address"
              error={errors.email}
              required
              style={styles.field}
            />
            <FormField
              label="Phone Number"
              value={formData.phoneNumber}
              onChangeText={handleChange('phoneNumber')}
              keyboardType="phone-pad"
              style={styles.field}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Partnership Details Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-cash" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Partnership Details</Text>
          </View>
          <View style={[styles.formFields, isMobile ? styles.formFieldsMobile : {}]}>
            <FormField
              label="Shares Percentage"
              value={formData.sharesPercentage}
              onChangeText={handleChange('sharesPercentage')}
              keyboardType="decimal-pad"
              error={errors.sharesPercentage}
              required
              style={styles.field}
            />
            <View style={styles.field}>
              <SelectField
                label="Status"
                value={formData.status}
                onValueChange={handleChange('status')}
                options={statusOptions}
                required
                error={errors.status}
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Specialization Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="briefcase" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Specialization</Text>
          </View>
          <View style={styles.specializationSection}>
            <View style={styles.specializationGrid}>
              {specializations.map((spec) => (
                <Chip
                  key={spec.value}
                  selected={formData.specialization === spec.value}
                  onPress={() => handleChange('specialization')(spec.value)}
                  style={styles.specializationChip}
                  icon={spec.icon}
                  mode="outlined"
                >
                  {spec.label}
                </Chip>
              ))}
            </View>
            {errors.specialization && (
              <Text style={styles.errorText}>{errors.specialization}</Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Progress Bar */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.progressSection}>
            <Text variant="titleMedium" style={styles.progressText}>
              Form Progress
            </Text>
            <ProgressBar
              progress={isSubmitting ? uploadProgress : getFormProgress()}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? 'Saving...' 
            : id 
              ? 'Update Partner' 
              : 'Register Partner'
          }
        </Button>
        {onClose && (
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

export default function NewPartnerScreen() {
  const router = useRouter();

  const handleSubmit = async (data: PartnerInsert) => {
    // No need to insert again since PartnerRegistrationForm already handles it
    router.back();
  };

  return (
    <AppLayout>
      <PartnerRegistrationForm
        onSubmit={handleSubmit}
        onClose={() => router.back()}
        mode="create"
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
    marginBottom: 65,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 16,
  },
  submitButton: {
    flex: 1,
    maxWidth: 160,
  },
  cancelButton: {
    flex: 1,
    maxWidth: 160,
  },
  formCard: {
    margin: 16,
    borderRadius: 16,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressText: {
    marginBottom: 8,
    color: '#666',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    margin: 8,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    marginTop: 16,
  },
  formFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  formFieldsMobile: {
    flexDirection: 'column',
    marginHorizontal: 0,
  },
  field: {
    flex: 1,
    minWidth: 300,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  specializationSection: {
    flex: 1,
    minWidth: '100%',
    marginHorizontal: 8,
    marginBottom: 24,
  },
  specializationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  specializationChip: {
    margin: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  }
}); 