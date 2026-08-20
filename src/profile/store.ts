/**
 * The learner model — and the app's answer to the streak.
 *
 * A streak measures attendance. This measures *understanding*, per grammar
 * rule, and makes the gaps visible. The reason to open the app is not that a
 * number will reset overnight; it is that you can see which three rules are
 * still shaky and roughly how long closing them will take.
 *
 * Strength decays with time, so mastery has to be genuine rather than crammed —
 * but decay is framed as "needs a refresh", never as punishment or loss.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ALL_RULE_IDS, type RuleId } from '../grammar/rules';
import { EXERCISES } from '../content/exercises';
import type { Exercise } from '../grammar/types';

export type MasteryLevel = 'unseen' | 'shaky' | 'developing' | 'solid' | 'mastered';

export interface RuleStat {
  attempts: number;
  correct: number;
  /** Rolling window of recent outcomes, newest last. */
  recent: boolean[];
  /** Epoch ms of last practice, or 0. */
  lastSeen: number;
  /** 0..1 mastery before time decay is applied. */
  raw: number;
}

const EMPTY: RuleStat = {
  attempts: 0,
  correct: 0,
  recent: [],
  lastSeen: 0,
  raw: 0,
};

/** Days after which an untouched rule has decayed to roughly half strength. */
const HALF_LIFE_DAYS = 12;
const RECENT_WINDOW = 6;

export function decayedStrength(s: RuleStat, now = Date.now()): number {
  if (!s.attempts || !s.lastSeen) return 0;
  const days = (now - s.lastSeen) / 86_400_000;
  const factor = Math.pow(0.5, days / HALF_LIFE_DAYS);
  return s.raw * factor;
}

export function levelOf(strength: number, attempts: number): MasteryLevel {
  if (!attempts) return 'unseen';
  if (strength >= 0.9) return 'mastered';
  if (strength >= 0.7) return 'solid';
  if (strength >= 0.4) return 'developing';
  return 'shaky';
}

interface SessionResult {
  exerciseId: string;
  correct: boolean;
  /** Rules the learner actually violated this attempt. */
  violated: RuleId[];
  at: number;
}

interface ProfileState {
  stats: Record<RuleId, RuleStat>;
  history: SessionResult[];
  /** Exercise ids completed correctly at least once, for variety selection. */
  seen: string[];
  hydrated: boolean;

  record: (ex: Exercise, correct: boolean, violated: RuleId[]) => void;
  reset: () => void;
}

function emptyStats(): Record<RuleId, RuleStat> {
  return Object.fromEntries(ALL_RULE_IDS.map((id) => [id, { ...EMPTY }])) as Record<
    RuleId,
    RuleStat
  >;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      stats: emptyStats(),
      history: [],
      seen: [],
      hydrated: false,

      record: (ex, correct, violated) =>
        set((state) => {
          const now = Date.now();
          const stats = { ...state.stats };

          // Every rule the exercise targets gets credit or blame. A rule the
          // learner did not violate on a mixed exercise still counts as
          // evidence — they navigated it correctly.
          for (const ruleId of ex.targets) {
            const prev = stats[ruleId] ?? { ...EMPTY };
            const ok = correct || !violated.includes(ruleId);
            const recent = [...prev.recent, ok].slice(-RECENT_WINDOW);

            // Strength tracks the recent window, weighted toward newer
            // evidence, and starts from the decayed value rather than the
            // stale raw one so a long absence genuinely costs something.
            const base = decayedStrength(prev, now);
            const windowScore =
              recent.reduce((acc, r, i) => acc + (r ? i + 1 : 0), 0) /
              recent.reduce((acc, _, i) => acc + i + 1, 0);
            const raw = prev.attempts === 0 ? (ok ? 0.45 : 0.1) : base * 0.35 + windowScore * 0.65;

            stats[ruleId] = {
              attempts: prev.attempts + 1,
              correct: prev.correct + (ok ? 1 : 0),
              recent,
              lastSeen: now,
              raw: Math.max(0, Math.min(1, raw)),
            };
          }

          return {
            stats,
            history: [...state.history, { exerciseId: ex.id, correct, violated, at: now }].slice(
              -300,
            ),
            seen: correct && !state.seen.includes(ex.id) ? [...state.seen, ex.id] : state.seen,
          };
        }),

      reset: () => set({ stats: emptyStats(), history: [], seen: [] }),
    }),
    {
      name: 'skema-profile-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ stats: s.stats, history: s.history, seen: s.seen }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

// ── Derived selectors ─────────────────────────────────────────────────────

export interface RuleProgress {
  ruleId: RuleId;
  strength: number;
  level: MasteryLevel;
  attempts: number;
  lastSeen: number;
  /** True when this rule was solid but has decayed and wants a refresh. */
  needsRefresh: boolean;
}

export function ruleProgress(
  stats: Record<RuleId, RuleStat>,
  now = Date.now(),
): RuleProgress[] {
  return ALL_RULE_IDS.map((ruleId) => {
    const s = stats[ruleId] ?? EMPTY;
    const strength = decayedStrength(s, now);
    return {
      ruleId,
      strength,
      level: levelOf(strength, s.attempts),
      attempts: s.attempts,
      lastSeen: s.lastSeen,
      needsRefresh: s.raw >= 0.7 && strength < 0.7,
    };
  });
}

export interface MapSummary {
  solid: number;
  total: number;
  openGaps: RuleProgress[];
  refreshing: RuleProgress[];
}

export function summarize(stats: Record<RuleId, RuleStat>, now = Date.now()): MapSummary {
  const progress = ruleProgress(stats, now);
  return {
    solid: progress.filter((p) => p.level === 'solid' || p.level === 'mastered').length,
    total: progress.length,
    openGaps: progress
      .filter((p) => p.level === 'shaky' || p.level === 'developing')
      .sort((a, b) => a.strength - b.strength),
    refreshing: progress.filter((p) => p.needsRefresh),
  };
}

/**
 * Choose what to practise next.
 *
 * Priority order: an open gap the learner can see on their map, then a rule
 * that has decayed, then something genuinely new. Within a tier, prefer an
 * exercise they have not already answered correctly — repeating solved content
 * is the specific thing that makes daily practice feel hollow.
 */
export function nextExercise(
  stats: Record<RuleId, RuleStat>,
  seen: string[],
  lastExerciseId?: string,
  now = Date.now(),
): Exercise {
  const progress = ruleProgress(stats, now);
  const byRule = new Map(progress.map((p) => [p.ruleId, p]));

  const scored = EXERCISES.map((ex) => {
    const targets = ex.targets.map((r) => byRule.get(r)).filter(Boolean) as RuleProgress[];
    const weakest = targets.reduce(
      (min, p) => Math.min(min, p.attempts ? p.strength : 0.5),
      1,
    );
    const unseenBonus = targets.some((p) => p.attempts === 0) ? 0.25 : 0;
    const freshBonus = seen.includes(ex.id) ? 0 : 0.3;
    const repeatPenalty = ex.id === lastExerciseId ? -1 : 0;
    const jitter = Math.random() * 0.12;

    return {
      ex,
      score: (1 - weakest) + unseenBonus + freshBonus + repeatPenalty + jitter,
    };
  }).sort((a, b) => b.score - a.score);

  return scored[0].ex;
}
