/**
 * The Supabase client: accounts, and the database that holds each account's
 * progress log.
 *
 * Both values are public by design (EXPO_PUBLIC_*, inlined at build time):
 * the publishable key only lets a signed-in user reach their *own* rows, which
 * row-level security on the server enforces (supabase/migrations). When they
 * are missing, the app says accounts are not configured instead of crashing.
 *
 * Sessions are kept in AsyncStorage — localStorage on web, native storage on
 * iOS/Android — the same storage the rest of the app already uses.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Must be written out as static `process.env.EXPO_PUBLIC_…` for Expo to inline them.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          // Native has no URL to read a session from; on web we don't use redirect-based sign-in either.
          detectSessionInUrl: false,
        },
      })
    : null;

// On native, only refresh the session while the app is in the foreground.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
