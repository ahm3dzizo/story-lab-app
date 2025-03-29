import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Chat',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="gemini"
        options={{
          title: 'Gemini AI Chat',
          headerShown: false
        }}
      />
    </Stack>
  );
}

// Define segment configuration for the chat layout
export const unstable_settings = {
  initialRouteName: 'index',
}; 