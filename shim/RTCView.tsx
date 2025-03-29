/**
 * Shim for RTCView component in web environment
 */

import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';

export interface RTCViewProps extends ViewProps {
  streamURL: string;
  [key: string]: any;
}

// A simple component that mimics RTCView for web
const RTCView = React.forwardRef<View, RTCViewProps>((props, ref) => {
  return (
    <View 
      ref={ref} 
      {...props} 
      style={[styles.container, props.style]}
    >
      <Text style={styles.emoji}>📱 📹</Text>
      <Text style={styles.text}>WebRTC View</Text>
      <Text style={styles.subtext}>Not available in web environment</Text>
      <Text style={styles.emoji}>🌐</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2c3e50',
    minHeight: 200,
    minWidth: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  subtext: {
    color: '#ecf0f1',
    fontSize: 12,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 24,
    marginVertical: 8,
  }
});

export default RTCView; 