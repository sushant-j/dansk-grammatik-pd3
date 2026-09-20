/**
 * Daily-activity tracking — the raw material for the streak on the progress
 * page. Every domain's mastery is already persisted per item, but a streak
 * needs the *history of which days had any practice at all*, which nothing
 * else records (per-item `lastSeen` is overwritten). So this store keeps a
 * set of active days, and `markToday` is pinged whenever the learner answers
 * anything.
 *
 * The streak maths is a pure function (computeStreak) so it can be tested
 * without React or storage, and so the UI and any future logic share one
 * definition of "current streak".
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { shiftIso, todayIso } from './settings';

/** How many recent active days to retain; a year is plenty for any streak. */
const MAX_DAYS = 400;

interface ActivityState {
  /** ISO 'YYYY-MM-DD' days with at least one practice attempt, ascending. */
  activeDays: string[];
  hydrated: boolean;
  /** Record that the learner practised today (idempotent within a day). */
  markToday: (now?: Date) => void;
  reset: () => void;
}

export const useActivity = create<ActivityState>()(
  persist(
    (set) => ({
      activeDays: [],
      hydrated: false,
      markToday: (now = new Date()) =>
        set((state) => {
          const today = todayIso(now);
          if (state.activeDays.includes(today)) return state;
          const next = [...state.activeDays, today].sort().slice(-MAX_DAYS);
          return { activeDays: next };
        }),
      reset: () => set({ activeDays: [] }),
    }),
    {
      name: 'skema-activity-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ activeDays: s.activeDays }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export interface StreakInfo {
  /** Consecutive active days ending today (or yesterday if not active today). */
  current: number;
  /** Longest consecutive run anywhere in the history. */
  longest: number;
  /** Whether today has been practised. */
  activeToday: boolean;
  /** Total distinct days ever practised. */
  totalDays: number;
}

/**
 * Compute streaks from a set of active ISO days.
 *
 * The current streak counts back from today while days are consecutive. Not
 * having practised *today yet* does not break the streak — it counts back
 * from yesterday — so opening the app mid-morning never shows a scary 0; the
 * streak only breaks once a full day is missed.
 */
export function computeStreak(activeDays: string[], now = new Date()): StreakInfo {
  const set = new Set(activeDays);
  const today = todayIso(now);
  const activeToday = set.has(today);
  const totalDays = set.size;

  // Current: walk backwards from today (or yesterday) over consecutive days.
  let current = 0;
  let cursor = activeToday ? today : shiftIso(today, -1);
  while (set.has(cursor)) {
    current += 1;
    cursor = shiftIso(cursor, -1);
  }

  // Longest: scan the sorted days for the longest consecutive run.
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev !== null && shiftIso(prev, 1) === day ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = day;
  }

  return { current, longest, activeToday, totalDays };
}
