import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme, type Theme } from '../theme';
import { resolveThemeMode, useSettings } from '../profile/settings';

const ThemeCtx = createContext<Theme>(buildTheme('light'));

/**
 * Resolve the active light/dark mode from the user's preference and the OS
 * scheme. Shared by the ThemeProvider and the root layout (which needs the
 * same answer for the status bar and header) so they never diverge.
 */
export function useResolvedMode(): 'light' | 'dark' {
  const scheme = useColorScheme();
  const pref = useSettings((s) => s.themeMode);
  return resolveThemeMode(pref, scheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useResolvedMode();
  const theme = useMemo(() => buildTheme(mode), [mode]);
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeCtx);
}
