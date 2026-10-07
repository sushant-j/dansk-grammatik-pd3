/**
 * One question on one rule, from whichever trainer owns that rule.
 *
 * The path asks about a fixed rule at a fixed niveau, where the trainers each
 * pick their own weakest rule; so stored items (word order, commas, spelling,
 * drills) are drawn here straight from their banks, and the generated families
 * (verbs, nouns, adjectives) are asked to build a question on that one rule.
 * Either way the answer is recorded through the trainer's own store, so a
 * path question counts towards mastery and niveau exactly like free practice.
 */

import { commaExamplesForRule } from '../content/commaExamples';
import { exercisesForRule } from '../content/exercises';
import { MAX_LEVEL, type Level } from '../content/levels';
import { spellingExamplesForRule } from '../content/spellingExamples';
import { buildCommaQuestion } from '../grammar/commaExercise';
import type { CommaRuleId } from '../grammar/commaRules';
import type { AdjectiveRuleId } from '../grammar/adjectiveRules';
import type { NounRuleId } from '../grammar/nounRules';
import { buildSpellingQuestion } from '../grammar/spellingExercise';
import type { SpellingRuleId } from '../grammar/spellingRules';
import type { Exercise } from '../grammar/types';
import type { VerbRuleId } from '../grammar/verbRules';
import { adjectiveQuestionLevel, nextAdjectiveQuestion, useAdjectiveProfile } from '../profile/adjectiveStore';
import { nextNounQuestion, useNounProfile } from '../profile/nounStore';
import { useCommaProfile } from '../profile/commaStore';
import { useSpellingProfile } from '../profile/spellingStore';
import { useProfile } from '../profile/store';
import { nextVerbQuestion, useVerbProfile } from '../profile/verbStore';
import { buildDrillQuestion } from '../drills/drillExercise';
import { useDrillProfile } from '../drills/drillStore';
import { drillDomain, isDrillDomainKey } from '../drills/registry';
import { indexedRule, type RuleFamily } from './ruleIndex';
import { LESSON_SIZE } from './session';

interface QuestionBase {
  /** The item asked: never asked twice in one session, and the key of its outcome in the path event. */
  itemId: string;
  ruleId: string;
  family: RuleFamily;
  level: Level;
  /** A question reviewing an earlier rule, not the one being learnt. */
  review: boolean;
}

/** Pick an option. Drill prompts carry a `___` gap; the others are a plain question. */
export interface ChoicePathQuestion extends QuestionBase {
  kind: 'choice';
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  explanationEn?: string;
  /** Log the answer with the owning trainer. */
  record: (correct: boolean) => void;
}

/** Build the sentence on the schema board. */
export interface SchemaPathQuestion extends QuestionBase {
  kind: 'schema';
  exercise: Exercise;
  record: (correct: boolean, violated: string[]) => void;
}

export type PathQuestion = ChoicePathQuestion | SchemaPathQuestion;

/**
 * The items to pick the next question from: unused ones at or below the
 * niveau, and only when those run out, unused ones a niveau higher, and so on
 * (a few rules have just six or seven items at their easiest niveau, and a
 * lesson should not repeat itself before it has to). When every item has been
 * used, the niveau's own items again.
 */
export function eligibleItems<T extends { id: string; level: Level }>(items: T[], level: Level, used: Set<string>): T[] {
  for (let cap = level; ; cap = (cap + 1) as Level) {
    const fresh = items.filter((i) => i.level <= cap && !used.has(i.id));
    if (fresh.length) return fresh;
    if (cap >= MAX_LEVEL) break;
  }
  const atLevel = items.filter((i) => i.level <= level);
  return atLevel.length ? atLevel : items;
}

/** The distinct items a lesson can draw on: the niveau's, widened upwards until there are a lesson's worth. */
function lessonPool<T extends { level: Level }>(items: T[], level: Level): T[] {
  let cap = level;
  let pool = items.filter((i) => i.level <= cap);
  while (pool.length < LESSON_SIZE && cap < MAX_LEVEL) {
    cap = (cap + 1) as Level;
    pool = items.filter((i) => i.level <= cap);
  }
  return pool;
}

/** How many different stored items a rule can serve at a niveau; null for generated families. */
export function storedItemCount(ruleId: string, level: Level): number | null {
  const rule = indexedRule(ruleId);
  if (!rule) return 0;
  const items = storedItems(rule.family, ruleId);
  return items ? lessonPool(items, level).length : null;
}

function storedItems(family: RuleFamily, ruleId: string): { id: string; level: Level }[] | null {
  switch (family) {
    case 'grammar':
      return exercisesForRule(ruleId);
    case 'comma':
      return commaExamplesForRule(ruleId as CommaRuleId);
    case 'spelling':
      return spellingExamplesForRule(ruleId as SpellingRuleId);
    case 'verbs':
    case 'nouns':
    case 'adjectives':
      return null;
    default:
      return isDrillDomainKey(family) ? drillDomain(family).items.filter((i) => i.ruleId === ruleId) : [];
  }
}

