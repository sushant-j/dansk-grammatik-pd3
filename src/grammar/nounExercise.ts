/**
 * Question generator for the en/et trainer.
 *
 * Multiple-choice, not tap-to-place: this domain isn't about arranging tokens
 * in a slot, it's "which of these forms is actually a word" — and the
 * distractor IS the lesson, not a random wrong answer. Every wrong option
 * here is the specific mistake this noun invites (the opposite gender's
 * suffix, the double-marked definite), so picking the wrong one and reading
 * why is itself the explanation.
 */

import type { NounEntry } from '../content/nouns';
import type { NounRuleId } from './nounRules';

export type NounQuestionKind = 'gender' | 'definite-suffix' | 'double-definite';

export interface NounQuestion {
  kind: NounQuestionKind;
  ruleId: NounRuleId;
  noun: NounEntry;
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Shown after the learner answers, whatever they picked. */
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

export function buildQuestion(
  noun: NounEntry,
  kind: NounQuestionKind,
  rng: () => number = Math.random,
): NounQuestion {
  if (kind === 'gender') {
    const options = shuffle(['en', 'et'], rng);
    return {
      kind,
      ruleId: 'en-et-gender',
      noun,
      prompt: `${capitalize(noun.word)} — en-ord eller et-ord?`,
      options,
      correctIndex: options.indexOf(noun.gender),
      explanation: `"${noun.word}" er et ${noun.gender}-ord: "${noun.gender} ${noun.word}" (${noun.glossEn}).`,
    };
  }

  if (kind === 'definite-suffix') {
    const options = shuffle([noun.definite, noun.wrongDefinite], rng);
    return {
      kind,
      ruleId: 'definite-suffix',
      noun,
      prompt: `Vælg den bestemte form af "${noun.word}".`,
      options,
      correctIndex: options.indexOf(noun.definite),
      explanation: `"${noun.word}" er et ${noun.gender}-ord, så den bestemte form er "${noun.definite}" — endelsen følger kønnet, ikke omvendt.`,
    };
  }

  // double-definite
  const article = noun.gender === 'en' ? 'den' : 'det';
  const wrongArticle = noun.gender === 'en' ? 'det' : 'den';
  const correct = `${article} ${noun.adjectiveE} ${noun.word}`;
  const doubleMarked = `${article} ${noun.adjectiveE} ${noun.definite}`;
  const wrongGenderArticle = `${wrongArticle} ${noun.adjectiveE} ${noun.word}`;
  const options = shuffle([correct, doubleMarked, wrongGenderArticle], rng);

  return {
    kind,
    ruleId: 'double-definiteness',
    noun,
    prompt: `Vælg den korrekte form: "the ${noun.adjectiveGlossEn} ${noun.glossEn}".`,
    options,
    correctIndex: options.indexOf(correct),
    explanation: `"${article}" markerer bestemtheden foran adjektivet, så "${noun.word}" bliver i grundform — "${correct}", aldrig "${doubleMarked}".`,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
