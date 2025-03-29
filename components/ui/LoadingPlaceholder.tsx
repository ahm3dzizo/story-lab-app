import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import Animated, { withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

interface LoadingPlaceholderProps {
  width?: DimensionValue;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const LoadingPlaceholder: React.FC<LoadingPlaceholderProps> = ({
  width = '100%',
  height = 60,
  style,
}) => {
  const theme = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withTiming(0.5, { duration: 1000 }),
      -1,
      true
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.placeholder,
        {
          width,
          height,
          backgroundColor: theme.colors.surfaceVariant,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    borderRadius: 8,
  },
}); 