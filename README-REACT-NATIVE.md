# Story Lab - Pure React Native App

This is a pure React Native implementation of the Story Lab app, without any Expo dependencies.

## Getting Started

### Prerequisites

- Node.js >= 14
- JDK 11 or newer
- Android Studio with Android SDK (for Android development)
- Xcode (for iOS development, macOS only)
- CocoaPods (for iOS development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Running the App

#### Android

```
npm run android
```

#### iOS (macOS only)

```
cd ios && pod install && cd ..
npm run ios
```

### Project Structure

- `/android` - Android native code
- `/ios` - iOS native code (will be created when running on macOS)
- `/screens` - React Native screen components
- `/components` - Reusable React components
- `/assets` - Images, fonts, and other static assets
- `/hooks` - Custom React hooks
- `/lib` - Utility functions and services
- `/constants` - App constants and configuration

## Features

- Pure React Native (no Expo)
- React Navigation for navigation
- Native modules directly accessible
- Full control over native code and configurations

## Migration from Expo

This app has been migrated from an Expo-based application to a pure React Native application. The main changes include:

1. Removed all Expo dependencies and replaced them with React Native equivalents
2. Replaced Expo Router with React Navigation
3. Added direct native module integrations
4. Updated build configurations for both Android and iOS

## Build and Release

### Android

To create a release build for Android:

```
cd android
./gradlew assembleRelease
```

The APK will be available at `android/app/build/outputs/apk/release/app-release.apk`

### iOS

To create a release build for iOS (requires macOS):

1. Open the Xcode workspace:
   ```
   open ios/StoryLab.xcworkspace
   ```
2. Select the "Product" menu and then "Archive"
3. Follow the prompts to create and distribute your app

## Troubleshooting

### Common Issues

- **Build failures**: Make sure all native dependencies are properly linked. You may need to use `npx react-native-asset` to link assets.
- **iOS issues**: Always run `pod install` in the ios directory after adding new dependencies
- **Android issues**: Check your Android SDK configuration and make sure the paths are correctly set up

For more detailed troubleshooting, refer to the [React Native documentation](https://reactnative.dev/docs/troubleshooting). 