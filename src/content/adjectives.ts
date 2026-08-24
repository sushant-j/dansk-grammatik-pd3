/**
 * Adjective bank for the agreement trainer.
 *
 * Danish adjectives inflect for three contexts, not two genders: the bare
 * base form pairs with an en-word indefinite singular ("en rød bil"), +t
 * pairs with an et-word indefinite singular ("et rødt hus"), and +e covers
 * *everything else* — plural and every definite form, regardless of gender
 * ("de røde biler", "den røde bil", "det røde hus"). That third form is
 * already load-bearing in the en/et module's double-definiteness questions;
 * this bank and its `-e` forms are the same data, reused rather than
 * duplicated.
 *
 * Two entries are deliberately irregular: "dansk" doesn't take -t (adjectives
 * ending in unstressed -sk never do — a spelling rule, not an exception to
 * memorise word by word), and "lille" is fully suppletive ("lille" stays
 * "lille" in the singular, then jumps to the unrelated "små" for plural and
 * definite). Both are common enough in PD3-register writing that avoiding
 * them would just delay the moment a learner meets them for real.
 */

export interface AdjectiveEntry {
  id: string;
  /** Bare/common-gender form, e.g. "rød". */
  base: string;
  /** Neuter (et-word) indefinite form, e.g. "rødt". */
  tForm: string;
  /** Plural and definite form (any gender), e.g. "røde". */
  eForm: string;
  glossEn: string;
  /** Set only for the two irregular entries; shown in their explanation. */
  irregularNote?: string;
}

export const ADJECTIVE_BANK: AdjectiveEntry[] = [
  { id: 'a-rod', base: 'rød', tForm: 'rødt', eForm: 'røde', glossEn: 'red' },
  { id: 'a-ny', base: 'ny', tForm: 'nyt', eForm: 'nye', glossEn: 'new' },
  { id: 'a-gammel', base: 'gammel', tForm: 'gammelt', eForm: 'gamle', glossEn: 'old' },
  { id: 'a-stor', base: 'stor', tForm: 'stort', eForm: 'store', glossEn: 'big' },
  { id: 'a-god', base: 'god', tForm: 'godt', eForm: 'gode', glossEn: 'good' },
  { id: 'a-dygtig', base: 'dygtig', tForm: 'dygtigt', eForm: 'dygtige', glossEn: 'skilled' },
  { id: 'a-sod', base: 'sød', tForm: 'sødt', eForm: 'søde', glossEn: 'sweet' },
  { id: 'a-hard', base: 'hård', tForm: 'hårdt', eForm: 'hårde', glossEn: 'hard' },
  { id: 'a-vigtig', base: 'vigtig', tForm: 'vigtigt', eForm: 'vigtige', glossEn: 'important' },
  { id: 'a-svar', base: 'svær', tForm: 'svært', eForm: 'svære', glossEn: 'difficult' },
  { id: 'a-lang', base: 'lang', tForm: 'langt', eForm: 'lange', glossEn: 'long' },
  { id: 'a-billig', base: 'billig', tForm: 'billigt', eForm: 'billige', glossEn: 'cheap' },
  {
    id: 'a-dansk',
    base: 'dansk',
    tForm: 'dansk',
    eForm: 'danske',
    glossEn: 'Danish',
    irregularNote: 'Adjectives ending in unstressed -sk never take -t — "et dansk hus", never "et danskt hus".',
  },
  {
    id: 'a-lille',
    base: 'lille',
    tForm: 'lille',
    eForm: 'små',
    glossEn: 'small',
    irregularNote: '"Lille" is fully irregular: unchanged in the singular, but the plural/definite form is the unrelated word "små".',
  },
];

export function adjectiveById(id: string): AdjectiveEntry | undefined {
  return ADJECTIVE_BANK.find((a) => a.id === id);
}
