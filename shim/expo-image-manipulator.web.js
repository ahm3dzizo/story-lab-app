// Web shim for expo-image-manipulator
// This provides fallback/mock implementation for web

export default {
  manipulateAsync: async (uri, actions, options = {}) => {
    console.warn('Image manipulation is not fully supported on web');
    // Return original image on web platform
    return { uri };
  },
};

export const SaveFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
};

export const manipulateAsync = async (uri, actions, options = {}) => {
  console.warn('Image manipulation is not fully supported on web');
  // Return original image on web platform
  return { uri };
}; 