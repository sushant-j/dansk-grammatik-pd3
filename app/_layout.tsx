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
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { buildTheme } from '../src/theme';
import { useSettings } from '../src/profile/settings';
import { startAuth, useSession } from '../src/auth/session';
import { useSyncStatus } from '../src/sync/sync';
import { Onboarding } from '../src/ui/Onboarding';
import { SignIn } from '../src/ui/SignIn';
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
/**
 * Screens that open with their own large heading. The header keeps only the
 * Back arrow and actions so the title isn't printed twice; `title` is kept
 * as the screen's name.
 */
const OWN_HEADING = { headerTitle: () => null };

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_400Regular_Italic,
    AtkinsonHyperlegibleNext_500Medium,
    AtkinsonHyperlegibleNext_600SemiBold,
    AtkinsonHyperlegibleNext_700Bold,
    AtkinsonHyperlegibleNext_800ExtraBold,
  });
  // Wait for the face, but never forever: if a font file fails to load, render
  // with the system font rather than leaving a blank screen.
  if (!fontsLoaded && !fontError) return null;

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

  const authStatus = useSession((s) => s.status);
  const profileReady = useSyncStatus((s) => s.profileReady);
  const hydrated = useSettings((s) => s.hydrated);
  const onboarded = useSettings((s) => s.onboarded);
  const setTargetExam = useSettings((s) => s.setTargetExam);
  const setOnboarded = useSettings((s) => s.setOnboarded);
  useEffect(() => startAuth(), []);

  // Sign-in gate first: progress belongs to an account. While the stored
  // session (and then the account's profile) loads, show a blank screen
  // rather than flashing the sign-in or welcome screens at a returning user.
  if (authStatus === 'loading' || (authStatus === 'signedIn' && !profileReady)) {
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.c.textMuted} />
      </View>
    );
  }
  if (authStatus !== 'signedIn') {
    return (
      <>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <SignIn />
      </>
    );
  }

  // First-open welcome, gated here rather than inside the Today tab so the
  // tab bar can't be used to skip past it. `hydrated` keeps it from flashing
  // for a returning user before their settings have loaded.
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
        <Stack.Screen name="vocab" options={{ title: 'Vocabulary', ...OWN_HEADING }} />
        <Stack.Screen name="nouns" options={{ title: 'Gender: en / et', ...OWN_HEADING }} />
        <Stack.Screen name="adjectives" options={{ title: 'Adjective agreement', ...OWN_HEADING }} />
        <Stack.Screen name="verbs" options={{ title: 'Verb tenses', ...OWN_HEADING }} />
        <Stack.Screen name="comma" options={{ title: 'Comma rules', ...OWN_HEADING }} />
        <Stack.Screen name="spelling" options={{ title: 'Spelling', ...OWN_HEADING }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="rule/[id]" options={{ title: 'Rule', ...OWN_HEADING }} />
        <Stack.Screen name="topics/index" options={{ title: 'Oral exam topics', ...OWN_HEADING }} />
        <Stack.Screen name="topics/[id]" options={{ title: 'Topic', ...OWN_HEADING }} />
        <Stack.Screen name="topics/practice" options={{ title: 'Practice topics', ...OWN_HEADING }} />
        <Stack.Screen name="topics/practice/[id]" options={{ title: 'Practice', ...OWN_HEADING }} />
        <Stack.Screen name="exam/papers" options={{ title: 'Reading papers', ...OWN_HEADING }} />
        <Stack.Screen name="exam/[paperId]/index" options={{ title: 'Paper', ...OWN_HEADING }} />
        <Stack.Screen name="exam/[paperId]/[part]" options={{ title: 'Reading', ...OWN_HEADING }} />
        <Stack.Screen name="exam/[paperId]/result" options={{ title: 'Result', ...OWN_HEADING }} />
      </Stack>
    </>
  );
}
