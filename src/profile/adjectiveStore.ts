/**
 * Mastery for the adjective-agreement trainer — tracked per rule, same
 * reasoning as `nounStore.ts`: a learner shaky on the -t rule across ten
 * different adjectives has a gap in the rule, not in those ten words.
 */

import { create } from 'zustand';
import { ADJECTIVE_BANK } from '../content/adjectives';
import { NOUN_BANK } from '../content/nouns';
import { MAX_LEVEL, poolForLevel, type Level } from '../content/levels';
import {
  buildAdjectiveQuestion,
  type AdjectiveQuestion,
  type AdjectiveQuestionKind,
} from '../grammar/adjectiveExercise';
import { ALL_ADJECTIVE_RULE_IDS, type AdjectiveRuleId } from '../grammar/adjectiveRules';
import {
  EMPTY_STAT,
  progressFor,
  type ItemProgress,
  type ItemStat,
} from './mastery';
import { recordAnswer, recordReset } from '../sync/bus';

const KIND_FOR_RULE: Record<AdjectiveRuleId, AdjectiveQuestionKind> = {
  'adjective-common-form': 'common-form',
  'adjective-neuter-form': 'neuter-form',
  'adjective-e-form': 'e-form',
};

const EN_NOUNS = NOUN_BANK.filter((n) => n.gender === 'en');
const ET_NOUNS = NOUN_BANK.filter((n) => n.gender === 'et');

interface AdjectiveState {
  stats: Record<AdjectiveRuleId, ItemStat>;
  hydrated: boolean;
  /** `item` is what was answered: its id and niveau go into the log. */
  record: (ruleId: AdjectiveRuleId, correct: boolean, item: { id: string; level: Level }) => void;
  reset: () => void;
}

export function emptyStats(): Record<AdjectiveRuleId, ItemStat> {
  return Object.fromEntries(
    ALL_ADJECTIVE_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }]),
  ) as Record<AdjectiveRuleId, ItemStat>;
}

/**
 * Mastery per rule, derived from the progress log (sync/log.ts publishes it
 * here). `record` adds an answer to the log rather than editing stats, so
 * progress syncs and replays exactly.
 */
export const useAdjectiveProfile = create<AdjectiveState>()(() => ({
  stats: emptyStats(),
  hydrated: true,
  record: (ruleId, correct, item) =>
    recordAnswer({ domain: 'adjectives', itemId: item.id, level: item.level, outcomes: { [ruleId]: correct }, correct }),
  reset: () => recordReset('adjectives'),
}));

export type AdjectiveRuleProgress = ItemProgress<AdjectiveRuleId>;

export function adjectiveRuleProgress(
  stats: Record<AdjectiveRuleId, ItemStat>,
  now = Date.now(),
): AdjectiveRuleProgress[] {
  return ALL_ADJECTIVE_RULE_IDS.map((id) => progressFor(id, stats[id] ?? EMPTY_STAT, now));
}

export interface AdjectiveSummary {
  solid: number;
  total: number;
  weakest: AdjectiveRuleProgress;
}

export function summarizeAdjectives(
  stats: Record<AdjectiveRuleId, ItemStat>,
  now = Date.now(),
): AdjectiveSummary {
  const progress = adjectiveRuleProgress(stats, now);
  const weakest = [...progress].sort((a, b) => a.strength - b.strength)[0];
  return {
    solid: progress.filter((p) => p.level === 'solid' || p.level === 'mastered').length,
    total: progress.length,
    weakest,
  };
}

/**
 * Next question: bias toward the weakest rule, then a random adjective, then
 * a noun of whichever gender that rule's kind actually needs — a common-form
 * question is meaningless against an et-word, so the noun pool is filtered
 * per kind rather than drawn from the full bank.
 */
export function nextAdjectiveQuestion(
  stats: Record<AdjectiveRuleId, ItemStat>,
  lastAdjectiveId?: string,
  now = Date.now(),
  level: Level = MAX_LEVEL,
): AdjectiveQuestion {
  const progress = adjectiveRuleProgress(stats, now);

  const scoredRules = progress
    .map((p) => ({
      ruleId: p.id,
      score: (p.attempts ? 1 - p.strength : 0.55) + Math.random() * 0.2,
    }))
    .sort((a, b) => b.score - a.score);

  const ruleId = scoredRules[0].ruleId;
  const kind = KIND_FOR_RULE[ruleId];

  const adjPool = poolForLevel(ADJECTIVE_BANK, level);
  const adjCandidates = adjPool.filter((a) => a.id !== lastAdjectiveId);
  const adjective = adjCandidates[Math.floor(Math.random() * adjCandidates.length)] ?? adjPool[0];

  const nounPool = poolForLevel(
    kind === 'common-form' ? EN_NOUNS : kind === 'neuter-form' ? ET_NOUNS : NOUN_BANK,
    level,
  );
  const noun = nounPool[Math.floor(Math.random() * nounPool.length)];

  return buildAdjectiveQuestion(noun, adjective, kind);
}

/** A question is as hard as the harder of its two words. */
export function adjectiveQuestionLevel(q: AdjectiveQuestion): Level {
  return Math.max(q.adjective.level, q.noun.level) as Level;
}
