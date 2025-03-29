import { Dimensions, Platform, PixelRatio } from 'react-native';
import React from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base width and height used for scaling
const baseWidth = 375; // iPhone 8 width
const baseHeight = 667; // iPhone 8 height

// Scale factor for width and height
const widthScale = SCREEN_WIDTH / baseWidth;
const heightScale = SCREEN_HEIGHT / baseHeight;

// Responsive font size
export const responsiveFontSize = (size: number) => {
  const newSize = size * widthScale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Responsive width
export const responsiveWidth = (width: number) => {
  return SCREEN_WIDTH * (width / 100);
};

// Responsive height
export const responsiveHeight = (height: number) => {
  return SCREEN_HEIGHT * (height / 100);
};

// Responsive padding/margin
export const responsiveSpacing = (size: number) => {
  return size * widthScale;
};

// Check if device is a tablet
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  return (
    (adjustedWidth >= 1000 || adjustedHeight >= 1000) && 
    pixelDensity < 2
  );
};

// Check if device is in landscape mode
export const isLandscape = () => {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
};

// Get device type
export const getDeviceType = () => {
  if (isTablet()) return 'tablet';
  return 'phone';
};

// Get responsive grid columns based on screen width
export const getGridColumns = () => {
  if (SCREEN_WIDTH >= 768) return 3; // Tablet
  if (SCREEN_WIDTH >= 480) return 2; // Large phone
  return 1; // Small phone
};

// Create a hook to listen for dimension changes
export const useDimensions = () => {
  const [dimensions, setDimensions] = React.useState({
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen'),
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      setDimensions({ window, screen });
    });
    return () => subscription?.remove();
  }, []);

  return dimensions;
};

const responsive = {
  responsiveWidth,
  responsiveHeight,
  responsiveSpacing,
  isTablet,
  getGridColumns
};

export default responsive; 