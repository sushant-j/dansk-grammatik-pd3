import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_400Regular_Italic,
  AtkinsonHyperlegibleNext_500Medium,
  AtkinsonHyperlegibleNext_600SemiBold,
  AtkinsonHyperlegibleNext_700Bold,
  AtkinsonHyperlegibleNext_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/atkinson-hyperlegible-next';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { buildTheme } from '../src/theme';
import { useSettings } from '../src/profile/settings';
import { Onboarding } from '../src/ui/Onboarding';
import { ThemeProvider, useResolvedMode } from '../src/ui/theme';
import { HeaderActions } from '../src/ui/ThemeToggle';

/**
 * Navigation shape: four tabs (Today, Practise, Exam, Progress) live in the
 * (tabs) group. Every trainer and detail screen is a sibling of that group in
 * this root Stack, so opening one pushes it full-screen *over* the tabs — the
 * tab bar steps aside while you practise, and Back returns you to the tab you
 * came from. Group folders don't change URLs: /progress, /exam and every
 * trainer route are the same paths as before.
 */
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_400Regular_Italic,
    AtkinsonHyperlegibleNext_500Medium,
    AtkinsonHyperlegibleNext_600SemiBold,
    AtkinsonHyperlegibleNext_700Bold,
    AtkinsonHyperlegibleNext_800ExtraBold,
  });
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const mode = useResolvedMode();
  const t = buildTheme(mode);

  // First-open welcome, gated here rather than inside the Today tab so the
  // tab bar can't be used to skip past it. `hydrated` keeps it from flashing
  // for a returning user before their settings have loaded.
  const hydrated = useSettings((s) => s.hydrated);
  const onboarded = useSettings((s) => s.onboarded);
  const setTargetExam = useSettings((s) => s.setTargetExam);
  const setOnboarded = useSettings((s) => s.setOnboarded);
  if (hydrated && !onboarded) {
    return (
      <>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Onboarding
          onPick={(exam) => {
            setTargetExam(exam);
            setOnboarded(true);
          }}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.c.bg },
          headerTintColor: t.c.text,
          headerTitleStyle: { fontFamily: t.fontFamily.bold },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: t.c.bg },
          headerRight: () => <HeaderActions settings={false} />,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="train" options={{ title: 'Word order' }} />
        <Stack.Screen name="write" options={{ title: 'Writing studio' }} />
        <Stack.Screen name="vocab" options={{ title: 'Vocabulary' }} />
        <Stack.Screen name="nouns" options={{ title: 'Gender: en / et' }} />
        <Stack.Screen name="adjectives" options={{ title: 'Adjective agreement' }} />
        <Stack.Screen name="verbs" options={{ title: 'Verb tenses' }} />
        <Stack.Screen name="comma" options={{ title: 'Comma rules' }} />
        <Stack.Screen name="spelling" options={{ title: 'Spelling' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="rule/[id]" options={{ title: 'Rule' }} />
        <Stack.Screen name="topics/index" options={{ title: 'Oral exam topics' }} />
        <Stack.Screen name="topics/[id]" options={{ title: 'Topic' }} />
        <Stack.Screen name="topics/practice" options={{ title: 'Practice topics' }} />
        <Stack.Screen name="topics/practice/[id]" options={{ title: 'Practice' }} />
      </Stack>
    </>
  );
}
