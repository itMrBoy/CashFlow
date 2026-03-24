import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDB } from '../lib/db';
import "../global.css";

export default function RootLayout() {
  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(modals)/add-record" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="(modals)/add-subscription" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="(modals)/filter-sheet" options={{ presentation: 'formSheet', headerShown: false }} />
        <Stack.Screen name="(modals)/period-selector" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
