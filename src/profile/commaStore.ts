/**
 * Mastery for the comma trainer — tracked per rule, same reasoning as every
 * other domain store: a learner shaky on list commas across several
 * sentences has a gap in that rule, not in those specific sentences.
 */

import { create } from 'zustand';
import { commaExamplesForRule } from '../content/commaExamples';
import { MAX_LEVEL, poolForLevel, type Level } from '../content/levels';
import { buildCommaQuestion, type CommaQuestion } from '../grammar/commaExercise';
import { ALL_COMMA_RULE_IDS, type CommaRuleId } from '../grammar/commaRules';
import {
  EMPTY_STAT,
  progressFor,
  type ItemProgress,
  type ItemStat,
} from './mastery';
import { recordAnswer, recordReset } from '../sync/bus';

interface CommaState {
  stats: Record<CommaRuleId, ItemStat>;
  hydrated: boolean;
  /** `item` is what was answered: its id and niveau go into the log. */
  record: (ruleId: CommaRuleId, correct: boolean, item: { id: string; level: Level }) => void;
  reset: () => void;
}

export function emptyStats(): Record<CommaRuleId, ItemStat> {
  return Object.fromEntries(ALL_COMMA_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    CommaRuleId,
    ItemStat
  >;
}

/**
 * Mastery per rule, derived from the progress log (sync/log.ts publishes it
 * here). `record` adds an answer to the log rather than editing stats, so
 * progress syncs and replays exactly.
 */
export const useCommaProfile = create<CommaState>()(() => ({
  stats: emptyStats(),
  hydrated: true,
  record: (ruleId, correct, item) =>
    recordAnswer({ domain: 'comma', itemId: item.id, level: item.level, outcomes: { [ruleId]: correct }, correct }),
  reset: () => recordReset('comma'),
}));

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
  level: Level = MAX_LEVEL,
): CommaQuestion {
  const progress = commaRuleProgress(stats, now);

  const scoredRules = progress
    .map((p) => ({
      ruleId: p.id,
      score: (p.attempts ? 1 - p.strength : 0.55) + Math.random() * 0.2,
    }))
    .sort((a, b) => b.score - a.score);

  const ruleId = scoredRules[0].ruleId;
  const pool = poolForLevel(commaExamplesForRule(ruleId), level);
  const candidates = pool.filter((e) => e.id !== lastEntryId);
  const entry = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];

  return buildCommaQuestion(entry);
}
