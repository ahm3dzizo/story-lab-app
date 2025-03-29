import 'dotenv/config';

export default {
  expo: {
    name: 'Story Lab',
    slug: 'story-lab',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.storylab.app',
      buildNumber: '1.0.0',
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.storylab.app',
      versionCode: 1,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'RECORD_AUDIO',
        'ACCESS_NETWORK_STATE',
        'CHANGE_NETWORK_STATE',
        'MODIFY_AUDIO_SETTINGS',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED',
        'WAKE_LOCK',
        'INTERNET'
      ],
      softwareKeyboardLayoutMode: 'pan',
      allowBackup: true,
      usesCleartextTraffic: true,
      intentFilters: [
        {
          action: 'VIEW',
          category: ['DEFAULT', 'BROWSABLE'],
          data: {
            scheme: 'https',
            host: 'zafiiboppuqoihzlncii.supabase.co'
          }
        }
      ]
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      [
        'expo-image-picker',
        {
          photosPermission: 'The app needs access to your photos to let you share them with your contacts.',
          cameraPermission: 'The app needs access to your camera to let you take photos.'
        }
      ],
      [
        'expo-document-picker',
        {
          iCloudContainerEnvironment: 'Production'
        }
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'The app needs access to your photos to save images and videos.',
          savePhotosPermission: 'The app needs access to save photos and videos to your library.',
          isAccessMediaLocationEnabled: true
        }
      ],
      [
        'expo-build-properties',
        {
          android: {
            extraProguardRules: `-keep class com.storylab.app.** { *; }
            -keep class io.invertase.firebase.** { *; }
            -keep class com.google.firebase.** { *; }
            -keep class org.webrtc.** { *; }
            -dontwarn io.invertase.firebase.**
            -dontwarn com.google.firebase.**
            -keep class com.google.gson.** { *; }
            -keep class org.json.** { *; }
            -keep class io.reactivex.** { *; }
            -keep class okio.** { *; }
            -keep class okhttp3.** { *; }
            -keep class androidx.** { *; }
            -keep class com.facebook.** { *; }
            -keep class @supabase.** { *; }`,
            extraMavenRepos: [
              "https://maven.google.com",
              "https://jitpack.io"
            ]
          }
        }
      ]
    ],
    updates: {
      url: "https://u.expo.dev/a3045bc8-ebd2-4651-85ad-ed4d59c34fb1"
    },
    runtimeVersion: "1.0.0",
    scheme: 'storylab',
    experiments: {
      typedRoutes: true,
    },
    extra: {
      API_URL: process.env.API_URL || 'http://localhost:3000/api',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://zafiiboppuqoihzlncii.supabase.co",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZmlpYm9wcHVxb2loemxuY2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5Mjg2MTcsImV4cCI6MjA1NjUwNDYxN30.BXN9OfWkAKADob1gvaVPssAjzkpiVkg8hQqPVTjNU50",
      supabaseServiceKey: process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
      eas: {
        projectId: 'a3045bc8-ebd2-4651-85ad-ed4d59c34fb1'
      },
      debugMode: true,
      enableSensitiveLogs: true,
    }
  }
}; 