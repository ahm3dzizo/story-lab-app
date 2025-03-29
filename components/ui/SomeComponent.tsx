import React from 'react';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SomeComponentNavigationProp } from '@/types/NavigationTypes'; // Adjust the path as necessary

const SomeComponent = () => {
  const navigation = useNavigation<SomeComponentNavigationProp>(); // Use the defined type

  return (
    <Button onPress={() => navigation.navigate('SettingsScreen')}>
      Go to Settings
    </Button>
  );
};

export default SomeComponent; 