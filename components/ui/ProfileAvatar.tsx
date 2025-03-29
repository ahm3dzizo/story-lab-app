import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Text, useTheme } from 'react-native-paper';
import { gradients } from '../../lib/theme';
const LinearGradient = require('expo-linear-gradient').LinearGradient;

interface ProfileAvatarProps {
  imageUrl?: string | null;
  name?: string | null;
  size?: number;
  style?: any;
}

export function ProfileAvatar({ imageUrl, name, size = 48, style }: ProfileAvatarProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    avatarContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    avatar: {
      backgroundColor: colors.primaryContainer,
    },
    avatarText: {
      color: colors.surface,
      fontWeight: '600',
    },
  });

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (imageUrl) {
    return (
      <Avatar.Image
        size={size}
        source={{ uri: imageUrl }}
        style={[styles.avatar, style]}
      />
    );
  }

  return (
    <LinearGradient
      colors={gradients.primary}
      style={[
        styles.avatarContainer,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text
        style={[
          styles.avatarText,
          { fontSize: size * 0.4 }
        ]}
      >
        {getInitials(name)}
      </Text>
    </LinearGradient>
  );
} 