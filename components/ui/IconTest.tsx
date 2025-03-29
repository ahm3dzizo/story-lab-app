import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Platform } from 'react-native';
import { IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialCommunityIconsDirect from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as Font from 'expo-font';
import { emergencyIconFix } from '@/lib/utils/IconsSupport';

/**
 * Test component to diagnose icon loading issues
 * This displays icons using different import and usage styles
 */
export const IconTest = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleEmergencyFix = async () => {
    setLoading(true);
    try {
      await emergencyIconFix();
      setRefreshKey(prev => prev + 1);
      alert('Emergency fix applied - icons should show now');
    } catch (error) {
      console.error('Error applying emergency fix:', error);
      alert('Failed to apply emergency fix');
    } finally {
      setLoading(false);
    }
  };

  // Direct loading of the material community icon
  const handleDirectLoad = async () => {
    setLoading(true);
    try {
      await Font.loadAsync({
        'MaterialCommunityIcons': require('../../assets/fonts/MaterialCommunityIcons.ttf'),
      });
      setRefreshKey(prev => prev + 1);
      alert('Direct font load completed');
    } catch (error) {
      console.error('Error loading font directly:', error);
      alert('Failed to load font directly');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} key={refreshKey}>
      <Text style={styles.title}>Icon Test Component</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Apply Emergency Fix" 
          onPress={handleEmergencyFix} 
          disabled={loading} 
        />
        <View style={{ height: 10 }} />
        <Button 
          title="Load Font Directly" 
          onPress={handleDirectLoad} 
          disabled={loading} 
        />
      </View>
      
      <Text style={styles.subtitle}>Default Import</Text>
      <View style={styles.row}>
        <MaterialCommunityIcons name="home" size={24} color="#000" />
        <MaterialCommunityIcons name="account" size={24} color="#000" />
        <MaterialCommunityIcons name="bell" size={24} color="#000" />
        <MaterialCommunityIcons name="cog" size={24} color="#000" />
        <MaterialCommunityIcons name="menu" size={24} color="#000" />
      </View>

      <Divider style={styles.divider} />
      
      <Text style={styles.subtitle}>Direct Import</Text>
      <View style={styles.row}>
        <MaterialCommunityIconsDirect name="home" size={24} color="#000" />
        <MaterialCommunityIconsDirect name="account" size={24} color="#000" />
        <MaterialCommunityIconsDirect name="bell" size={24} color="#000" />
        <MaterialCommunityIconsDirect name="cog" size={24} color="#000" />
        <MaterialCommunityIconsDirect name="menu" size={24} color="#000" />
      </View>

      <Divider style={styles.divider} />
      
      <Text style={styles.subtitle}>Paper Icon Button</Text>
      <View style={styles.row}>
        <IconButton icon="home" size={24} />
        <IconButton icon="account" size={24} />
        <IconButton icon="bell" size={24} />
        <IconButton icon="cog" size={24} />
        <IconButton icon="menu" size={24} />
      </View>

      <Divider style={styles.divider} />
      
      <Text style={styles.subtitle}>Other Icon Families</Text>
      <View style={styles.row}>
        <Ionicons name="home" size={24} color="#000" />
        <FontAwesome name="user" size={24} color="#000" />
        <AntDesign name="heart" size={24} color="#000" />
        <Ionicons name="settings" size={24} color="#000" />
        <FontAwesome name="bars" size={24} color="#000" />
      </View>

      <Divider style={styles.divider} />
      
      <Text style={styles.subtitle}>Platform Info</Text>
      <Text style={styles.info}>Platform: {Platform.OS}</Text>
      <Text style={styles.info}>Version: {Platform.Version}</Text>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  divider: {
    marginVertical: 16,
  },
  buttonContainer: {
    marginVertical: 16,
  },
  info: {
    fontSize: 14,
    marginVertical: 4,
  },
});

export default IconTest; 