import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { gradients } from '@/lib/theme';

interface ScreenGradientProps {
  children: React.ReactNode;
}

export const ScreenGradient = ({ children }: ScreenGradientProps) => {
  const pathname = usePathname();
  
  const getGradientColors = (): [string, string] => {
    const path = pathname.split('/')[2] || '';
    switch (path) {
      case '':
        return gradients.primary as [string, string];
      case 'settings':
        return gradients.secondary as [string, string];
      case 'profile':
        return gradients.surface as [string, string];
      default:
        return gradients.primary as [string, string];
    }
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {children}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
}); 