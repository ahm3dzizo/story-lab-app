import * as Font from 'expo-font';
import { Platform } from 'react-native';

/**
 * EMERGENCY ICONS FIX
 * 
 * This module provides direct solutions for fixing icon font issues
 * in React Native and Expo projects.
 */

// Define a mapping of icons to use for the emergency fix
const ICON_FONT_PATHS: Record<string, any> = {
  // Standard Material Community Icons - absolutely essential
  MaterialCommunityIcons: require('../../assets/fonts/MaterialCommunityIcons.ttf'),
  'Material Design Icons': require('../../assets/fonts/MaterialCommunityIcons.ttf'), // Alias used by some libraries
  'Material Icons': require('../../assets/fonts/MaterialIcons.ttf'),
  MaterialIcons: require('../../assets/fonts/MaterialIcons.ttf'),
  Ionicons: require('../../assets/fonts/Ionicons.ttf'),
  FontAwesome: require('../../assets/fonts/FontAwesome.ttf'),

  // Include other icon fonts to ensure all possible names are covered
  AntDesign: require('../../assets/fonts/AntDesign.ttf'),
  Entypo: require('../../assets/fonts/Entypo.ttf'),
  EvilIcons: require('../../assets/fonts/EvilIcons.ttf'),
  Feather: require('../../assets/fonts/Feather.ttf'),
  FontAwesome5_Brands: require('../../assets/fonts/FontAwesome5_Brands.ttf'),
  FontAwesome5_Regular: require('../../assets/fonts/FontAwesome5_Regular.ttf'),
  FontAwesome5_Solid: require('../../assets/fonts/FontAwesome5_Solid.ttf'),
  Fontisto: require('../../assets/fonts/Fontisto.ttf'),
  Foundation: require('../../assets/fonts/Foundation.ttf'),
  Octicons: require('../../assets/fonts/Octicons.ttf'),
  SimpleLineIcons: require('../../assets/fonts/SimpleLineIcons.ttf'),
  Zocial: require('../../assets/fonts/Zocial.ttf'),
};

/**
 * Emergency fix that directly loads all icon fonts to ensure they're available
 */
export async function emergencyIconFix(): Promise<boolean> {
  try {
    console.log('🚨 Applying emergency icon fix...');
    await Font.loadAsync(ICON_FONT_PATHS);
    console.log('✅ Emergency icon fix applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to apply emergency icon fix:', error);
    return false;
  }
}

/**
 * Check if a specific icon font is loaded
 */
export async function checkIconFont(fontFamily: string): Promise<boolean> {
  try {
    const fontMap = await Font.loadAsync({ 
      [fontFamily]: ICON_FONT_PATHS[fontFamily] 
    });
    console.log(`✅ Font ${fontFamily} loaded successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to load font ${fontFamily}:`, error);
    return false;
  }
} 