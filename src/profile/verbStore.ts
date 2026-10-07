/**
 * Mastery for the tense trainer — tracked per rule, same reasoning as
 * `nounStore.ts` and `adjectiveStore.ts`: a learner shaky on strong verbs
 * across ten different words has a gap in strong-verb recall, not in those
 * ten words specifically.
 */

import { create } from 'zustand';
import { VERB_BANK } from '../content/verbs';
import { MAX_LEVEL, poolForLevel, type Level } from '../content/levels';
import { buildVerbQuestion, type VerbQuestion, type VerbQuestionKind } from '../grammar/verbExercise';
import { ALL_VERB_RULE_IDS, type VerbRuleId } from '../grammar/verbRules';
import {
  EMPTY_STAT,
  progressFor,
  type ItemProgress,
  type ItemStat,
} from './mastery';
import { recordAnswer, recordReset } from '../sync/bus';

const KIND_FOR_RULE: Record<VerbRuleId, VerbQuestionKind> = {
  'weak-suffix-choice': 'weak-suffix',
  'strong-verb-forms': 'strong-form',
  'perfect-auxiliary': 'perfect-aux',
};

const WEAK_VERBS = VERB_BANK.filter((v) => v.verbClass !== 'strong');
const STRONG_VERBS = VERB_BANK.filter((v) => v.verbClass === 'strong');
/** The auxiliary drill has one right answer, so verbs that take either are left out of it. */
const ONE_AUX_VERBS = VERB_BANK.filter((v) => v.perfectAux !== 'both');

interface VerbState {
  stats: Record<VerbRuleId, ItemStat>;
  hydrated: boolean;
  /** `item` is what was answered: its id and niveau go into the log. */
  record: (ruleId: VerbRuleId, correct: boolean, item: { id: string; level: Level }) => void;
  reset: () => void;
}

export function emptyStats(): Record<VerbRuleId, ItemStat> {
  return Object.fromEntries(ALL_VERB_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    VerbRuleId,
    ItemStat
  >;
}

/**
 * Mastery per rule, derived from the progress log (sync/log.ts publishes it
 * here). `record` adds an answer to the log rather than editing stats, so
 * progress syncs and replays exactly.
 */
export const useVerbProfile = create<VerbState>()(() => ({
  stats: emptyStats(),
  hydrated: true,
  record: (ruleId, correct, item) =>
    recordAnswer({ domain: 'verbs', itemId: item.id, level: item.level, outcomes: { [ruleId]: correct }, correct }),
  reset: () => recordReset('verbs'),
}));

export type VerbRuleProgress = ItemProgress<VerbRuleId>;

export function verbRuleProgress(
  stats: Record<VerbRuleId, ItemStat>,
  now = Date.now(),
): VerbRuleProgress[] {
  return ALL_VERB_RULE_IDS.map((id) => progressFor(id, stats[id] ?? EMPTY_STAT, now));
}

export interface VerbSummary {
  solid: number;
  total: number;
  weakest: VerbRuleProgress;
}

export function summarizeVerbs(stats: Record<VerbRuleId, ItemStat>, now = Date.now()): VerbSummary {
  const progress = verbRuleProgress(stats, now);
  const weakest = [...progress].sort((a, b) => a.strength - b.strength)[0];
  return {
    solid: progress.filter((p) => p.level === 'solid' || p.level === 'mastered').length,
    total: progress.length,
    weakest,
  };
}

/**
 * Next question: bias toward the weakest rule, then a random verb drawn from
 * whichever pool that rule's kind actually needs — weak-suffix questions are
 * meaningless against a strong verb, so the pool is filtered per kind rather
 * than drawn from the full bank. perfect-aux draws from every verb that takes
 * one auxiliary only, since that fact cuts across weak and strong alike.
 */
export function nextVerbQuestion(
  stats: Record<VerbRuleId, ItemStat>,
  lastVerbId?: string,
  now = Date.now(),
  level: Level = MAX_LEVEL,
  /** Ask about this rule rather than the weakest one (the grammar path does). */
  onlyRule?: VerbRuleId,
): VerbQuestion {
  const progress = verbRuleProgress(stats, now);

  const scoredRules = progress
    .map((p) => ({
      ruleId: p.id,
      score: (p.attempts ? 1 - p.strength : 0.55) + Math.random() * 0.2,
    }))
    .sort((a, b) => b.score - a.score);

  const ruleId = onlyRule ?? scoredRules[0].ruleId;
  const kind = KIND_FOR_RULE[ruleId];

  const pool = poolForLevel(
    kind === 'weak-suffix' ? WEAK_VERBS : kind === 'strong-form' ? STRONG_VERBS : ONE_AUX_VERBS,
    level,
  );
  const candidates = pool.filter((v) => v.id !== lastVerbId);
  const verb = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];

  return buildVerbQuestion(verb, kind);
}
