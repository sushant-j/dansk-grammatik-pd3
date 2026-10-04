/**
 * Mastery for the spelling trainer — tracked per rule, same reasoning as
 * every other domain store: a learner shaky on silent-d words across several
 * sentences has a gap in that rule, not in those specific sentences.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { spellingExamplesForRule } from '../content/spellingExamples';
import { buildSpellingQuestion, type SpellingQuestion } from '../grammar/spellingExercise';
import { ALL_SPELLING_RULE_IDS, type SpellingRuleId } from '../grammar/spellingRules';
import {
  applyOutcome,
  EMPTY_STAT,
  progressFor,
  type ItemProgress,
  type ItemStat,
} from './mastery';
import { persistOptions } from './persistOptions';

interface SpellingState {
  stats: Record<SpellingRuleId, ItemStat>;
  hydrated: boolean;
  record: (ruleId: SpellingRuleId, correct: boolean) => void;
  reset: () => void;
}

function emptyStats(): Record<SpellingRuleId, ItemStat> {
  return Object.fromEntries(ALL_SPELLING_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    SpellingRuleId,
    ItemStat
  >;
}

export const useSpellingProfile = create<SpellingState>()(
  persist(
    (set) => ({
      stats: emptyStats(),
      hydrated: false,

      record: (ruleId, correct) =>
        set((state) => ({
          stats: {
            ...state.stats,
            [ruleId]: applyOutcome(state.stats[ruleId] ?? { ...EMPTY_STAT }, correct),
          },
        })),

      reset: () => set({ stats: emptyStats() }),
    }),
    persistOptions('skema-spelling-v1', (s: SpellingState) => ({ stats: s.stats })),
  ),
);

export type SpellingRuleProgress = ItemProgress<SpellingRuleId>;

export function spellingRuleProgress(
  stats: Record<SpellingRuleId, ItemStat>,
  now = Date.now(),
): SpellingRuleProgress[] {
  return ALL_SPELLING_RULE_IDS.map((id) => progressFor(id, stats[id] ?? EMPTY_STAT, now));
}

export interface SpellingSummary {
  solid: number;
  total: number;
  weakest: SpellingRuleProgress;
}

export function summarizeSpelling(
  stats: Record<SpellingRuleId, ItemStat>,
  now = Date.now(),
): SpellingSummary {
  const progress = spellingRuleProgress(stats, now);
  const weakest = [...progress].sort((a, b) => a.strength - b.strength)[0];
  return {
    solid: progress.filter((p) => p.level === 'solid' || p.level === 'mastered').length,
    total: progress.length,
    weakest,
  };
}

/**
 * Next question: bias toward the weakest rule, then a random sentence from
 * that rule's pool, avoiding the one just answered.
 */
export function nextSpellingQuestion(
  stats: Record<SpellingRuleId, ItemStat>,
  lastEntryId?: string,
  now = Date.now(),
): SpellingQuestion {
  const progress = spellingRuleProgress(stats, now);

  const scoredRules = progress
    .map((p) => ({
      ruleId: p.id,
      score: (p.attempts ? 1 - p.strength : 0.55) + Math.random() * 0.2,
    }))
    .sort((a, b) => b.score - a.score);

  const ruleId = scoredRules[0].ruleId;
  const pool = spellingExamplesForRule(ruleId);
  const candidates = pool.filter((e) => e.id !== lastEntryId);
  const entry = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];

  return buildSpellingQuestion(entry);
}
