/**
 * Question builder for the spelling trainer.
 *
 * Same shape as commaExercise.ts: no generation, just packaging one
 * hand-written entry into the shared Question interface. See
 * `spellingExamples.ts` for why — a spelling confusion is tied to a specific
 * sentence and a specific real-word pair, not a property that can be derived
 * from a small reusable entry the way gender or verb class can.
 */

import type { SpellingEntry } from '../content/spellingExamples';
import type { SpellingRuleId } from './spellingRules';

export interface SpellingQuestion {
  ruleId: SpellingRuleId;
  entry: SpellingEntry;
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

export function buildSpellingQuestion(
  entry: SpellingEntry,
  rng: () => number = Math.random,
): SpellingQuestion {
  const options = shuffle([entry.correct, entry.incorrect], rng);
  return {
    ruleId: entry.ruleId,
    entry,
    prompt: entry.prompt,
    options,
    correctIndex: options.indexOf(entry.correct),
    explanation: entry.explanation,
  };
}
