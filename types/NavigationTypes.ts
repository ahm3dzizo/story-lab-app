import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  SomeComponent: undefined; // No parameters
  SettingsScreen: undefined; // No parameters
};

export type SomeComponentNavigationProp = StackNavigationProp<RootStackParamList, 'SomeComponent'>; 