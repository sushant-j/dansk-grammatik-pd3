/**
 * Question builder for the comma trainer.
 *
 * No generation happens here — unlike nounExercise/adjectiveExercise/
 * verbExercise, a comma decision cannot be derived from a small property of
 * one word, so `commaExamples.ts` already holds full correct/incorrect
 * sentence pairs. This just packages one entry into the same Question shape
 * the trainer screens expect, for a consistent UI across every domain.
 */

import type { CommaEntry } from '../content/commaExamples';
import type { CommaRuleId } from './commaRules';

export interface CommaQuestion {
  ruleId: CommaRuleId;
  entry: CommaEntry;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildCommaQuestion(entry: CommaEntry, rng: () => number = Math.random): CommaQuestion {
  const options = shuffle([entry.correct, entry.incorrect], rng);
  return {
    ruleId: entry.ruleId,
    entry,
    prompt: 'Vælg den korrekt kommaterede sætning:',
    options,
    correctIndex: options.indexOf(entry.correct),
    explanation: entry.explanation,
  };
}
