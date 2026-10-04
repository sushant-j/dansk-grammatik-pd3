/**
 * Who is signed in, and what follows from it.
 *
 * Signing in points the progress log at that user's own saved copy, loads
 * their profile, and starts syncing. Signing out stops syncing and points the
 * log at nothing, so the next person on this device starts clean — their
 * progress lives in their account, not on the device.
 */

import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { switchAttemptUser } from '../exam/attemptStore';
import { startAttemptSync, stopAttemptSync, supabaseAttemptRemote } from '../exam/attemptSync';
import { useSettings } from '../profile/settings';
import { switchUser } from '../sync/log';
import { supabaseRemote } from '../sync/remote';
import { startSync, stopSync, syncNow } from '../sync/sync';
import { supabase } from './supabase';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'unconfigured';

interface SessionState {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
}

export const useSession = create<SessionState>()(() => ({
  status: supabase ? 'loading' : 'unconfigured',
  userId: null,
  email: null,
}));

let started = false;
let applying: Promise<void> = Promise.resolve();

/** Listen for the stored session and every later sign-in/out. Safe to call more than once. */
export function startAuth(): void {
  if (started || !supabase) return;
  started = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    // Supabase warns against awaiting its own calls inside this callback, so
    // the work is queued, in order, outside it.
    setTimeout(() => {
      applying = applying.then(() => applySession(session));
    }, 0);
  });
}

async function applySession(session: Session | null): Promise<void> {
  const userId = session?.user.id ?? null;
  const current = useSession.getState();
  if (current.status !== 'loading' && current.userId === userId) return; // e.g. a token refresh

  stopSync();
  stopAttemptSync();
  if (userId) {
    await switchUser(userId);
    await switchAttemptUser(userId);
    useSession.setState({ status: 'signedIn', userId, email: session?.user.email ?? null });
    if (supabase) {
      void startSync(supabaseRemote(supabase));
      startAttemptSync(supabaseAttemptRemote(supabase));
    }
  } else {
    await switchUser(null);
    await switchAttemptUser(null);
    // The exam focus and onboarding belong to the account; the theme stays with the device.
    useSettings.setState({ targetExam: null, examDate: null, onboarded: false });
    useSession.setState({ status: 'signedOut', userId: null, email: null });
  }
}

// ── Actions: each resolves to an error message for the learner, or null ─────

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match an account.';
  if (/already registered|already been registered/i.test(message)) return 'There is already an account with that email. Sign in instead.';
  if (/password should be at least/i.test(message)) return 'Choose a password of at least 6 characters.';
  if (/unable to validate email|invalid email/i.test(message)) return 'That doesn’t look like an email address.';
  if (/email not confirmed/i.test(message)) return 'Confirm your email address first, using the link we sent you.';
  if (/fetch|network/i.test(message)) return 'Can’t reach the server. Check your connection and try again.';
  return message;
}

const NOT_CONFIGURED = 'Accounts aren’t set up for this copy of the app yet.';

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? friendly(error.message) : null;
}

export async function signUp(email: string, password: string): Promise<string | null> {
  if (!supabase) return NOT_CONFIGURED;
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) return friendly(error.message);
  // With email confirmation switched on in Supabase, there is no session until the link is clicked.
  if (!data.session) return 'Check your email and click the link to confirm your account, then sign in.';
  return null;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  // Try to upload anything still queued first. It stays saved on this device either way.
  await syncNow().catch(() => {});
  await supabase.auth.signOut();
}

export async function changePassword(password: string): Promise<string | null> {
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.updateUser({ password });
  return error ? friendly(error.message) : null;
}
