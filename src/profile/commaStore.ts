/**
 * Mastery for the comma trainer — tracked per rule, same reasoning as every
 * other domain store: a learner shaky on list commas across several
 * sentences has a gap in that rule, not in those specific sentences.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { commaExamplesForRule } from '../content/commaExamples';
import { buildCommaQuestion, type CommaQuestion } from '../grammar/commaExercise';
import { ALL_COMMA_RULE_IDS, type CommaRuleId } from '../grammar/commaRules';
import {
  applyOutcome,
  EMPTY_STAT,
  progressFor,
  type ItemProgress,
  type ItemStat,
} from './mastery';
import { persistOptions } from './persistOptions';

interface CommaState {
  stats: Record<CommaRuleId, ItemStat>;
  hydrated: boolean;
  record: (ruleId: CommaRuleId, correct: boolean) => void;
  reset: () => void;
}

function emptyStats(): Record<CommaRuleId, ItemStat> {
  return Object.fromEntries(ALL_COMMA_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    CommaRuleId,
    ItemStat
  >;
}

export const useCommaProfile = create<CommaState>()(
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
    persistOptions('skema-comma-v1', (s: CommaState) => ({ stats: s.stats })),
  ),
);

export type CommaRuleProgress = ItemProgress<CommaRuleId>;

export function commaRuleProgress(
  stats: Record<CommaRuleId, ItemStat>,
  now = Date.now(),
): CommaRuleProgress[] {
  return ALL_COMMA_RULE_IDS.map((id) => progressFor(id, stats[id] ?? EMPTY_STAT, now));
}

export interface CommaSummary {
  solid: number;
  total: number;
  weakest: CommaRuleProgress;
}

export function summarizeComma(stats: Record<CommaRuleId, ItemStat>, now = Date.now()): CommaSummary {
  const progress = commaRuleProgress(stats, now);
  const weakest = [...progress].sort((a, b) => a.strength - b.strength)[0];
  return {
    solid: progress.filter((p) => p.level === 'solid' || p.level === 'mastered').length,
    total: progress.length,
    weakest,
  };
}

/**
 * Next question: bias toward the weakest rule, then a random sentence pair
 * from that rule's pool, avoiding the one just answered.
 */
export function nextCommaQuestion(
  stats: Record<CommaRuleId, ItemStat>,
  lastEntryId?: string,
  now = Date.now(),
): CommaQuestion {
  const progress = commaRuleProgress(stats, now);

  const scoredRules = progress
    .map((p) => ({
      ruleId: p.id,
      score: (p.attempts ? 1 - p.strength : 0.55) + Math.random() * 0.2,
    }))
    .sort((a, b) => b.score - a.score);

  const ruleId = scoredRules[0].ruleId;
  const pool = commaExamplesForRule(ruleId);
  const candidates = pool.filter((e) => e.id !== lastEntryId);
  const entry = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];

  return buildCommaQuestion(entry);
}
