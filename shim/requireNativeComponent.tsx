/**
 * Shim for requireNativeComponent in web environment
 * 
 * This provides a fallback implementation for react-native-webrtc when running on web
 */

import React from 'react';
import { View, ViewProps, Text, StyleSheet } from 'react-native';

interface ComponentConfig {
  propTypes?: Record<string, any>;
}

// Simple shim that returns a basic View component for web
export default function requireNativeComponent(
  componentName: string, 
  componentConfig?: ComponentConfig
): React.ForwardRefExoticComponent<ViewProps & React.RefAttributes<any>> {
  // Return a simple component that renders a View with a warning message
  return React.forwardRef((props, ref) => {
    console.warn(`Native component "${componentName}" is not available on web platform`);
    return (
      <View ref={ref} {...props} style={[styles.container, props.style]}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.text}>{componentName}</Text>
        <Text style={styles.subtext}>Native component not available on web</Text>
        <Text style={styles.emoji}>🌐</Text>
      </View>
    );
  });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#34495e',
    minHeight: 200,
    minWidth: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 16,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
    textAlign: 'center',
  },
  subtext: {
    color: '#ecf0f1',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 24,
    marginVertical: 8,
  }
}); 