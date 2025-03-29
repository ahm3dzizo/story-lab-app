import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AnimatedLogo from '@/assets/logomotion';

export default function LogomotionScreen() {
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <AnimatedLogo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  }
}); 