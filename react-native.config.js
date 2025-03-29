module.exports = {
  project: {
    ios: {
      sourceDir: './ios',
    },
    android: {
      sourceDir: './android',
      manifestPath: './android/app/src/main/AndroidManifest.xml',
      packageName: 'com.storylabnew',
    },
  },
  dependencies: {
    'react-native-webrtc': {
      platforms: {
        android: {
          sourceDir: './node_modules/react-native-webrtc/android'
        },
      },
    },
  },
}; 