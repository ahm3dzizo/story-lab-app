# Building an APK for Story Lab App

After trying multiple approaches to build an APK for your Story Lab React Native application, we've identified some challenges and solutions.

## Option 1: Using Expo EAS Build (Recommended)

The most reliable way to build an APK for your Expo/React Native app is to use Expo's EAS Build service, which handles all the complex build configurations for you.

1. Make sure you're logged in to Expo:
   ```
   npx expo login
   ```

2. Install required packages:
   ```
   npx expo install expo-updates expo-router expo-image-picker expo-document-picker expo-media-library
   ```

3. Build the APK using the EAS Build service with the preview profile:
   ```
   npx eas build -p android --profile preview
   ```

4. When the build completes, you'll receive a link to download your APK.

## Option 2: Building Locally with Android Studio

If you prefer to build locally:

1. Generate the Android project files:
   ```
   npx expo prebuild -p android
   ```

2. Open the 'android' folder in Android Studio

3. From Android Studio, select:
   - Build > Build Bundle(s) / APK(s) > Build APK(s)

4. After the build completes, click on "locate" to find your APK file.

## Troubleshooting Common Issues

1. **Kotlin Daemon Issues**: If you encounter issues with the Kotlin daemon when building locally, try stopping it:
   ```
   cd android
   .\gradlew.bat --stop
   ```

2. **Babel Configuration Errors**: If you get errors about private class methods not being enabled, you need to update your Babel configuration by adding the `@babel/plugin-transform-private-methods` plugin:
   ```
   npm install --save-dev @babel/plugin-transform-private-methods
   ```
   
   Then update your babel.config.js to include this plugin.

3. **Metro Configuration Issues**: Ensure your metro.config.js properly extends the Expo Metro configuration:
   ```javascript
   const { getDefaultConfig } = require('@expo/metro-config');
   const defaultConfig = getDefaultConfig(__dirname);
   
   // Your custom configurations here
   
   module.exports = {
     ...defaultConfig,
     // Additional overrides
   };
   ```

4. **Connection Timeouts**: If you encounter timeouts with EAS Build, try again later or use a VPN if your network blocks certain connections.

## Getting Help

If you continue to face issues:

1. Check the Expo documentation: https://docs.expo.dev/build/setup/
2. Visit the React Native documentation: https://reactnative.dev/docs/signed-apk-android
3. Post issues on the Expo forums: https://forums.expo.dev/ 