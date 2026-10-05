/**
 * Question generator for the adjective-agreement trainer.
 *
 * Same shape as `nounExercise.ts`: multiple choice, and every distractor is a
 * real form of the same adjective, never an arbitrary wrong answer, so
 * picking one and reading why is the lesson.
 *
 * Options are built by deduping the adjective's three forms against whichever
 * one is correct, rather than hard-coding "always three options". Two of the
 * fourteen adjectives ("dansk", "lille") have base === tForm by design — real
 * irregularities, not data bugs — and deduping means those still produce a
 * clean two-option question instead of two visually identical buttons.
 */

import type { AdjectiveEntry } from '../content/adjectives';
import type { NounEntry } from '../content/nouns';
import type { AdjectiveRuleId } from './adjectiveRules';

export type AdjectiveQuestionKind = 'common-form' | 'neuter-form' | 'e-form';

export interface AdjectiveQuestion {
  kind: AdjectiveQuestionKind;
  ruleId: AdjectiveRuleId;
  adjective: AdjectiveEntry;
  noun: NounEntry;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** The same explanation in English, for a learner the Danish one doesn't reach yet. */
  explanationEn: string;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function optionsFor(adj: AdjectiveEntry, correct: string, rng: () => number): string[] {
  const candidates = [adj.base, adj.tForm, adj.eForm].filter((f) => f !== correct);
  const unique = [...new Set(candidates)];
  return shuffle([correct, ...unique], rng);
}

export function buildAdjectiveQuestion(
  noun: NounEntry,
  adjective: AdjectiveEntry,
  kind: AdjectiveQuestionKind,
  rng: () => number = Math.random,
): AdjectiveQuestion {
  if (kind === 'common-form') {
    const options = optionsFor(adjective, adjective.base, rng);
    return {
      kind,
      ruleId: 'adjective-common-form',
      adjective,
      noun,
      prompt: `Vælg den rigtige form: "a ${adjective.glossEn} ${noun.glossEn}" — en ___ ${noun.word}.`,
      options,
      correctIndex: options.indexOf(adjective.base),
      explanation: `"${noun.word}" er et en-ord i ubestemt form, så adjektivet står i grundform: "en ${adjective.base} ${noun.word}".`,
      explanationEn: `"${noun.word}" (${noun.glossEn}) is an en-word, and the phrase is indefinite ("a …"), so the adjective takes its base form with no ending: "en ${adjective.base} ${noun.word}".`,
    };
  }

  if (kind === 'neuter-form') {
    const options = optionsFor(adjective, adjective.tForm, rng);
    return {
      kind,
      ruleId: 'adjective-neuter-form',
      adjective,
      noun,
      prompt: `Vælg den rigtige form: "a ${adjective.glossEn} ${noun.glossEn}" — et ___ ${noun.word}.`,
      options,
      correctIndex: options.indexOf(adjective.tForm),
      explanation: adjective.irregularNote
        ? `"${noun.word}" er et et-ord, men "${adjective.base}" er uregelmæssigt: ${adjective.irregularNote}`
        : `"${noun.word}" er et et-ord i ubestemt form, så adjektivet får et t: "et ${adjective.tForm} ${noun.word}".`,
      explanationEn: adjective.irregularNote
        ? `"${noun.word}" (${noun.glossEn}) is an et-word, which normally adds -t to the adjective — but "${adjective.base}" is irregular: ${adjective.irregularNote}`
        : `"${noun.word}" (${noun.glossEn}) is an et-word, and the phrase is indefinite ("a …"), so the adjective adds -t: "et ${adjective.tForm} ${noun.word}".`,
    };
  }

  // e-form — always the definite phrase, den/det tracking the noun's own
  // gender even though the adjective ending no longer does.
  const article = noun.gender === 'en' ? 'den' : 'det';
  const options = optionsFor(adjective, adjective.eForm, rng);
  return {
    kind,
    ruleId: 'adjective-e-form',
    adjective,
    noun,
    prompt: `Vælg den rigtige form: "the ${adjective.glossEn} ${noun.glossEn}" — ${article} ___ ${noun.word}.`,
    options,
    correctIndex: options.indexOf(adjective.eForm),
    explanation: `I bestemt form bruges altid e-formen, uanset køn: "${article} ${adjective.eForm} ${noun.word}" — aldrig grundformen eller t-formen her.`,
    explanationEn: `In a definite phrase ("the …", here "${article}") the adjective always takes its -e form, whatever the noun's gender: "${article} ${adjective.eForm} ${noun.word}" — never the base form or the t-form.`,
  };
}
