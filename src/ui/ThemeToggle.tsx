import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { toggledThemeMode, useSettings } from '../profile/settings';
import { useResolvedMode, useTheme } from './theme';

/**
 * One-tap light/dark switch for the header, so flipping themes doesn't mean a
 * trip to Settings. It writes the same persisted `themeMode` the Settings
 * screen does; picking "System" there hands control back to the OS.
 */
export function ThemeToggle() {
  const t = useTheme();
  const mode = useResolvedMode();
  const setThemeMode = useSettings((s) => s.setThemeMode);
  const next = mode === 'dark' ? 'light' : 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${next} mode`}
      hitSlop={8}
      onPress={() => setThemeMode(toggledThemeMode(mode))}
      style={{ padding: t.space(1.5) }}
    >
      <Ionicons name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={21} color={t.c.text} />
    </Pressable>
  );
}

/** Header actions on the tab screens: theme switch, then Settings. */
export function HeaderActions({ settings = true }: { settings?: boolean }) {
  const t = useTheme();
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space(1), paddingRight: t.space(2) }}>
      <ThemeToggle />
      {settings ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          onPress={() => router.push('/settings')}
          style={{ padding: t.space(1.5) }}
        >
          <Ionicons name="settings-outline" size={21} color={t.c.text} />
        </Pressable>
      ) : null}
    </View>
  );
}