const pickOne = <T>(items: T[], rng: () => number): T => items[Math.floor(rng() * items.length)];

/**
 * A question on `ruleId` at or below `level`, avoiding items in `used`.
 * Null only for a rule with no items at all, which the curriculum test rules out.
 */
export function nextPathQuestion(
  ruleId: string,
  level: Level,
  used: Set<string>,
  review = false,
  rng: () => number = Math.random,
): PathQuestion | null {
  const rule = indexedRule(ruleId);
  if (!rule) return null;
  const family = rule.family;
  const base = { ruleId, family, review };

  switch (family) {
    case 'grammar': {
      const pool = eligibleItems(exercisesForRule(ruleId), level, used);
      if (!pool.length) return null;
      const exercise = pickOne(pool, rng);
      return {
        ...base,
        kind: 'schema',
        itemId: exercise.id,
        level: exercise.level,
        exercise,
        record: (correct, violated) => useProfile.getState().record(exercise, correct, violated as never),
      };
    }
    case 'comma': {
      const pool = eligibleItems(commaExamplesForRule(ruleId as CommaRuleId), level, used);
      if (!pool.length) return null;
      const entry = pickOne(pool, rng);
      const q = buildCommaQuestion(entry, rng);
      return {
        ...base,
        kind: 'choice',
        itemId: entry.id,
        level: entry.level,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        record: (correct) => useCommaProfile.getState().record(q.ruleId, correct, { id: entry.id, level: entry.level }),
      };
    }
    case 'spelling': {
      const pool = eligibleItems(spellingExamplesForRule(ruleId as SpellingRuleId), level, used);
      if (!pool.length) return null;
      const entry = pickOne(pool, rng);
      const q = buildSpellingQuestion(entry, rng);
      return {
        ...base,
        kind: 'choice',
        itemId: entry.id,
        level: entry.level,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        record: (correct) => useSpellingProfile.getState().record(q.ruleId, correct, { id: entry.id, level: entry.level }),
      };
    }
    case 'verbs': {
      // Generated from a large bank: a few tries are enough to avoid a repeat.
      let q = nextVerbQuestion(useVerbProfile.getState().stats, undefined, Date.now(), level, ruleId as VerbRuleId);
      for (let i = 0; i < 5 && used.has(q.verb.id); i++) {
        q = nextVerbQuestion(useVerbProfile.getState().stats, undefined, Date.now(), level, ruleId as VerbRuleId);
      }
      const { verb } = q;
      return {
        ...base,
        kind: 'choice',
        itemId: verb.id,
        level: verb.level,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        explanationEn: q.explanationEn,
        record: (correct) => useVerbProfile.getState().record(q.ruleId, correct, { id: verb.id, level: verb.level }),
      };
    }
    case 'nouns': {
      let q = nextNounQuestion(useNounProfile.getState().stats, undefined, Date.now(), level, ruleId as NounRuleId);
      for (let i = 0; i < 5 && used.has(q.noun.id); i++) {
        q = nextNounQuestion(useNounProfile.getState().stats, undefined, Date.now(), level, ruleId as NounRuleId);
      }
      const { noun } = q;
      return {
        ...base,
        kind: 'choice',
        itemId: noun.id,
        level: noun.level,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        explanationEn: q.explanationEn,
        record: (correct) => useNounProfile.getState().record(q.ruleId, correct, { id: noun.id, level: noun.level }),
      };
    }
    case 'adjectives': {
      let q = nextAdjectiveQuestion(useAdjectiveProfile.getState().stats, undefined, Date.now(), level, ruleId as AdjectiveRuleId);
      for (let i = 0; i < 5 && used.has(q.adjective.id); i++) {
        q = nextAdjectiveQuestion(useAdjectiveProfile.getState().stats, undefined, Date.now(), level, ruleId as AdjectiveRuleId);
      }
      const qLevel = adjectiveQuestionLevel(q);
      return {
        ...base,
        kind: 'choice',
        itemId: q.adjective.id,
        level: qLevel,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        explanationEn: q.explanationEn,
        record: (correct) => useAdjectiveProfile.getState().record(q.ruleId, correct, { id: q.adjective.id, level: qLevel }),
      };
    }
    default: {
      if (!isDrillDomainKey(family)) return null;
      const domain = drillDomain(family);
      const pool = eligibleItems(domain.items.filter((i) => i.ruleId === ruleId), level, used);
      if (!pool.length) return null;
      const item = pickOne(pool, rng);
      const q = buildDrillQuestion(item, rng);
      return {
        ...base,
        kind: 'choice',
        itemId: item.id,
        level: item.level,
        prompt: item.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: item.explanation,
        record: (correct) => useDrillProfile.getState().record(domain.key, item, correct),
      };
    }
  }
}
