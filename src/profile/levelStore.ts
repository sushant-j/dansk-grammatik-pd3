/**
 * Niveau progression, per practice domain.
 *
 * Mastery (`mastery.ts`) answers "which rule is shaky?"; this answers "how
 * hard should the material be?". A learner climbs one niveau at a time by
 * proving the current one: enough attempts *at* that niveau, with a high
 * enough hit rate over the most recent of them. Review items from lower
 * niveaus don't count toward the climb — getting easier material right says
 * nothing about readiness for harder material.
 *
 * `applyLevelOutcome` is a pure reducer so the same climb can later be
 * replayed from a synced attempt log and land on exactly the same niveau.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAX_LEVEL, startLevelFor, type Level } from '../content/levels';
import type { Exam } from '../grammar/rules';
import { persistOptions } from './persistOptions';
import { useSettings } from './settings';

export type LevelDomain = 'grammar' | 'nouns' | 'verbs' | 'adjectives' | 'comma' | 'spelling';

export const LEVEL_DOMAINS: LevelDomain[] = ['grammar', 'nouns', 'verbs', 'adjectives', 'comma', 'spelling'];

export const DOMAIN_LABELS: Record<LevelDomain, string> = {
  grammar: 'Word order',
  nouns: 'Gender: en / et',
  verbs: 'Verbs',
  adjectives: 'Adjectives',
  comma: 'Commas',
  spelling: 'Spelling',
};

/** Attempts at the current niveau needed before a climb, and the window the hit rate is measured over. */
export const LEVEL_UP_ATTEMPTS = 20;
export const LEVEL_UP_ACCURACY = 0.8;

export interface DomainLevel {
  /** null until the learner has a niveau of their own: falls back to the start niveau for their exam. */
  current: Level | null;
  /** Outcomes of attempts at `current`, newest last, capped at LEVEL_UP_ATTEMPTS. */
  recent: boolean[];
  /** Attempts at `current` since reaching it. */
  attempts: number;
}

export const EMPTY_DOMAIN_LEVEL: DomainLevel = { current: null, recent: [], attempts: 0 };

export function resolveLevel(d: DomainLevel | undefined, exam: Exam | null | undefined): Level {
  return d?.current ?? startLevelFor(exam);
}

/**
 * Fold one attempt into a domain's niveau. Returns the new state and whether
 * this attempt unlocked the next niveau.
 */
export function applyLevelOutcome(
  prev: DomainLevel,
  itemLevel: Level,
  correct: boolean,
  exam: Exam | null | undefined,
): { next: DomainLevel; unlocked: Level | null } {
  const current = resolveLevel(prev, exam);
  if (itemLevel !== current) return { next: { ...prev, current }, unlocked: null };

  const recent = [...prev.recent, correct].slice(-LEVEL_UP_ATTEMPTS);
  const attempts = prev.attempts + 1;
  const hitRate = recent.filter(Boolean).length / recent.length;

  if (current < MAX_LEVEL && attempts >= LEVEL_UP_ATTEMPTS && hitRate >= LEVEL_UP_ACCURACY) {
    const up = (current + 1) as Level;
    return { next: { current: up, recent: [], attempts: 0 }, unlocked: up };
  }
  return { next: { current, recent, attempts }, unlocked: null };
}

/** Progress toward the next niveau, 0..1: both the attempt count and the hit rate have to get there. */
export function climbProgress(d: DomainLevel): { attempts: number; hitRate: number; value: number } {
  const hitRate = d.recent.length ? d.recent.filter(Boolean).length / d.recent.length : 0;
  const value = Math.min(d.attempts / LEVEL_UP_ATTEMPTS, 1) * Math.min(hitRate / LEVEL_UP_ACCURACY, 1);
  return { attempts: d.attempts, hitRate, value };
}

interface LevelState {
  domains: Partial<Record<LevelDomain, DomainLevel>>;
  /** Set when an attempt unlocks a niveau, so the trainer can say so once. */
  justUnlocked: { domain: LevelDomain; level: Level } | null;
  hydrated: boolean;
  record: (domain: LevelDomain, itemLevel: Level, correct: boolean, exam: Exam | null) => void;
  /** Learner-chosen niveau (Settings). Resets the climb toward the next one. */
  setLevel: (domain: LevelDomain, level: Level) => void;
  dismissUnlock: () => void;
  reset: () => void;
}

export const useLevels = create<LevelState>()(
  persist(
    (set) => ({
      domains: {},
      justUnlocked: null,
      hydrated: false,

      record: (domain, itemLevel, correct, exam) =>
        set((state) => {
          const { next, unlocked } = applyLevelOutcome(
            state.domains[domain] ?? EMPTY_DOMAIN_LEVEL,
            itemLevel,
            correct,
            exam,
          );
          return {
            domains: { ...state.domains, [domain]: next },
            justUnlocked: unlocked ? { domain, level: unlocked } : state.justUnlocked,
          };
        }),

      setLevel: (domain, level) =>
        set((state) => ({
          domains: { ...state.domains, [domain]: { current: level, recent: [], attempts: 0 } },
        })),

      dismissUnlock: () => set({ justUnlocked: null }),

      reset: () => set({ domains: {}, justUnlocked: null }),
    }),
    persistOptions('skema-levels-v1', (s: LevelState) => ({ domains: s.domains })),
  ),
);

// ── Wiring for trainer screens ────────────────────────────────────────────

/** The learner's niveau in a domain, live. */
export function useCurrentLevel(domain: LevelDomain): Level {
  const d = useLevels((s) => s.domains[domain]);
  const exam = useSettings((s) => s.targetExam);
  return resolveLevel(d, exam);
}

/** Same, read once — for event handlers that pick the next question. */
export function currentLevelNow(domain: LevelDomain): Level {
  return resolveLevel(useLevels.getState().domains[domain], useSettings.getState().targetExam);
}

/** Count one answered item toward the domain's climb. */
export function recordLevelAttempt(domain: LevelDomain, itemLevel: Level, correct: boolean): void {
  useLevels.getState().record(domain, itemLevel, correct, useSettings.getState().targetExam);
}

/** Trainer route for each domain, for rows that link into practice. */
export const DOMAIN_ROUTES: Record<LevelDomain, string> = {
  grammar: '/train',
  nouns: '/nouns',
  verbs: '/verbs',
  adjectives: '/adjectives',
  comma: '/comma',
  spelling: '/spelling',
};
