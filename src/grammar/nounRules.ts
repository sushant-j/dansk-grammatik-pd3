/**
 * Noun-phrase rules: gender, the definite suffix, and double definiteness.
 *
 * These live apart from `rules.ts` on purpose. Every rule in that file
 * constrains a position in the sætningsskema and is taught through the field
 * board; these three constrain the inside of a single noun phrase and have
 * nothing to do with clause word order. Forcing them into the same `Rule`
 * shape (which expects `FieldId[]` and a schema diagram) would mean either a
 * meaningless empty `fields: []` or a rule card that tries to diagram
 * something the sætningsskema was never built to show. Same idea as the
 * grammar/vocabulary split: one underlying mastery model (`profile/mastery.ts`),
 * two content domains, because they are actually different domains.
 */

export type NounRuleId = 'en-et-gender' | 'definite-suffix' | 'double-definiteness';

export interface NounRuleExample {
  wrong?: string;
  right: string;
  note: string;
}

export interface NounRule {
  id: NounRuleId;
  da: string;
  en: string;
  statement: string;
  explanation: string;
  whyHard: string;
  examples: NounRuleExample[];
}

export const NOUN_RULES: Record<NounRuleId, NounRule> = {
  'en-et-gender': {
    id: 'en-et-gender',
    da: 'En-ord eller et-ord',
    en: 'Common or neuter gender',
    statement:
      'Every Danish noun is either an en-word (fælleskøn) or an et-word (intetkøn) — and it is fixed per word, not a choice.',
    explanation:
      'About three in four Danish nouns are en-words; the rest are et-words. Which one a given noun is has almost nothing to do with meaning — "en pige" (a girl) and "et menneske" (a human being) are both about people, but one is en and one is et. The gender is a property of the word itself, memorised the same way you memorise the word — and it then decides every other choice in this trainer: the article, the definite suffix, and the adjective form.',
    whyHard:
      'There is no reliable logic to derive it from, only patterns that hold most of the time. Nouns ending in -else, -hed, -ing or -ion are almost always en-words (uddannelse, virksomhed); nouns ending in -um are almost always et-words (museum). Everything else has to be learned noun by noun, which is precisely why this is a memorisation trainer and not a rule board.',
    examples: [
      { right: 'en bil', note: '"Bil" is an en-word — you simply have to know this one.' },
      { right: 'et hus', note: '"Hus" is an et-word — same deal, no derivable reason.' },
      {
        right: 'en uddannelse',
        note: 'The -else ending is a reliable (if not universal) hint toward en.',
      },
    ],
  },

  'definite-suffix': {
    id: 'definite-suffix',
    da: 'Den bestemte endelse',
    en: 'The definite suffix',
    statement:
      'Danish marks "the" by suffixing the noun, and which suffix depends on the gender you already had to memorise: en-words take -en, et-words take -et.',
    explanation:
      'Where English puts a separate word in front ("the car"), Danish glues an ending onto the noun itself: "bil" becomes "bilen", "hus" becomes "huset". The suffix is not a free choice — it is locked to the gender the noun already has. Get the gender right and the suffix follows automatically; get it wrong and you get a form no Dane would recognise as correct, even though every letter is spelled right.',
    whyHard:
      'The two suffixes are only one letter apart (-en vs -et), so a small memory slip in the gender produces a small, easy-to-miss error in the suffix — the kind of mistake that is invisible to a spell-checker but immediately audible to a native speaker.',
    examples: [
      { wrong: 'bilet', right: 'bilen', note: '"Bil" is en, so the suffix is -en, not -et.' },
      { wrong: 'husen', right: 'huset', note: '"Hus" is et, so the suffix is -et, not -en.' },
    ],
  },

  'double-definiteness': {
    id: 'double-definiteness',
    da: 'Dobbelt bestemthed',
    en: 'Double definiteness',
    statement:
      'When an adjective comes before a definite noun, Danish marks "the" twice: once with den/det before the adjective, and the noun itself stays in its bare, unsuffixed form.',
    explanation:
      'A bare definite noun takes the suffix alone: "bilen" (the car). But the moment an adjective steps in front of it, the suffix has to go — the noun reverts to its plain form, and "the" is instead carried by a separate word, den for en-words and det for et-words: "den røde bil" (the red car), never "den røde bilen". This is one of the most heavily marked errors on the PD3 written and oral exam, because it is exactly the kind of small structural mistake that survives a learner\'s otherwise fluent Danish for years.',
    whyHard:
      'It feels redundant — "the" seemingly marked twice, then the noun\'s own suffix dropped entirely — which is not how English or most other languages handle this, so there is no intuition to fall back on. It has to be drilled as its own pattern.',
    examples: [
      {
        wrong: 'den røde bilen',
        right: 'den røde bil',
        note: 'Once "den" carries "the", the noun cannot also carry its suffix.',
      },
      {
        wrong: 'det røde hus',
        right: 'det røde hus',
        note: '"Det" (not "den") because "hus" is an et-word — the article still tracks gender.',
      },
      {
        right: 'bilen',
        note: 'No adjective, no article — the suffix alone is correct and sufficient here.',
      },
    ],
  },
};

export const ALL_NOUN_RULE_IDS = Object.keys(NOUN_RULES) as NounRuleId[];

export function nounRule(id: NounRuleId): NounRule {
  return NOUN_RULES[id];
}
