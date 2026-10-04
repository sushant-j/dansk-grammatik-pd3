/**
 * The five-step niveau scale every exercise sits on, from first sentences to
 * PD3.
 *
 * CEFR alone is too coarse for this: PD2 and PD3 are both "B-something", and
 * the step that actually matters to a learner here — from passing PD2 to being
 * ready for PD3 — would vanish inside one letter. So the scale names the exam
 * it leads to, and keeps CEFR alongside for orientation.
 *
 * Named "niveau" in the UI on purpose: "level" in this codebase already means
 * a rule's mastery (shaky → mastered, see `profile/mastery.ts`), and the two
 * must never be confused on screen.
 */

import type { Exam } from '../grammar/rules';

export type Level = 1 | 2 | 3 | 4 | 5;
export type Cefr = 'A1' | 'A2' | 'B1' | 'B1+' | 'B2';

export const ALL_LEVELS: Level[] = [1, 2, 3, 4, 5];
export const MAX_LEVEL: Level = 5;

export interface LevelInfo {
  level: Level;
  name: string;
  cefr: Cefr;
  /** The exam this niveau prepares for, when one applies. */
  exam?: string;
}

export const LEVELS: Record<Level, LevelInfo> = {
  1: { level: 1, name: 'Begynder', cefr: 'A1' },
  2: { level: 2, name: 'Let øvet', cefr: 'A2' },
  3: { level: 3, name: 'Mellem', cefr: 'B1', exam: 'PD2 · FVU' },
  4: { level: 4, name: 'Øvet', cefr: 'B1+', exam: 'PD2+' },
  5: { level: 5, name: 'PD3', cefr: 'B2', exam: 'PD3' },
};

/** Short badge text: "Niveau 3 · B1". */
export function niveauLabel(level: Level): string {
  return `Niveau ${level} · ${LEVELS[level].cefr}`;
}

export function isLevel(value: unknown): value is Level {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

/**
 * Where a learner starts, from the exam they picked at onboarding. A PD3
 * candidate already has A2 behind them; making them grind level 1 first
 * would be the fastest way to lose them.
 */
export function startLevelFor(exam: Exam | null | undefined): Level {
  if (exam === 'PD3') return 3;
  if (exam === 'PD2' || exam === 'FVU') return 2;
  return 1;
}

/** Share of picks drawn from the learner's current niveau; the rest review lower ones. */
export const CURRENT_LEVEL_SHARE = 0.7;

/**
 * Narrow a pool to what a learner at `current` should see next.
 *
 * Never serves anything above `current`. About 70% of the time it returns the
 * items at exactly `current`; otherwise the lower ones, for review. If one
 * side is empty the other is used, and if a pool has nothing at or below
 * `current` at all (a rule whose easiest item is harder than the learner), its
 * easiest items are returned rather than nothing — an empty pool would crash
 * the trainer, and a slightly-too-hard item beats no exercise.
 */
export function poolForLevel<T extends { level: Level }>(
  pool: T[],
  current: Level,
  rand: () => number = Math.random,
): T[] {
  const eligible = pool.filter((item) => item.level <= current);
  if (eligible.length === 0) {
    const easiest = Math.min(...pool.map((item) => item.level));
    return pool.filter((item) => item.level === easiest);
  }
  const atLevel = eligible.filter((item) => item.level === current);
  const below = eligible.filter((item) => item.level < current);
  if (atLevel.length === 0) return below;
  if (below.length === 0) return atLevel;
  return rand() < CURRENT_LEVEL_SHARE ? atLevel : below;
}
