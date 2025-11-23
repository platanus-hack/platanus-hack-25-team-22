import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ElevenLabsProvider } from '@elevenlabs/react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
console.log("[_layout] Convex URL:", convexUrl);
const convex = new ConvexReactClient(convexUrl);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ElevenLabsProvider>
        <ConvexProvider client={convex}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="rescuer-map" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ConvexProvider>
      </ElevenLabsProvider>
    </GestureHandlerRootView>
  );
}
