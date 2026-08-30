/**
 * Spelling exercise bank.
 *
 * Same reasoning as `commaExamples.ts`: there is no small per-word property
 * to generate a question from, so each entry is a hand-written sentence with
 * a blank and the two words a learner might plausibly choose between. The
 * "wrong" option is always a real spelling mistake this specific confusion
 * produces — a real other word ("hun" for "hund"), a silent-letter miss
 * ("vad" for "hvad"), or the paired function word ("nogen" for "nogle") —
 * never an arbitrary distractor.
 */

import type { SpellingRuleId } from '../grammar/spellingRules';

export interface SpellingEntry {
  id: string;
  ruleId: SpellingRuleId;
  /** Sentence with "___" marking the blank. */
  prompt: string;
  correct: string;
  incorrect: string;
  explanation: string;
}

export const SPELLING_EXAMPLES: SpellingEntry[] = [
  // ── silent d ──────────────────────────────────────────────────────────
  {
    id: 's-hund',
    ruleId: 'silent-d',
    prompt: 'Jeg har en ___ derhjemme.',
    correct: 'hund',
    incorrect: 'hun',
    explanation: '"Hund" (dog) needs its silent d — drop it and you get "hun" (she), a different real word.',
  },
  {
    id: 's-mand',
    ruleId: 'silent-d',
    prompt: 'Han er en god ___.',
    correct: 'mand',
    incorrect: 'man',
    explanation: '"Mand" (man) loses its silent d and becomes "man" (one, you) — spelled without the d, but still a real word.',
  },
  {
    id: 's-guld',
    ruleId: 'silent-d',
    prompt: 'Ringen er lavet af ___.',
    correct: 'guld',
    incorrect: 'gul',
    explanation: '"Guld" (gold) has a silent d after the l — without it you get "gul" (yellow), an unrelated word.',
  },
  {
    id: 's-haand',
    ruleId: 'silent-d',
    prompt: 'Ræk mig din ___.',
    correct: 'hånd',
    incorrect: 'hån',
    explanation: '"Hånd" (hand) keeps its silent d after n — "hån" (without the d) means scorn, a different word entirely.',
  },

  // ── silent h in hv-words ─────────────────────────────────────────────
  {
    id: 's-hvad',
    ruleId: 'silent-h-hv',
    prompt: '___ hedder du?',
    correct: 'Hvad',
    incorrect: 'Vad',
    explanation: 'Pronounced identically either way — the silent h has to be memorised, not heard.',
  },
  {
    id: 's-hvor',
    ruleId: 'silent-h-hv',
    prompt: '___ bor du?',
    correct: 'Hvor',
    incorrect: 'Vor',
    explanation: 'Same silent-h pattern — "vor" is even a real (old-fashioned) word for "our", which makes this one easy to miss.',
  },
  {
    id: 's-hvem',
    ruleId: 'silent-h-hv',
    prompt: '___ er det?',
    correct: 'Hvem',
    incorrect: 'Vem',
    explanation: 'The h is silent but still required in spelling — "vem" is not a Danish word at all.',
  },
  {
    id: 's-hvorfor',
    ruleId: 'silent-h-hv',
    prompt: '___ kommer du ikke?',
    correct: 'Hvorfor',
    incorrect: 'Vorfor',
    explanation: 'Every hv-question-word follows the same pattern: silent h, spelled anyway.',
  },

  // ── nogen vs. nogle ──────────────────────────────────────────────────
  {
    id: 's-nogle-1',
    ruleId: 'nogen-vs-nogle',
    prompt: 'Jeg har ___ gode venner.',
    correct: 'nogle',
    incorrect: 'nogen',
    explanation: 'A plain positive statement about a plural amount takes "nogle".',
  },
  {
    id: 's-nogen-1',
    ruleId: 'nogen-vs-nogle',
    prompt: 'Er der ___ herinde?',
    correct: 'nogen',
    incorrect: 'nogle',
    explanation: 'A question meaning "anyone" takes "nogen", not "nogle".',
  },
  {
    id: 's-nogen-2',
    ruleId: 'nogen-vs-nogle',
    prompt: 'Har du ___ penge, jeg kan låne?',
    correct: 'nogen',
    incorrect: 'nogle',
    explanation: 'Questions take "nogen", even when what\'s being asked about is a plural-sounding thing like money.',
  },
  {
    id: 's-nogle-2',
    ruleId: 'nogen-vs-nogle',
    prompt: 'Vi købte ___ æbler i går.',
    correct: 'nogle',
    incorrect: 'nogen',
    explanation: 'A positive statement about a plural amount — "nogle" again, not "nogen".',
  },
];

export function spellingExamplesForRule(ruleId: SpellingRuleId): SpellingEntry[] {
  return SPELLING_EXAMPLES.filter((e) => e.ruleId === ruleId);
}
