import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { buildTheme } from '../src/theme';
import { ThemeProvider } from '../src/ui/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const t = buildTheme(scheme === 'dark' ? 'dark' : 'light');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: t.c.bg },
              headerTintColor: t.c.text,
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: t.c.bg },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Skema' }} />
            <Stack.Screen name="train" options={{ title: 'Sætningsskema', headerBackTitle: 'Map' }} />
            <Stack.Screen name="write" options={{ title: 'Writing studio' }} />
            <Stack.Screen name="rule/[id]" options={{ title: 'Rule' }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
