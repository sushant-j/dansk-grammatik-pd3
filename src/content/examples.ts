/**
 * Usage sentences for the vocabulary deck.
 *
 * A form learned in a table ("afbryder · afbrød · afbrudt") only sticks once
 * it has been seen doing its job in a sentence, so every bank word carries at
 * least one sentence per form it inflects into. The sentences live in JSON
 * shards keyed by deck id (`w-v-afbryde`, `v-erstatte`, …) and are joined onto
 * VOCABULARY in vocabulary.ts. Like the seeded banks, they are unreviewed
 * until a person has checked them.
 */

import adjectives from './data/examples/adjectives.json';
import exam from './data/examples/exam.json';
import nouns1 from './data/examples/nouns-1.json';
import nouns2 from './data/examples/nouns-2.json';
import nouns3 from './data/examples/nouns-3.json';
import verbs1 from './data/examples/verbs-1.json';
import verbs2 from './data/examples/verbs-2.json';
import verbs3 from './data/examples/verbs-3.json';
import verbs4 from './data/examples/verbs-4.json';

export interface VocabExample {
  /**
   * The form the sentence shows, exactly as it appears in `da` (one word —
   * for reflexive and particle verbs, just the verb: "bevæger", not
   * "bevæger sig", since inversion splits the two). Omitted for a free usage.
   */
  form?: string;
  da: string;
  en: string;
}

export type ExampleShard = Record<string, VocabExample[]>;

export const EXAMPLE_SHARDS: Record<string, ExampleShard> = {
  exam,
  'verbs-1': verbs1,
  'verbs-2': verbs2,
  'verbs-3': verbs3,
  'verbs-4': verbs4,
  'nouns-1': nouns1,
  'nouns-2': nouns2,
  'nouns-3': nouns3,
  adjectives,
};

export const EXAMPLES: ExampleShard = Object.assign({}, ...Object.values(EXAMPLE_SHARDS));

/** The token a form is matched by in a sentence: its first word ("bevæger sig" → "bevæger"). */
export function formToken(form: string): string {
  return form.trim().split(/\s+/)[0];
}

/** Does `sentence` contain `token` as a whole word (Danish letters count as letters)? */
export function containsForm(sentence: string, token: string): boolean {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, 'iu').test(sentence);
}
