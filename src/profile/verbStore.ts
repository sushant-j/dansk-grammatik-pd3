/**
 * Mastery for the tense trainer — tracked per rule, same reasoning as
 * `nounStore.ts` and `adjectiveStore.ts`: a learner shaky on strong verbs
 * across ten different words has a gap in strong-verb recall, not in those
 * ten words specifically.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VERB_BANK } from '../content/verbs';
import { MAX_LEVEL, poolForLevel, type Level } from '../content/levels';
import { buildVerbQuestion, type VerbQuestion, type VerbQuestionKind } from '../grammar/verbExercise';
import { ALL_VERB_RULE_IDS, type VerbRuleId } from '../grammar/verbRules';
import {
  applyOutcome,
  EMPTY_STAT,
  progressFor,
  type ItemProgress,
  type ItemStat,
} from './mastery';
import { persistOptions } from './persistOptions';

const KIND_FOR_RULE: Record<VerbRuleId, VerbQuestionKind> = {
  'weak-suffix-choice': 'weak-suffix',
  'strong-verb-forms': 'strong-form',
  'perfect-auxiliary': 'perfect-aux',
};

const WEAK_VERBS = VERB_BANK.filter((v) => v.verbClass !== 'strong');
const STRONG_VERBS = VERB_BANK.filter((v) => v.verbClass === 'strong');

interface VerbState {
  stats: Record<VerbRuleId, ItemStat>;
  hydrated: boolean;
  record: (ruleId: VerbRuleId, correct: boolean) => void;
  reset: () => void;
}

function emptyStats(): Record<VerbRuleId, ItemStat> {
  return Object.fromEntries(ALL_VERB_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    VerbRuleId,
    ItemStat
  >;
}

export const useVerbProfile = create<VerbState>()(
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
    persistOptions('skema-verbs-v1', (s: VerbState) => ({ stats: s.stats })),
  ),
);

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
 * than drawn from the full bank. perfect-aux draws from every verb, since
 * that fact cuts across weak and strong alike.
 */
export function nextVerbQuestion(
  stats: Record<VerbRuleId, ItemStat>,
  lastVerbId?: string,
  now = Date.now(),
  level: Level = MAX_LEVEL,
): VerbQuestion {
  const progress = verbRuleProgress(stats, now);

  const scoredRules = progress
    .map((p) => ({
      ruleId: p.id,
      score: (p.attempts ? 1 - p.strength : 0.55) + Math.random() * 0.2,
    }))
    .sort((a, b) => b.score - a.score);

  const ruleId = scoredRules[0].ruleId;
  const kind = KIND_FOR_RULE[ruleId];

  const pool = poolForLevel(
    kind === 'weak-suffix' ? WEAK_VERBS : kind === 'strong-form' ? STRONG_VERBS : VERB_BANK,
    level,
  );
  const candidates = pool.filter((v) => v.id !== lastVerbId);
  const verb = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];

  return buildVerbQuestion(verb, kind);
}
