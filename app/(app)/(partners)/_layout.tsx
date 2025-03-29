import { Stack } from 'expo-router';
import { usePathname } from 'expo-router';

export default function PartnersLayout() {
  const pathname = usePathname();
  console.log('Current pathname:', pathname); // Add logging to debug
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: {
          backgroundColor: '#fff',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Partners',
          headerShown: pathname === '/partners' || pathname === '/partners/',
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Partner',
          presentation: 'modal',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Partner Profile',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="distribution"
        options={{
          title: 'Profit Distribution',
          headerShown: true,
        }}
      />
    </Stack>
  );
} 