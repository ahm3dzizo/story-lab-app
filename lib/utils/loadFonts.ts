import { useFonts } from 'expo-font';
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Ionicons,
  FontAwesome,
} from '@expo/vector-icons';

export function useAppFonts() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
    ...MaterialIcons.font,
    ...Ionicons.font,
    ...FontAwesome.font,
  });

  return fontsLoaded;
} 