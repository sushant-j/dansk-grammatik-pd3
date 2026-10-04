/**
 * The learner model — and the app's answer to the streak.
 *
 * A streak measures attendance. This measures *understanding*, per grammar
 * rule, and makes the gaps visible. The reason to open the app is not that a
 * number will reset overnight; it is that you can see which three rules are
 * still shaky and roughly how long closing them will take.
 *
 * Strength decays with time, so mastery has to be genuine rather than crammed —
 * but decay is framed as "needs a refresh", never as punishment or loss.
 *
 * The decay/leveling math itself lives in `mastery.ts`, shared with the
 * vocabulary flashcard store — grammar and vocabulary are different domains
 * but the same anti-streak idea, and they should behave identically.
 */

import { create } from 'zustand';
import { ALL_RULE_IDS, type Exam, type RuleId } from '../grammar/rules';
import { EXERCISES } from '../content/exercises';
import { MAX_LEVEL, poolForLevel, type Level } from '../content/levels';
import type { Exercise } from '../grammar/types';
import {
  decayedStrength,
  EMPTY_STAT,
  levelOf,
  progressFor,
  type ItemStat,
  type MasteryLevel,
} from './mastery';
import { recordAnswer, recordReset } from '../sync/bus';

export type { MasteryLevel };
export type RuleStat = ItemStat;
export { decayedStrength, levelOf };

export interface SessionResult {
  exerciseId: string;
  correct: boolean;
  /** Rules the learner actually violated this attempt. */
  violated: RuleId[];
  at: number;
}

interface ProfileState {
  stats: Record<RuleId, RuleStat>;
  history: SessionResult[];
  /** Exercise ids completed correctly at least once, for variety selection. */
  seen: string[];
  hydrated: boolean;

  record: (ex: Exercise, correct: boolean, violated: RuleId[]) => void;
  reset: () => void;
}

export function emptyStats(): Record<RuleId, RuleStat> {
  return Object.fromEntries(ALL_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    RuleId,
    RuleStat
  >;
}

/**
 * Grammar mastery, derived from the progress log (sync/log.ts publishes it
 * here). `record` adds the answer to the log; the stats, `seen` and `history`
 * come back from replaying it.
 */
export const useProfile = create<ProfileState>()(() => ({
  stats: emptyStats(),
  history: [],
  seen: [],
  hydrated: true,

  record: (ex, correct, violated) =>
    recordAnswer({
      domain: 'grammar',
      itemId: ex.id,
      level: ex.level,
      // Every rule the exercise targets gets credit or blame. A rule the
      // learner did not violate on a mixed exercise still counts as
      // evidence — they navigated it correctly.
      outcomes: Object.fromEntries(ex.targets.map((ruleId) => [ruleId, correct || !violated.includes(ruleId)])),
      correct,
      violated,
    }),

  reset: () => recordReset('grammar'),
}));

// ── Derived selectors ─────────────────────────────────────────────────────

export interface RuleProgress {
  ruleId: RuleId;
  strength: number;
  level: MasteryLevel;
  attempts: number;
  lastSeen: number;
  /** True when this rule was solid but has decayed and wants a refresh. */
  needsRefresh: boolean;
}

export function ruleProgress(
  stats: Record<RuleId, RuleStat>,
  now = Date.now(),
): RuleProgress[] {
  return ALL_RULE_IDS.map((ruleId) => {
    const p = progressFor(ruleId, stats[ruleId] ?? EMPTY_STAT, now);
    return { ...p, ruleId: p.id };
  });
}

export interface MapSummary {
  solid: number;
  total: number;
  openGaps: RuleProgress[];
  refreshing: RuleProgress[];
}

export function summarize(stats: Record<RuleId, RuleStat>, now = Date.now()): MapSummary {
  const progress = ruleProgress(stats, now);
  return {
    solid: progress.filter((p) => p.level === 'solid' || p.level === 'mastered').length,
    total: progress.length,
    openGaps: progress
      .filter((p) => p.level === 'shaky' || p.level === 'developing')
      .sort((a, b) => a.strength - b.strength),
    refreshing: progress.filter((p) => p.needsRefresh),
  };
}

/**
 * Choose what to practise next.
 *
 * Priority order: an open gap the learner can see on their map, then a rule
 * that has decayed, then something genuinely new. Within a tier, prefer an
 * exercise they have not already answered correctly — repeating solved content
 * is the specific thing that makes daily practice feel hollow.
 *
 * `targetExam` is a bias, not a filter: an exercise outside the selected exam
 * can still win if it targets a rule the learner is genuinely weaker on. A
 * rule you are shaky on is worth practising regardless of which exam tagged
 * the sentence — the exam tag breaks ties, it does not override mastery.
 */
export function nextExercise(
  stats: Record<RuleId, RuleStat>,
  seen: string[],
  lastExerciseId?: string,
  now = Date.now(),
  targetExam?: Exam | null,
  level: Level = MAX_LEVEL,
): Exercise {
  const progress = ruleProgress(stats, now);
  const byRule = new Map(progress.map((p) => [p.ruleId, p]));

  const scored = poolForLevel(EXERCISES, level).map((ex) => {
    const targets = ex.targets.map((r) => byRule.get(r)).filter(Boolean) as RuleProgress[];
    const weakest = targets.reduce(
      (min, p) => Math.min(min, p.attempts ? p.strength : 0.5),
      1,
    );
    const unseenBonus = targets.some((p) => p.attempts === 0) ? 0.25 : 0;
    const freshBonus = seen.includes(ex.id) ? 0 : 0.3;
    const repeatPenalty = ex.id === lastExerciseId ? -1 : 0;
    const examBonus = targetExam && ex.exams.includes(targetExam) ? 0.2 : 0;
    const jitter = Math.random() * 0.12;

    return {
      ex,
      score: (1 - weakest) + unseenBonus + freshBonus + repeatPenalty + examBonus + jitter,
    };
  }).sort((a, b) => b.score - a.score);

  return scored[0].ex;
}
