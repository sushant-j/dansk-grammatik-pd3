import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { buildTheme } from '../src/theme';
import { resolveThemeMode, useSettings } from '../src/profile/settings';
import { ThemeProvider } from '../src/ui/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const pref = useSettings((s) => s.themeMode);
  const mode = resolveThemeMode(pref, scheme);
  const t = buildTheme(mode);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
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
            <Stack.Screen name="train" options={{ title: 'Word order', headerBackTitle: 'Home' }} />
            <Stack.Screen name="write" options={{ title: 'Writing studio' }} />
            <Stack.Screen name="vocab" options={{ title: 'Vocabulary' }} />
            <Stack.Screen name="nouns" options={{ title: 'Gender (en/et)' }} />
            <Stack.Screen name="adjectives" options={{ title: 'Adjectives' }} />
            <Stack.Screen name="verbs" options={{ title: 'Verb tenses' }} />
            <Stack.Screen name="comma" options={{ title: 'Comma rules' }} />
            <Stack.Screen name="spelling" options={{ title: 'Spelling' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="progress" options={{ title: 'Progress' }} />
            <Stack.Screen name="exam" options={{ title: 'Exam guide' }} />
            <Stack.Screen name="rule/[id]" options={{ title: 'Rule' }} />
            <Stack.Screen name="topics/index" options={{ title: 'Topic archive' }} />
            <Stack.Screen name="topics/[id]" options={{ title: 'Topic', headerBackTitle: 'Archive' }} />
            <Stack.Screen name="topics/practice" options={{ title: 'Practice topics' }} />
            <Stack.Screen
              name="topics/practice/[id]"
              options={{ title: 'Practice', headerBackTitle: 'Practice' }}
            />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
