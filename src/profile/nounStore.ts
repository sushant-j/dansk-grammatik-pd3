/**
 * Mastery for the en/et trainer — tracked per rule (gender, definite suffix,
 * double definiteness), exactly like the grammar map, not per individual
 * noun. A learner who has drilled fifteen different et-words and still gets
 * the suffix wrong has a gap in the *rule*, not in those fifteen words
 * specifically; tracking per-noun would fragment that signal across dozens of
 * near-empty stats instead of building one clear picture.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { NOUN_BANK } from '../content/nouns';
import { buildQuestion, type NounQuestion, type NounQuestionKind } from '../grammar/nounExercise';
import { ALL_NOUN_RULE_IDS, type NounRuleId } from '../grammar/nounRules';
import {
  applyOutcome,
  EMPTY_STAT,
  progressFor,
  type ItemProgress,
  type ItemStat,
} from './mastery';

const KIND_FOR_RULE: Record<NounRuleId, NounQuestionKind> = {
  'en-et-gender': 'gender',
  'definite-suffix': 'definite-suffix',
  'double-definiteness': 'double-definite',
};

interface NounState {
  stats: Record<NounRuleId, ItemStat>;
  hydrated: boolean;
  record: (ruleId: NounRuleId, correct: boolean) => void;
  reset: () => void;
}

function emptyStats(): Record<NounRuleId, ItemStat> {
  return Object.fromEntries(ALL_NOUN_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    NounRuleId,
    ItemStat
  >;
}

export const useNounProfile = create<NounState>()(
  persist(
    (set) => ({
      stats: emptyStats(),
      hydrated: false,

      record: (ruleId, correct) =>
        set((state) => ({
          stats: { ...state.stats, [ruleId]: applyOutcome(state.stats[ruleId] ?? { ...EMPTY_STAT }, correct) },
        })),

      reset: () => set({ stats: emptyStats() }),
    }),
    {
      name: 'skema-nouns-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ stats: s.stats }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

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

  const candidates = NOUN_BANK.filter((n) => n.id !== lastNounId);
  const noun = candidates[Math.floor(Math.random() * candidates.length)] ?? NOUN_BANK[0];

  return buildQuestion(noun, kind);
}
