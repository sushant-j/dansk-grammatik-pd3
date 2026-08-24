/**
 * Adjective agreement rules.
 *
 * Same reasoning as `nounRules.ts`: this constrains a word inside a noun
 * phrase, not a clause position, so it lives apart from the sætningsskema
 * catalogue rather than forcing an empty `fields: []` onto a `Rule` shape
 * built for a schema diagram it doesn't need.
 *
 * Three forms, three rules — mirroring the three-rule shape of the en/et
 * module on purpose, since a learner who has already internalised "gender
 * decides the noun's suffix" is primed to recognise "gender (and number and
 * definiteness) decides the adjective's suffix" as the same kind of fact,
 * not a new topic to learn from scratch.
 */

export type AdjectiveRuleId = 'adjective-common-form' | 'adjective-neuter-form' | 'adjective-e-form';

export interface AdjectiveRuleExample {
  wrong?: string;
  right: string;
  note: string;
}

export interface AdjectiveRule {
  id: AdjectiveRuleId;
  da: string;
  en: string;
  statement: string;
  explanation: string;
  whyHard: string;
  examples: AdjectiveRuleExample[];
}

export const ADJECTIVE_RULES: Record<AdjectiveRuleId, AdjectiveRule> = {
  'adjective-common-form': {
    id: 'adjective-common-form',
    da: 'Adjektivets grundform (fælleskøn)',
    en: 'The bare form, before an en-word',
    statement:
      'Before an indefinite en-word, the adjective takes no ending at all — its plain dictionary form.',
    explanation:
      'This is the form you would look the adjective up under: "rød", "stor", "god". It is correct exactly once — directly before an indefinite en-word ("en rød bil") — and wrong everywhere else. It is not a default you fall back on when unsure; it is one of three specific slots.',
    whyHard:
      'Because it needs no ending, it feels like "no rule applies here" rather than "a specific rule applies here, and its output happens to be the bare form" — so learners stop paying attention to gender at exactly the point where getting it right matters for every other noun phrase.',
    examples: [
      { right: 'en rød bil', note: '"Bil" is an en-word and indefinite — the adjective is bare.' },
      {
        wrong: 'en rødt bil',
        right: 'en rød bil',
        note: 'The -t ending belongs to et-words only; it never appears next to "en".',
      },
    ],
  },

  'adjective-neuter-form': {
    id: 'adjective-neuter-form',
    da: 'Adjektivets t-form (intetkøn)',
    en: 'The -t form, before an et-word',
    statement: 'Before an indefinite et-word, the adjective takes a -t ending.',
    explanation:
      'Where an en-word leaves the adjective bare, an et-word adds -t: "et rødt hus", "et godt job". The ending is glued straight onto the base form for almost every adjective in the language — there is no separate vocabulary to learn, only the one letter to remember to add, and only in this one context.',
    whyHard:
      'A small number of very common adjectives are exceptions: those ending in unstressed -sk never take -t ("et dansk hus", not "et danskt hus"), and "lille" does not inflect here at all ("et lille hus"). Both exceptions show up constantly in ordinary writing, so the "just add -t" instinct fails on some of the most frequent words in the language.',
    examples: [
      { right: 'et rødt hus', note: 'The regular case: base form "rød" plus -t.' },
      {
        wrong: 'et danskt samfund',
        right: 'et dansk samfund',
        note: '-sk adjectives are a spelling exception: no -t is added, ever.',
      },
    ],
  },

  'adjective-e-form': {
    id: 'adjective-e-form',
    da: 'Adjektivets e-form (bestemt/flertal)',
    en: 'The -e form, for plural and every definite phrase',
    statement:
      'The moment a noun phrase is plural, or definite, or both, the adjective takes -e — regardless of the noun\'s own gender.',
    explanation:
      'This is the one adjective form that does not track en/et at all. It tracks two entirely different properties: number (plural) and definiteness (marked by den/det, or by a possessive like "min"). "Røde biler" (plural, indefinite), "den røde bil" (singular, definite, en-word), "det røde hus" (singular, definite, et-word) — three different noun-phrase shapes, the same adjective ending on all three, because gender has stopped being the relevant factor.',
    whyHard:
      'Having just learned that gender controls the adjective (base vs. -t), it is counterintuitive that a third form exists whose whole point is that gender no longer matters. Reaching for -t on a definite et-word ("det rødt hus") is the single most common adjective slip at this level.',
    examples: [
      { right: 'de røde biler', note: 'Plural, so -e — independent of "bil" being an en-word.' },
      {
        wrong: 'det rødt hus',
        right: 'det røde hus',
        note: 'Definite, so -e — even though "hus" is an et-word that would normally take -t.',
      },
    ],
  },
};

export const ALL_ADJECTIVE_RULE_IDS = Object.keys(ADJECTIVE_RULES) as AdjectiveRuleId[];

export function adjectiveRule(id: AdjectiveRuleId): AdjectiveRule {
  return ADJECTIVE_RULES[id];
}
