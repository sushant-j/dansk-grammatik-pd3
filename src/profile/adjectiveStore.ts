/**
 * Mastery for the adjective-agreement trainer — tracked per rule, same
 * reasoning as `nounStore.ts`: a learner shaky on the -t rule across ten
 * different adjectives has a gap in the rule, not in those ten words.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ADJECTIVE_BANK } from '../content/adjectives';
import { NOUN_BANK } from '../content/nouns';
import {
  buildAdjectiveQuestion,
  type AdjectiveQuestion,
  type AdjectiveQuestionKind,
} from '../grammar/adjectiveExercise';
import { ALL_ADJECTIVE_RULE_IDS, type AdjectiveRuleId } from '../grammar/adjectiveRules';
import {
  applyOutcome,
  EMPTY_STAT,
  progressFor,
  type ItemProgress,
  type ItemStat,
} from './mastery';

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
  record: (ruleId: AdjectiveRuleId, correct: boolean) => void;
  reset: () => void;
}

function emptyStats(): Record<AdjectiveRuleId, ItemStat> {
  return Object.fromEntries(
    ALL_ADJECTIVE_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }]),
  ) as Record<AdjectiveRuleId, ItemStat>;
}

export const useAdjectiveProfile = create<AdjectiveState>()(
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
    {
      name: 'skema-adjectives-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ stats: s.stats }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

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

  const adjCandidates = ADJECTIVE_BANK.filter((a) => a.id !== lastAdjectiveId);
  const adjective = adjCandidates[Math.floor(Math.random() * adjCandidates.length)] ?? ADJECTIVE_BANK[0];

  const nounPool = kind === 'common-form' ? EN_NOUNS : kind === 'neuter-form' ? ET_NOUNS : NOUN_BANK;
  const noun = nounPool[Math.floor(Math.random() * nounPool.length)];

  return buildAdjectiveQuestion(noun, adjective, kind);
}
