/**
 * Mastery for the en/et trainer — tracked per rule (gender, definite suffix,
 * double definiteness), exactly like the grammar map, not per individual
 * noun. A learner who has drilled fifteen different et-words and still gets
 * the suffix wrong has a gap in the *rule*, not in those fifteen words
 * specifically; tracking per-noun would fragment that signal across dozens of
 * near-empty stats instead of building one clear picture.
 */

import { create } from 'zustand';
import { NOUN_BANK } from '../content/nouns';
import { MAX_LEVEL, poolForLevel, type Level } from '../content/levels';
import { buildQuestion, type NounQuestion, type NounQuestionKind } from '../grammar/nounExercise';
import { ALL_NOUN_RULE_IDS, type NounRuleId } from '../grammar/nounRules';
import {
  EMPTY_STAT,
  progressFor,
  type ItemProgress,
  type ItemStat,
} from './mastery';
import { recordAnswer, recordReset } from '../sync/bus';

const KIND_FOR_RULE: Record<NounRuleId, NounQuestionKind> = {
  'en-et-gender': 'gender',
  'definite-suffix': 'definite-suffix',
  'double-definiteness': 'double-definite',
};

interface NounState {
  stats: Record<NounRuleId, ItemStat>;
  hydrated: boolean;
  /** `item` is what was answered: its id and niveau go into the log. */
  record: (ruleId: NounRuleId, correct: boolean, item: { id: string; level: Level }) => void;
  reset: () => void;
}

export function emptyStats(): Record<NounRuleId, ItemStat> {
  return Object.fromEntries(ALL_NOUN_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    NounRuleId,
    ItemStat
  >;
}

/**
 * Mastery per rule, derived from the progress log (sync/log.ts publishes it
 * here). `record` adds an answer to the log rather than editing stats, so
 * progress syncs and replays exactly.
 */
export const useNounProfile = create<NounState>()(() => ({
  stats: emptyStats(),
  hydrated: true,
  record: (ruleId, correct, item) =>
    recordAnswer({ domain: 'nouns', itemId: item.id, level: item.level, outcomes: { [ruleId]: correct }, correct }),
  reset: () => recordReset('nouns'),
}));

export type NounRuleProgress = ItemProgress<NounRuleId>;

export function nounRuleProgress(
  stats: Record<NounRuleId, ItemStat>,
  now = Date.now(),
): NounRuleProgress[] {
  return ALL_NOUN_RULE_IDS.map((id) => progressFor(id, stats[id] ?? EMPTY_STAT, now));
}

export interface NounSummary {
  solid: number;
  total: number;
  weakest: NounRuleProgress;
}

export function summarizeNouns(stats: Record<NounRuleId, ItemStat>, now = Date.now()): NounSummary {
  const progress = nounRuleProgress(stats, now);
  const weakest = [...progress].sort((a, b) => a.strength - b.strength)[0];
  return {
    solid: progress.filter((p) => p.level === 'solid' || p.level === 'mastered').length,
    total: progress.length,
    weakest,
  };
}

/**
 * Next question: bias toward the weakest rule, then a random noun for that
 * rule that isn't the one just answered — variety within a rule matters here
 * because the whole point is to generalise "et-words take -et" across many
 * words, not memorise one flashcard's answer.
 */
export function nextNounQuestion(
  stats: Record<NounRuleId, ItemStat>,
  lastNounId?: string,
  now = Date.now(),
  level: Level = MAX_LEVEL,
): NounQuestion {
  const progress = nounRuleProgress(stats, now);

  const scoredRules = progress
    .map((p) => ({
      ruleId: p.id,
      score: (p.attempts ? 1 - p.strength : 0.55) + Math.random() * 0.2,
    }))
    .sort((a, b) => b.score - a.score);

  const ruleId = scoredRules[0].ruleId;
  const kind = KIND_FOR_RULE[ruleId];

  const pool = poolForLevel(NOUN_BANK, level);
  const candidates = pool.filter((n) => n.id !== lastNounId);
  const noun = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];

  return buildQuestion(noun, kind);
}
