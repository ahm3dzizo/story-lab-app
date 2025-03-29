import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerGroupProps {
  count: number;
  itemStyle?: ViewStyle;
}

export const ShimmerGroup: React.FC<ShimmerGroupProps> = ({ count, itemStyle }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.shimmer, itemStyle]}>
          <Animated.View style={[styles.gradient, { opacity: animatedValue }]} />
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F2F8FC',
  },
}); 