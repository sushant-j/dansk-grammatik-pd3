/**
 * FVU-oriented spelling rules.
 *
 * Every other module in this app targets an L2 exam (PD2/PD3): a learner who
 * already reads and writes another language fluently and is mapping known
 * concepts onto Danish grammar. FVU (Forberedende Voksenundervisning) is a
 * different population and a different failure mode — literacy itself,
 * including for some native speakers — and the errors are about sound not
 * matching spelling, not about grammatical agreement.
 *
 * Scoped to three rules that are unambiguous and appear in essentially every
 * Danish orthography guide, rather than anything resting on vowel-length
 * intuitions or dialect-dependent pronunciation, where confidently asserting
 * a rule risks being wrong for some speakers.
 */

export type SpellingRuleId = 'silent-d' | 'silent-h-hv' | 'nogen-vs-nogle';

export interface SpellingRuleExample {
  wrong: string;
  right: string;
  note: string;
}

export interface SpellingRule {
  id: SpellingRuleId;
  da: string;
  en: string;
  statement: string;
  explanation: string;
  whyHard: string;
  examples: SpellingRuleExample[];
}

export const SPELLING_RULES: Record<SpellingRuleId, SpellingRule> = {
  'silent-d': {
    id: 'silent-d',
    da: 'Stumt d efter l, n og r',
    en: 'Silent d after l, n, or r',
    statement:
      'After l, n, or r, a "d" is often written but not pronounced — and leaving it out can turn the word into a completely different one.',
    explanation:
      'Say "hund" (dog) out loud: what you hear is close to "hun", with no audible d. The d is still part of the correct spelling — it just is not pronounced after n here, the same way it disappears after l in "guld" (gold) and after n in "mand" (man). This would be a harmless quirk except that dropping the d often does not just misspell the word — it spells a different real word instead: "hund" without its d is "hun" (she), and "mand" without its d is "man" (one, you, generically).',
    whyHard:
      'There is no sound in the spoken word to signal the d belongs there, so a learner spelling purely by ear has no error to notice — the misspelling is not just plausible, it is a real word, which means neither a spell-checker nor your own ear will catch it.',
    examples: [
      {
        wrong: 'Jeg har en hun derhjemme.',
        right: 'Jeg har en hund derhjemme.',
        note: '"Hund" (dog) needs its silent d — without it, the sentence says "I have a she at home."',
      },
      {
        wrong: 'Han er en god man.',
        right: 'Han er en god mand.',
        note: '"Mand" (man) loses its d and becomes "man" (one, you) — a real word, just the wrong one.',
      },
    ],
  },

  'silent-h-hv': {
    id: 'silent-h-hv',
    da: 'Stumt h i hv-ord',
    en: 'Silent h in hv-words',
    statement:
      'Danish question words that sound like they start with "v" — hvad, hvor, hvem, hvorfor — are spelled with a silent h in front of the v.',
    explanation:
      'Say "hvad" out loud: what comes out is close to "vad", not "h-vad" — the h contributes no sound at all. The same is true of every question word built the same way: hvor, hvem, hvordan, hvorfor. The h is a fossil of an older pronunciation that Danish has since dropped, but the spelling never caught up, so it still has to be written even though it can never be heard.',
    whyHard:
      'Because the h is completely silent, there is no audible cue at all to remind you it belongs there — the correct and incorrect spellings are pronounced identically, so getting it right depends entirely on having memorised that this specific set of words carries a silent h.',
    examples: [
      {
        wrong: 'Vad hedder du?',
        right: 'Hvad hedder du?',
        note: 'Pronounced identically either way — the h has to be memorised, not heard.',
      },
      {
        wrong: 'Vor bor du?',
        right: 'Hvor bor du?',
        note: 'Same silent-h pattern as every other Danish question word of this shape.',
      },
    ],
  },

  'nogen-vs-nogle': {
    id: 'nogen-vs-nogle',
    da: '"Nogen" eller "nogle"',
    en: '"Nogen" or "nogle"',
    statement:
      '"Nogle" is for plain positive statements about a plural amount; "nogen" is for questions, negative sentences, and "someone/anyone".',
    explanation:
      'In everyday speech these two words are often pronounced almost identically, which is exactly why they are among the most commonly confused spellings in Danish — including for native speakers. "Nogle" shows up when you are simply stating that some (plural) things exist: "Jeg har nogle bøger." "Nogen" shows up in questions ("Har du nogen bøger?"), in negative statements ("Der er ikke nogen bøger"), and whenever the meaning is "someone" or "anyone" rather than "some things": "Er der nogen hjemme?"',
    whyHard:
      'The choice depends on sentence type and meaning, not on anything you can hear — in fast speech the two words can sound the same, so even fluent speakers rely on having learned the pattern explicitly rather than on their ear.',
    examples: [
      {
        wrong: 'Jeg har nogen gode venner.',
        right: 'Jeg har nogle gode venner.',
        note: 'A plain positive statement about a plural amount takes "nogle".',
      },
      {
        wrong: 'Er der nogle herinde?',
        right: 'Er der nogen herinde?',
        note: 'A question meaning "anyone" takes "nogen", not "nogle".',
      },
    ],
  },
};

export const ALL_SPELLING_RULE_IDS = Object.keys(SPELLING_RULES) as SpellingRuleId[];

export function spellingRule(id: SpellingRuleId): SpellingRule {
  return SPELLING_RULES[id];
}
