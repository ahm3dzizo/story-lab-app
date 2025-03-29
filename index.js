/**
 * @format
 */

// أضف فقط البدائل الأساسية
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import 'expo-router/entry';
import { LogBox } from 'react-native';

// تجاهل التحذيرات
LogBox.ignoreLogs([
  'Overwriting fontFamily style attribute preprocessor',
  'EventEmitter.removeListener',
  'ViewPropTypes will be removed',
  'Setting a timer for a long period of time',
  'AsyncStorage has been extracted from react-native',
  'VirtualizedLists should never be nested',
  'The package at',
  'It failed because',
  'Learn more',
  'Attempted to import',
  'Error evaluating injected script',
  'Native splash screen is already hidden',
  'Constants.deviceYearClass'
]);

// تسجيل تهيئة التطبيق
console.log('Initializing Story Lab App with expo-router'); 