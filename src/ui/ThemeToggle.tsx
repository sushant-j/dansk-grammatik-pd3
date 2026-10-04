import React from 'react';
import { Pressable, Text } from 'react-native';
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
      hitSlop={10}
      onPress={() => setThemeMode(toggledThemeMode(mode))}
      style={{ paddingHorizontal: t.space(2) }}
    >
      {/* ︎ forces the text (non-emoji) glyph so it takes the header tint. */}
      <Text style={{ fontSize: 20, color: t.c.text }}>{mode === 'dark' ? '☀︎' : '☾︎'}</Text>
    </Pressable>
  );
}
