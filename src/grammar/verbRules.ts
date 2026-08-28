/**
 * Tense rules: the weak suffix choice, strong-verb memorisation, and the
 * er/har auxiliary split.
 *
 * Same reasoning as `nounRules.ts` and `adjectiveRules.ts`: this constrains a
 * verb form, not a clause position, so it lives apart from the sætningsskema
 * catalogue. Three rules again, but this time the three are not a stylistic
 * echo of the other modules — they are three genuinely different kinds of
 * fact. The first is a pattern with real (if leaky) phonological logic; the
 * second is pure memorisation, the verb equivalent of en/et gender; the third
 * is a semantic fact about the verb (does it describe motion or a change of
 * state) that has nothing to do with whether the verb is weak or strong.
 */

export type VerbRuleId = 'weak-suffix-choice' | 'strong-verb-forms' | 'perfect-auxiliary';

export interface VerbRuleExample {
  wrong?: string;
  right: string;
  note: string;
}

export interface VerbRule {
  id: VerbRuleId;
  da: string;
  en: string;
  statement: string;
  explanation: string;
  whyHard: string;
  examples: VerbRuleExample[];
}

export const VERB_RULES: Record<VerbRuleId, VerbRule> = {
  'weak-suffix-choice': {
    id: 'weak-suffix-choice',
    da: 'Svage verber: -ede eller -te',
    en: 'Weak verbs: -ede or -te',
    statement:
      'A weak verb forms its past tense with one of two suffixes, -ede or -te, and which one it takes is a property of that verb.',
    explanation:
      'Most Danish verbs are weak: the past tense is the stem plus a suffix, not a vowel change. But there are two competing suffixes — "arbejdede" (-ede) and "spiste" (-te) — and a verb takes one specific one, never a free choice between them. The sound at the end of the stem correlates loosely with which suffix a verb takes, but it is not a strict rule you can derive on the fly; it is closer to knowing which shelf a word lives on, learned the same way you learn the word itself.',
    whyHard:
      'Because both endings are genuinely common, guessing feels like a coin flip rather than a rule violation — there is no obviously "wrong-sounding" option the way there might be with a rarer pattern, so the error survives unnoticed in a learner\'s own writing far longer than most.',
    examples: [
      { wrong: 'Jeg spisede morgenmad.', right: 'Jeg spiste morgenmad.', note: '"Spise" takes -te, not -ede.' },
      { wrong: 'Hun arbejdte hele dagen.', right: 'Hun arbejdede hele dagen.', note: '"Arbejde" takes -ede, not -te.' },
    ],
  },

  'strong-verb-forms': {
    id: 'strong-verb-forms',
    da: 'Stærke verber',
    en: 'Strong (irregular) verbs',
    statement:
      'A strong verb does not take a past-tense suffix at all — it changes its internal vowel instead, and the result has to be memorised.',
    explanation:
      'Weak verbs are predictable once you know which suffix they take; strong verbs offer no such shortcut. "Gå" becomes "gik", "se" becomes "så", "komme" becomes "kom" — there is no ending being added, just a different word-shape for the same verb, the same way "go" becomes "went" in English rather than "goed". These are exactly the highest-frequency verbs in the language, which is the one piece of good news: there are relatively few of them to learn, and you will meet each one constantly.',
    whyHard:
      'A weak-verb reflex is the strongest habit a learner has by this level, so under time pressure the instinct is to reach for a suffix anyway — "gåede", "kommede" — producing a form that does not exist rather than the correct one.',
    examples: [
      { wrong: 'Jeg gåede i skole.', right: 'Jeg gik i skole.', note: '"Gå" is strong: the vowel changes, no suffix is added.' },
      { wrong: 'Hun kommede sent.', right: 'Hun kom sent.', note: 'Same pattern — "kom" is the whole past tense, not a stem plus ending.' },
    ],
  },

  'perfect-auxiliary': {
    id: 'perfect-auxiliary',
    da: 'Hjælpeverbum: er eller har',
    en: 'The auxiliary: er or har',
    statement:
      'Most verbs form the perfect tense with "har", but verbs of motion or change of state use "er" instead.',
    explanation:
      'This has nothing to do with whether a verb is weak or strong — "gå" and "se" are both strong, but "han er gået" takes "er" while "han har set" takes "har". The dividing line is meaning: does the verb describe movement from one place or state to another? "Gå", "komme", "falde" and "blive" all describe a change of location or condition, and Danish marks that with "er" in the perfect tense, mirroring how the verb "to be" once worked as an auxiliary in older English and still does in some other Germanic languages.',
    whyHard:
      'English collapsed this distinction centuries ago — everything takes "have" now — so there is no instinct to fall back on, and "har" ends up over-generalised to every verb, including the ones that specifically resist it.',
    examples: [
      { wrong: 'Han har gået hjem.', right: 'Han er gået hjem.', note: '"Gå" describes movement, so the perfect tense takes "er".' },
      { right: 'Hun har set filmen.', note: '"Se" does not describe motion or change of state, so it takes "har" as usual.' },
      { right: 'Hun er blevet syg.', note: '"Blive" (to become) is a change of state — "er", not "har".' },
    ],
  },
};

export const ALL_VERB_RULE_IDS = Object.keys(VERB_RULES) as VerbRuleId[];

export function verbRule(id: VerbRuleId): VerbRule {
  return VERB_RULES[id];
}
