import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme as usePaperTheme, Switch, Divider, List, Avatar, IconButton, Chip, RadioButton, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import type { FontSize } from '@/lib/theme/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { routes } from '@/app/routes';

type UserData = {
  id: number;
  auth_id?: string;
  email: string;
  username: string;
  avatar_url?: string;
  department?: string;
  location?: string;
  phone?: string;
  role?: string;
  created_at: string;
  updated_at: string;
  partners?: Array<{
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
    profile_picture_url?: string;
    specialization?: string;
    user_id?: string;
  }>;
  employees?: Array<{
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
    department: string;
    position: string;
    user_id?: string;
  }>;
};

const FONT_SIZE_KEY = '@font_size_preference';
const COMPACT_MODE_KEY = '@compact_mode_preference';
const REDUCED_MOTION_KEY = '@reduced_motion_preference';
const HIGH_CONTRAST_KEY = '@high_contrast_preference';

const SettingsScreen = () => {
  const paperTheme = usePaperTheme();
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { colorScheme, themePreference, setColorScheme } = useColorScheme();
  const {
    fontSize,
    setFontSize,
    compactMode,
    setCompactMode,
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast,
  } = useTheme();
  
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(true);

  useEffect(() => {
    fetchUserData();
  }, [session]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userEmail = session?.user?.email;
      const userId = session?.user?.id; // This is the UUID from Supabase Auth
      
      console.log('Session details:', { email: userEmail, id: userId });
      
      if (!userEmail && !userId) {
        console.error('No user email or ID found in session');
        setLoading(false);
        return;
      }

      // Direct email lookup for debugging
      if (userEmail) {
        console.log('Performing direct email lookups for debugging...');

        // Check users table
        const { data: usersByEmail, error: userEmailError } = await supabase
        .from('users')
        .select('*')
          .eq('email', userEmail);
          
        console.log('Direct users lookup result:', 
          userEmailError ? `Error: ${userEmailError.message}` : 
          usersByEmail?.length ? `Found ${usersByEmail.length} users` : 'No users found');
        
        if (usersByEmail?.length) {
          console.log('Using directly found user record');
          const userData = usersByEmail[0];
          const enhancedData = await enhanceUserData(userData);
          setUserData(enhancedData);
          setLoading(false);
          return;
        }
        
        // Check partners table
        const { data: partnersByEmail, error: partnerEmailError } = await supabase
          .from('partners')
          .select('*')
          .eq('email', userEmail);
          
        console.log('Direct partners lookup result:', 
          partnerEmailError ? `Error: ${partnerEmailError.message}` : 
          partnersByEmail?.length ? `Found ${partnersByEmail.length} partners` : 'No partners found');
        
        if (partnersByEmail?.length) {
          console.log('Using directly found partner record');
          const partnerData = partnersByEmail[0];
          const syntheticUser = {
            id: partnerData.id,
            email: partnerData.email,
            username: partnerData.email?.split('@')[0] || 'User',
            auth_id: userId,
            partners: [partnerData],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUserData(syntheticUser as UserData);
          setLoading(false);
          return;
        }
        
        // Check employees table
        const { data: employeesByEmail, error: employeeEmailError } = await supabase
          .from('employees')
          .select('*')
          .eq('email', userEmail);
          
        console.log('Direct employees lookup result:', 
          employeeEmailError ? `Error: ${employeeEmailError.message}` : 
          employeesByEmail?.length ? `Found ${employeesByEmail.length} employees` : 'No employees found');
        
        if (employeesByEmail?.length) {
          console.log('Employee details:', JSON.stringify(employeesByEmail[0], null, 2));
        }
      }

      // Directly query each table and see what we find
      console.log('Directly querying all tables to find user...');

      // Prepare email for search
      const emailForSearch = userEmail?.trim() || '';
      const uuidForSearch = userId || '';

      // DEBUG: Log the exact email and UUID values we're searching for
      console.log('Searching with exact values - Email:', emailForSearch, 'UUID:', uuidForSearch);

      // Try all tables in parallel
      const [usersResults, partnersResults, employeesResults] = await Promise.all([
        // Users table queries
        supabase
        .from('users')
        .select('*')
          .or(`email.eq.${emailForSearch},auth_id.eq.${uuidForSearch}`)
          .limit(5),
          
        // Partners table queries
        supabase
          .from('partners')
          .select('*')
          .or(`email.eq.${emailForSearch},user_id.eq.${uuidForSearch}`)
          .limit(5),
          
        // Employees table queries
        supabase
          .from('employees')
          .select('*')
          .or(`email.eq.${emailForSearch},user_id.eq.${uuidForSearch}`)
          .limit(5)
      ]);

      // Check results from all tables
      console.log('Query results:', {
        users: usersResults.data ? `Found ${usersResults.data.length} users` : `Error: ${usersResults.error?.message}`,
        partners: partnersResults.data ? `Found ${partnersResults.data.length} partners` : `Error: ${partnersResults.error?.message}`,
        employees: employeesResults.data ? `Found ${employeesResults.data.length} employees` : `Error: ${employeesResults.error?.message}`
      });
      
      // If we found a user record, enhance it
      if (usersResults.data && usersResults.data.length > 0) {
        const userRecord = usersResults.data[0];
        const enhancedData = await enhanceUserData(userRecord);
          setUserData(enhancedData);
        setLoading(false);
          return;
      }
      
      // STEP 3: Try finding in partners table
      console.log('Looking for user in partners table...');
      
      let partnerRecord = null;
      
      if (partnersResults.data && partnersResults.data.length > 0) {
        partnerRecord = partnersResults.data[0];
      }
      
      if (partnerRecord) {
        // Create synthetic user from partner data
        const partnerName = partnerRecord.full_name || partnerRecord.name || '';
          const syntheticUser = {
          id: partnerRecord.id,
          email: partnerRecord.email,
          username: partnerName.split(' ')[0] || partnerRecord.email?.split('@')[0] || 'User',
            auth_id: userId,
          role: 'Partner',
          created_at: partnerRecord.created_at || new Date().toISOString(),
          updated_at: partnerRecord.updated_at || new Date().toISOString(),
          partners: [partnerRecord]
        };
        
        // Update the partner record with auth_id if we have it
        if (userId && partnerRecord.user_id !== userId) {
          console.log(`Updating partner user_id to match session UUID: ${userId}`);
          const updateData = { user_id: userId };
            
            const { error: updateError } = await supabase
              .from('partners')
              .update(updateData)
              .eq('id', partnerRecord.id);
              
            if (updateError) {
            console.error(`Error updating partner user_id:`, updateError);
            } else {
            console.log(`Updated partner user_id successfully`);
          }
        }
          
          console.log('Created synthetic user from partner data:', syntheticUser);
        setUserData(syntheticUser as UserData);
          setLoading(false);
          return;
      }
      
      // STEP 4: Try finding in employees table
      console.log('Looking for user in employees table...');
      
      let employeeRecord = null;
      
      if (employeesResults.data && employeesResults.data.length > 0) {
        employeeRecord = employeesResults.data[0];
      }
      
      if (employeeRecord) {
        // Create synthetic user from employee data
        const employeeName = employeeRecord.full_name || employeeRecord.name || '';
          const syntheticUser = {
          id: employeeRecord.id,
          email: employeeRecord.email,
          username: employeeName.split(' ')[0] || employeeRecord.email?.split('@')[0] || 'User',
              auth_id: userId,
          role: employeeRecord.position || 'Employee',
          department: employeeRecord.department,
          created_at: employeeRecord.created_at || new Date().toISOString(),
          updated_at: employeeRecord.updated_at || new Date().toISOString(),
          employees: [employeeRecord]
        };
        
        // Update the employee record with auth_id if we have it
        if (userId && employeeRecord.user_id !== userId) {
          console.log(`Updating employee user_id to match session UUID: ${userId}`);
          const updateData = { user_id: userId };
            
            const { error: updateError } = await supabase
              .from('employees')
              .update(updateData)
              .eq('id', employeeRecord.id);
              
            if (updateError) {
            console.error(`Error updating employee user_id:`, updateError);
            } else {
            console.log(`Updated employee user_id successfully`);
            }
          }
          
        console.log('Created synthetic user from employee data:', syntheticUser);
        setUserData(syntheticUser as UserData);
          setLoading(false);
          return;
        }
      
      // If we didn't find anything in the parallel searches, try a direct fallback approach
      if (!usersResults.data?.length && !partnersResults.data?.length && !employeesResults.data?.length && userEmail) {
        console.log('No records found in initial searches, trying fallback direct approach');
        
        // Direct check of the partners table as a backup
        console.log('Making direct check for partner record...');
        try {
          const { data: directPartners, error: directPartnerError } = await supabase
            .from('partners')
            .select('*')
            .eq('email', userEmail)
            .limit(1);
            
          if (directPartnerError) {
            console.error('Error in direct partners query:', directPartnerError);
          } else if (directPartners && directPartners.length > 0) {
            console.log('Found partner record directly:', directPartners[0]);
            
            // Create a user record based on this partner
            const partnerData = directPartners[0];
            const syntheticUser = {
              id: partnerData.id,
              email: partnerData.email,
              username: (partnerData.full_name || '').split(' ')[0] || partnerData.email?.split('@')[0] || 'User',
              auth_id: userId,
              role: 'Partner',
              department: partnerData.specialization || 'General',
              phone: partnerData.phone_number,
              partners: [partnerData],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Update the partner with auth_id
            if (userId) {
              console.log('Updating partner with auth_id as user_id');
              const { error: updateError } = await supabase
                .from('partners')
                .update({ user_id: userId })
                .eq('id', partnerData.id);

        if (updateError) {
                console.error('Error updating partner user_id:', updateError);
              } else {
                console.log('Updated partner user_id successfully');
              }
            }
            
            console.log('Using synthetic user from partner data:', syntheticUser);
            setUserData(syntheticUser as UserData);
            setLoading(false);
            return;
        } else {
            console.log('No partner record found with direct query');
          }
        } catch (err) {
          console.error('Exception in direct partner query:', err);
        }
      }
      
      // STEP 5: Last resort - create a new user
      console.log('No user, partner, or employee found with the provided identifiers, attempting to create user...');
      
      if (userId && userEmail) {
        try {
          const { data: newUser, error: insertError } = await supabase
        .from('users')
            .insert({
              email: userEmail,
              username: userEmail.split('@')[0],
              auth_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (insertError) {
            console.error('Error creating user:', insertError);
          } else if (newUser) {
            console.log('Created new user:', newUser);
            setUserData(newUser);
            setLoading(false);
        return;
          }
        } catch (insertError) {
          console.error('Exception during user creation:', insertError);
        }
      }

      console.log('Could not find or create user with available identifiers');
      setLoading(false);
      
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      setLoading(false);
    }
  };

  // Helper function to fetch related data using auth_id
  const enhanceUserData = async (userData: any) => {
    try {
      console.log('Enhancing user data:', userData);
      // Clone the user data to avoid mutation problems
      const enhancedData = { ...userData };
      
      // If we already have partners data, don't fetch it again
      if (!enhancedData.partners) {
        // First, try to fetch partner data using auth_id
        if (userData.auth_id) {
          console.log('Fetching partners using auth_id:', userData.auth_id);
          const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('*')
            .eq('user_id', userData.auth_id);
      
      if (partnersError) {
            console.error('Error fetching partners by auth_id:', partnersError);
          } else if (partners && partners.length > 0) {
            console.log('Found partners by auth_id:', partners);
            enhancedData.partners = partners;
          } else {
            console.log('No partners found with auth_id:', userData.auth_id);
            
            // Try with email as backup
            if (userData.email) {
              console.log('Attempting to find partners by email:', userData.email);
              const { data: partnersByEmail, error: emailError } = await supabase
                .from('partners')
                .select('*')
                .ilike('email', userData.email);
                
              if (emailError) {
                console.error('Error fetching partners by email:', emailError);
              } else if (partnersByEmail && partnersByEmail.length > 0) {
                console.log('Found partners by email:', partnersByEmail);
                
                // Update these partners to have the correct auth_id
                if (userData.auth_id) {
                  for (const partner of partnersByEmail) {
                    console.log('Updating partner user_id to match auth_id:', partner.id);
                    const { error: updateError } = await supabase
                      .from('partners')
                      .update({ user_id: userData.auth_id })
                      .eq('id', partner.id);
                      
                    if (updateError) {
                      console.error('Error updating partner user_id:', updateError);
                    }
                  }
                }
                
                enhancedData.partners = partnersByEmail;
              } else {
                console.log('No partners found with email:', userData.email);
              }
            }
          }
        }
      } else {
        console.log('User already has partners data:', enhancedData.partners);
      }
      
      // If we already have employees data, don't fetch it again
      if (!enhancedData.employees) {
        // First, try to fetch employee data using auth_id
        if (userData.auth_id) {
          console.log('Fetching employees using auth_id:', userData.auth_id);
          const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*')
            .eq('user_id', userData.auth_id);
      
      if (employeesError) {
            console.error('Error fetching employees by auth_id:', employeesError);
          } else if (employees && employees.length > 0) {
            console.log('Found employees by auth_id:', employees);
            enhancedData.employees = employees;
          } else {
            console.log('No employees found with auth_id:', userData.auth_id);
            
            // Try with email as backup
            if (userData.email) {
              console.log('Attempting to find employees by email:', userData.email);
              const { data: employeesByEmail, error: emailError } = await supabase
                .from('employees')
                .select('*')
                .ilike('email', userData.email);
                
              if (emailError) {
                console.error('Error fetching employees by email:', emailError);
              } else if (employeesByEmail && employeesByEmail.length > 0) {
                console.log('Found employees by email:', employeesByEmail);
                
                // Update these employees to have the correct auth_id
                if (userData.auth_id) {
                  for (const employee of employeesByEmail) {
                    console.log('Updating employee user_id to match auth_id:', employee.id);
                    const { error: updateError } = await supabase
                      .from('employees')
                      .update({ user_id: userData.auth_id })
                      .eq('id', employee.id);
                      
                    if (updateError) {
                      console.error('Error updating employee user_id:', updateError);
                    }
                  }
                }
                
                enhancedData.employees = employeesByEmail;
              } else {
                console.log('No employees found with email:', userData.email);
              }
            }
          }
        }
      } else {
        console.log('User already has employees data:', enhancedData.employees);
      }
      
      // Handle department and other profile fields
      enhancedData.department = enhancedData.department || 
                               (enhancedData.partners?.[0]?.department) ||
                               (enhancedData.employees?.[0]?.department) || 
                               'General';
      
      enhancedData.phone = enhancedData.phone || 
                          (enhancedData.partners?.[0]?.phone_number) || 
                          (enhancedData.employees?.[0]?.phone_number) || 
                          'Not set';
                          
      enhancedData.location = enhancedData.location || 
                             (enhancedData.partners?.[0]?.location) || 
                             (enhancedData.employees?.[0]?.location) || 
                             'Not set';
                             
      enhancedData.role = enhancedData.role || 
                         (enhancedData.partners?.[0] ? 'Partner' : '') || 
                         (enhancedData.employees?.[0] ? enhancedData.employees[0].position || 'Employee' : '') || 
                         'User';
      
      console.log('Enhanced user data:', enhancedData);
      return enhancedData;
    } catch (error) {
      console.error('Error enhancing user data:', error);
      return userData; // Return original data if enhancement fails
    }
  };

  // Get user display data
  const userFullName = userData?.username || 
                      userData?.email?.split('@')[0] || 
                      'User';
  const userEmail = userData?.email;
  
  // Fix for linter errors - safer role formatting
  const userRole = userData?.role 
                  ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
                  : 'User';

  const userDepartment = userData?.department || 
                        userData?.partners?.[0]?.specialization || 
                        'Not specified';
  const userPhone = userData?.phone || 
                   userData?.partners?.[0]?.phone_number || 
                   userData?.employees?.[0]?.phone_number || 
                   'Not specified';
  const joinDate = userData?.created_at ? 
                  new Date(userData.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  }) : 
                  'Not specified';

  // Load saved preferences
  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [
          savedFontSize,
          savedCompactMode,
          savedReducedMotion,
          savedHighContrast
        ] = await Promise.all([
          AsyncStorage.getItem(FONT_SIZE_KEY),
          AsyncStorage.getItem(COMPACT_MODE_KEY),
          AsyncStorage.getItem(REDUCED_MOTION_KEY),
          AsyncStorage.getItem(HIGH_CONTRAST_KEY)
        ]);

        if (savedFontSize) setFontSize(savedFontSize as FontSize);
        if (savedCompactMode) setCompactMode(savedCompactMode === 'true');
        if (savedReducedMotion) setReducedMotion(savedReducedMotion === 'true');
        if (savedHighContrast) setHighContrast(savedHighContrast === 'true');
      } catch (error) {
        console.warn('Failed to load preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  const handleFontSizeChange = async (value: string) => {
    setFontSize(value as FontSize);
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, value);
    } catch (error) {
      console.warn('Failed to save font size preference:', error);
    }
  };

  const handleCompactModeChange = async (value: boolean) => {
    setCompactMode(value);
    try {
      await AsyncStorage.setItem(COMPACT_MODE_KEY, value.toString());
    } catch (error) {
      console.warn('Failed to save compact mode preference:', error);
    }
  };

  const handleReducedMotionChange = async (value: boolean) => {
    setReducedMotion(value);
    try {
      await AsyncStorage.setItem(REDUCED_MOTION_KEY, value.toString());
    } catch (error) {
      console.warn('Failed to save reduced motion preference:', error);
    }
  };

  const handleHighContrastChange = async (value: boolean) => {
    setHighContrast(value);
    try {
      await AsyncStorage.setItem(HIGH_CONTRAST_KEY, value.toString());
    } catch (error) {
      console.warn('Failed to save high contrast preference:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0F172A', // Dark blue background
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      marginHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      color: '#fff', // White text for dark background
    },
    profileSection: {
      padding: 20,
      marginBottom: 24,
      backgroundColor: '#1E293B', // Dark surface color
      borderRadius: 16,
      margin: 16,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: paperTheme.colors.primary,
      borderRadius: 62, // slightly larger than avatar size / 2
      padding: 4,
    },
    statusIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: paperTheme.colors.primary,
      borderWidth: 3,
      borderColor: '#1E293B', // Match surface color
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 12,
      color: '#fff', // White text for dark background
    },
    profileEmail: {
      fontSize: 16,
      opacity: 0.7,
      marginTop: 4,
      color: '#fff', // White text for dark background
    },
    roleChip: {
      marginTop: 8,
      backgroundColor: 'rgba(59, 130, 246, 0.2)', // Slight blue tint
    },
    profileActions: {
      flexDirection: 'row',
      marginTop: 16,
      justifyContent: 'center',
    },
    accountInfo: {
      marginTop: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.05)', // Slightly lighter background
      borderRadius: 12,
      padding: 16,
    },
    accountInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    accountInfoLabel: {
      opacity: 0.7,
      marginLeft: 12,
      flex: 1,
      color: '#fff', // White text for dark background
    },
    accountInfoValue: {
      fontWeight: '500',
      color: '#fff', // White text for dark background
    },
    divider: {
      marginVertical: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slightly visible divider
    },
    listSection: {
      backgroundColor: '#1E293B', // Dark surface color
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      overflow: 'hidden',
    },
    listItem: {
      paddingVertical: 12,
    },
    textLight: {
      color: '#fff', // White text for dark background
    },
    textSecondary: {
      color: 'rgba(255, 255, 255, 0.7)', // Slightly dimmed text
    },
    chipGroup: {
      flexDirection: 'row',
      gap: 8,
    },
    selectedChip: {
      backgroundColor: paperTheme.colors.primary,
    },
    chip: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    logoutButton: {
      marginHorizontal: 16,
      marginBottom: 60,
      backgroundColor: '#DC2626', // Red color for logout
    },
    radioButtonContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      backgroundColor: '#1E293B', // Match listSection background
    },
    version: {
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: 8,
      fontSize: 12,
    }
  });

  const handleLogout = () => {
    router.replace(routes.auth.logout);
  };

  const handleEditProfile = () => {
    router.push('/(app)/edit-profile');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Debug info section removed for production */}
      
      <Surface style={styles.profileSection} elevation={3}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={120}
              source={require('@/assets/images/defaultavatar.png')}
            />
            <View style={styles.statusIndicator} />
          </View>
          <Text style={styles.profileName}>{userFullName}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>
          <Chip 
            icon="badge-account" 
            style={styles.roleChip}
            textStyle={styles.textLight}
            mode="outlined"
          >
            {userRole}
          </Chip>
          <View style={styles.profileActions}>
            <Button
              mode="contained"
              icon="account-edit"
              onPress={handleEditProfile}
              loading={loading}
              buttonColor={paperTheme.colors.primary}
              textColor="#fff"
            >
              Edit Profile
            </Button>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.accountInfo}>
          <Text style={[styles.sectionTitle, { marginHorizontal: 0, marginBottom: 12 }]}>
            <MaterialCommunityIcons name="card-account-details-outline" size={24} color={paperTheme.colors.primary} />
            Account Information
          </Text>
          <View style={styles.accountInfoItem}>
            <MaterialCommunityIcons name="office-building" size={20} color={paperTheme.colors.primary} />
            <Text style={styles.accountInfoLabel}>Department</Text>
            <Text style={styles.accountInfoValue}>{userDepartment}</Text>
          </View>
          <View style={styles.accountInfoItem}>
            <MaterialCommunityIcons name="phone" size={20} color={paperTheme.colors.primary} />
            <Text style={styles.accountInfoLabel}>Phone</Text>
            <Text style={styles.accountInfoValue}>{userPhone}</Text>
          </View>
          <View style={styles.accountInfoItem}>
            <MaterialCommunityIcons name="calendar" size={20} color={paperTheme.colors.primary} />
            <Text style={styles.accountInfoLabel}>Joined</Text>
            <Text style={styles.accountInfoValue}>{joinDate}</Text>
          </View>
        </View>
      </Surface>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={paperTheme.colors.primary} />
          Notifications
        </Text>
        <List.Section style={styles.listSection}>
          <List.Item
            title="Push Notifications"
            description="Receive push notifications"
            titleStyle={styles.textLight}
            descriptionStyle={styles.textSecondary}
            style={styles.listItem}
            left={props => <List.Icon {...props} icon="bell" color={paperTheme.colors.primary} />}
            right={props => <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Email Notifications"
            description="Receive email updates"
            titleStyle={styles.textLight}
            descriptionStyle={styles.textSecondary}
            style={styles.listItem}
            left={props => <List.Icon {...props} icon="email" color={paperTheme.colors.primary} />}
            right={props => <Switch value={emailNotifications} onValueChange={setEmailNotifications} />}
          />
        </List.Section>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="information-outline" size={24} color={paperTheme.colors.primary} />
          About
        </Text>
        <List.Section style={styles.listSection}>
          <List.Item
            title="App Version"
            description="1.0.0"
            titleStyle={styles.textLight}
            descriptionStyle={styles.textSecondary}
            style={styles.listItem}
            left={props => <List.Icon {...props} icon="information" color={paperTheme.colors.primary} />}
          />
        </List.Section>
        <Text style={styles.version}>© 2023 StoryLab. All rights reserved.</Text>
      </View>

      <View style={styles.section}>
        <Button
          mode="contained"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={{ height: 48 }}
          labelStyle={{ fontSize: 16 }}
        >
          Log Out
        </Button>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen; 