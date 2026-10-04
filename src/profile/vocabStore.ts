/**
 * Vocabulary mastery — the flashcard side of the same anti-streak model used
 * for grammar rules. See `mastery.ts` for why the two share math: a word you
 * memorised three weeks ago and haven't touched since should read as "needs a
 * refresh", not silently vanish from view and not count toward a mastered
 * total it no longer deserves.
 */

import { create } from 'zustand';
import { VOCABULARY } from '../content/vocabulary';
import {
  EMPTY_STAT,
  progressFor,
  type ItemProgress,
  type ItemStat,
} from './mastery';
import { recordAnswer, recordReset } from '../sync/bus';

interface VocabState {
  stats: Record<string, ItemStat>;
  hydrated: boolean;

  /** Learner self-grades recall after flipping the card: knew it or not. */
  record: (wordId: string, knewIt: boolean) => void;
  reset: () => void;
}

/** Word mastery, derived from the progress log like every other domain (see sync/log.ts). */
export const useVocabProfile = create<VocabState>()(() => ({
  stats: {},
  hydrated: true,
  record: (wordId, knewIt) =>
    recordAnswer({ domain: 'vocab', itemId: wordId, level: null, outcomes: { [wordId]: knewIt }, correct: knewIt }),
  reset: () => recordReset('vocab'),
}));

export type VocabProgress = ItemProgress<string>;

export function vocabProgress(
  stats: Record<string, ItemStat>,
  now = Date.now(),
): VocabProgress[] {
  return VOCABULARY.map((v) => progressFor(v.id, stats[v.id] ?? EMPTY_STAT, now));
}

export interface VocabSummary {
  mastered: number;
  total: number;
  dueForReview: VocabProgress[];
}

export function summarizeVocab(
  stats: Record<string, ItemStat>,
  now = Date.now(),
): VocabSummary {
  const progress = vocabProgress(stats, now);
  return {
    mastered: progress.filter((p) => p.level === 'mastered').length,
    total: progress.length,
    // "Due" mirrors spaced repetition: never seen, weak, or decayed back down —
    // anything that is not currently solid.
    dueForReview: progress
      .filter((p) => p.level !== 'solid' && p.level !== 'mastered')
      .sort((a, b) => a.strength - b.strength),
  };
}

/**
 * Next word to review: weakest-first among what's due, with a bias toward
 * words never seen at all so the deck doesn't stall on day one, and never the
 * card just answered.
 */
export function nextWord(
  stats: Record<string, ItemStat>,
  lastWordId?: string,
  now = Date.now(),
): (typeof VOCABULARY)[number] {
  const progress = new Map(vocabProgress(stats, now).map((p) => [p.id, p]));

  const scored = VOCABULARY.map((v) => {
    const p = progress.get(v.id)!;
    const weakness = p.attempts ? 1 - p.strength : 0.6;
    const unseenBonus = p.attempts === 0 ? 0.3 : 0;
    const repeatPenalty = v.id === lastWordId ? -1 : 0;
    const jitter = Math.random() * 0.15;
    return { v, score: weakness + unseenBonus + repeatPenalty + jitter };
  }).sort((a, b) => b.score - a.score);

  return scored[0].v;
}
