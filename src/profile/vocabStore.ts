/**
 * Vocabulary mastery — the flashcard side of the same anti-streak model used
 * for grammar rules. See `mastery.ts` for why the two share math: a word you
 * memorised three weeks ago and haven't touched since should read as "needs a
 * refresh", not silently vanish from view and not count toward a mastered
 * total it no longer deserves.
 */

import { create } from 'zustand';
import { MAX_LEVEL, poolForLevel, type Level } from '../content/levels';
import { VOCABULARY, vocabById, type VocabCategory, type VocabEntry } from '../content/vocabulary';
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
    recordAnswer({
      domain: 'vocab',
      itemId: wordId,
      level: vocabById(wordId)?.level ?? null,
      outcomes: { [wordId]: knewIt },
      correct: knewIt,
    }),
  reset: () => recordReset('vocab'),
}));

export type VocabProgress = ItemProgress<string>;

export function vocabProgress(
  stats: Record<string, ItemStat>,
  now = Date.now(),
  level: Level = MAX_LEVEL,
): VocabProgress[] {
  // The deck is the words up to the learner's niveau — plus any word they have
  // already practised, so progress never disappears from view.
  return VOCABULARY.filter((v) => v.level <= level || stats[v.id]?.attempts).map((v) =>
    progressFor(v.id, stats[v.id] ?? EMPTY_STAT, now),
  );
}

export interface VocabSummary {
  mastered: number;
  total: number;
  dueForReview: VocabProgress[];
}

export function summarizeVocab(
  stats: Record<string, ItemStat>,
  now = Date.now(),
  level: Level = MAX_LEVEL,
): VocabSummary {
  const progress = vocabProgress(stats, now, level);
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

/** The word types a session can draw from — every category the deck actually uses. */
export const SESSION_CATEGORIES: VocabCategory[] = ['noun', 'verb', 'adjective', 'connector'];

export interface NextWordOptions {
  /** Draw only from these word types; empty or omitted means all of them. */
  categories?: readonly VocabCategory[];
  /** Ids already served this session — skipped until the filtered deck runs dry. */
  exclude?: ReadonlySet<string>;
  /**
   * Ignore the niveau: draw from every level, weakest-first with no bias
   * toward any one level — for drilling a whole word type, e.g. before the exam.
   */
  allLevels?: boolean;
}

/**
 * How many words of each type a learner at `level` can be served — the same
 * set `nextWord` draws from, counted without its random niveau split.
 */
export function countByCategory(level: Level = MAX_LEVEL): Record<VocabCategory, number> {
  const counts: Record<VocabCategory, number> = { connector: 0, noun: 0, verb: 0, adjective: 0, phrase: 0 };
  for (const v of VOCABULARY) if (v.level <= level) counts[v.category]++;
  return counts;
}

/**
 * Next word to review: weakest-first among what's due, with a bias toward
 * words never seen at all so the deck doesn't stall on day one, and never the
 * card just answered.
 *
 * A session narrows the deck to its chosen word types and passes the ids it
 * has already shown, so a round of 20 is 20 different words; only once every
 * word of those types at this niveau has been seen do repeats come back.
 */
export function nextWord(
  stats: Record<string, ItemStat>,
  lastWordId?: string,
  now = Date.now(),
  level: Level = MAX_LEVEL,
  { categories, exclude, allLevels }: NextWordOptions = {},
): VocabEntry {
  if (allLevels) level = MAX_LEVEL;
  // Filter before the niveau split, so the split never sees an empty pool:
  // the chosen types at or below the niveau, then minus what's been shown.
  const ofType = categories?.length ? VOCABULARY.filter((v) => categories.includes(v.category)) : VOCABULARY;
  const deck = ofType.some((v) => v.level <= level) ? ofType : VOCABULARY;
  const eligible = deck.filter((v) => v.level <= level);
  const fresh = exclude?.size ? eligible.filter((v) => !exclude.has(v.id)) : eligible;
  const candidates = fresh.length ? fresh : eligible.length ? eligible : deck;
  // The niveau split favours the learner's own level; with every level open
  // there's no level to favour, so weakness alone decides.
  const pool = allLevels ? candidates : poolForLevel(candidates, level);
  const scored = pool.map((v) => {
    const p = progressFor(v.id, stats[v.id] ?? EMPTY_STAT, now);
    const weakness = p.attempts ? 1 - p.strength : 0.6;
    const unseenBonus = p.attempts === 0 ? 0.3 : 0;
    const repeatPenalty = v.id === lastWordId ? -1 : 0;
    const jitter = Math.random() * 0.15;
    return { v, score: weakness + unseenBonus + repeatPenalty + jitter };
  }).sort((a, b) => b.score - a.score);

  return scored[0].v;
}
