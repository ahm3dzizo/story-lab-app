import { Platform } from 'react-native';

export const animationConfig = {
  useNativeDriver: Platform.OS !== 'web',
  tension: 40,
  friction: 7,
  duration: 300,
};

export const getAnimationConfig = (customConfig = {}) => ({
  ...animationConfig,
  ...customConfig,
});

export default {
  animationConfig,
  getAnimationConfig,
}; 