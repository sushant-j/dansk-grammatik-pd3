/**
 * The learner's target exam — a lightweight preference, not a mastery
 * domain of its own.
 *
 * Setting it never hides anything: every rule, rule card, and exercise stays
 * fully visible and practiceable regardless of level, matching the app's
 * refusal everywhere else to make content disappear on you (a decayed rule
 * "needs a refresh", it doesn't vanish from the map). What this preference
 * changes is emphasis — the grammar map sorts exam-relevant rules first, and
 * the schema trainer leans toward exercises tagged for that exam when
 * choosing what to serve next. `null` means no preference, and is the
 * default: existing behaviour for anyone who never opens this screen.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Exam } from '../grammar/rules';
import { persistOptions } from './persistOptions';

/** How the app chooses light vs dark. 'system' follows the OS setting. */
export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  targetExam: Exam | null;
  /** Exam day as 'YYYY-MM-DD', or null when unset. Drives the study plan. */
  examDate: string | null;
  /** Light/dark preference; 'system' defers to the OS. */
  themeMode: ThemeMode;
  /**
   * Whether the first-open welcome has been completed. Persisted, so a shared
   * newcomer sees the "which exam?" prompt once and never again — while a
   * returning user is never interrupted by it.
   */
  onboarded: boolean;
  /** True once persisted state has loaded; gates the welcome so it never
   *  flashes before we know whether the user has onboarded already. */
  hydrated: boolean;
  setTargetExam: (exam: Exam | null) => void;
  setExamDate: (date: string | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setOnboarded: (done: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      targetExam: null,
      examDate: null,
      themeMode: 'system',
      onboarded: false,
      hydrated: false,
      setTargetExam: (exam) => set({ targetExam: exam }),
      setExamDate: (date) => set({ examDate: date }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setOnboarded: (done) => set({ onboarded: done }),
    }),
    persistOptions('skema-settings-v1', (s: SettingsState) => ({
      targetExam: s.targetExam,
      examDate: s.examDate,
      themeMode: s.themeMode,
      onboarded: s.onboarded,
    })),
  ),
);

/**
 * Resolve the concrete light/dark mode from the preference + OS scheme.
 * `systemScheme` is typed loosely because RN's useColorScheme can return
 * values beyond light/dark (null, undefined, 'unspecified'); anything that is
 * not explicitly 'dark' falls back to light.
 */
export function resolveThemeMode(
  pref: ThemeMode,
  systemScheme: string | null | undefined,
): 'light' | 'dark' {
  if (pref === 'light' || pref === 'dark') return pref;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

/**
 * The preference a one-tap toggle should set: the opposite of what is on
 * screen right now. Takes the *resolved* mode, so tapping while on 'system'
 * always visibly flips the UI (and pins an explicit choice from then on).
 */
export function toggledThemeMode(current: 'light' | 'dark'): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}

/** Format an ISO 'YYYY-MM-DD' as a short human date, e.g. "18 Sep 2026". */
export function formatExamDate(iso: string): string {
  return dateFromIso(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Today as 'YYYY-MM-DD' in local time. */
export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** A Date as 'YYYY-MM-DD', read from its local date parts (never UTC). */
export function isoFromDate(d: Date): string {
  return todayIso(d);
}

/**
 * Parse 'YYYY-MM-DD' into a Date at local midnight. Built from the parts
 * rather than parsed as a string, so no engine can read it as UTC and land on
 * the previous day for anyone west of Greenwich.
 */
export function dateFromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Earliest day the date picker offers: today, or the stored date if that has
 * already passed — so a past exam still shows as itself rather than being
 * clamped to today the moment the picker opens. ISO strings sort as dates.
 */
export function pickerMinIso(value: string | null, today = todayIso()): string {
  return value && value < today ? value : today;
}

/**
 * Whether a typed date is a real, plausible exam day. The web date input
 * reports every keystroke while a year is being typed ("0002-06-01"), and
 * each would otherwise be stored and synced.
 */
export function isPlausibleExamIso(iso: string, min: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || iso < min) return false;
  const d = dateFromIso(iso);
  return isoFromDate(d) === iso && d.getFullYear() < 2100;
}

/** Shift an ISO date by whole days, returning a new ISO date. */
export function shiftIso(iso: string, days: number): string {
  const d = dateFromIso(iso);
  d.setDate(d.getDate() + days);
  return todayIso(d);
}

/**
 * Whole days from now until an ISO exam date, at day granularity (the time of
 * day is ignored, so "the exam is today" reads as 0). Negative once past.
 * Matches the study planner's own day maths so the two never disagree.
 *
 * Both days are compared as UTC calendar dates: a span across a DST change
 * holds a 23- or 25-hour local day, which would knock a millisecond diff of
 * local midnights off by one.
 */
export function daysUntil(iso: string, now = Date.now()): number {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(now);
  const exam = Date.UTC(y, m - 1, d);
  const today = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((exam - today) / 86_400_000);
}

export const EXAM_LABELS: Record<Exam, string> = {
  PD1: 'PD1',
  PD2: 'PD2',
  PD3: 'PD3',
  FVU: 'FVU',
};

export const EXAM_DESCRIPTIONS: Record<Exam, string> = {
  PD1: 'A1 — beginning literacy and everyday phrases.',
  PD2: 'B1 (speaking B1+) — everyday and workplace Danish: reading, a semi-formal text plus a 100-word e-mail, and a paired oral exam.',
  PD3: 'B2 — argumentative writing (200-word essay), complex sentences, and an oral exam on social topics.',
  FVU: 'FVU-dansk, levels 1–4 — reading, spelling and writing for adults, including native speakers. Pass/fail written tests. Your main practice here is the spelling trainer; on the word-order map only the two most basic sentence rules are tagged FVU.',
};
