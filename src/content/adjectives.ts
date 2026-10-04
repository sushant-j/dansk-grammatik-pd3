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

import SEED from './data/adjectives.json';
import type { Level } from './levels';

export interface AdjectiveEntry {
  id: string;
  /** Niveau 1–5 (see levels.ts): when the trainer starts serving this item. */
  level: Level;
  /** Bare/common-gender form, e.g. "rød". */
  base: string;
  /** Neuter (et-word) indefinite form, e.g. "rødt". */
  tForm: string;
  /** Plural and definite form (any gender), e.g. "røde". */
  eForm: string;
  glossEn: string;
  /** Set only for the two irregular entries; shown in their explanation. */
  irregularNote?: string;
  /** False until a person has checked the Danish; hand-written items are treated as checked. */
  reviewed?: boolean;
}

/** Hand-written originals. */
const HAND_WRITTEN: AdjectiveEntry[] = [
  { id: 'a-rod', level: 1, base: 'rød', tForm: 'rødt', eForm: 'røde', glossEn: 'red' },
  { id: 'a-ny', level: 1, base: 'ny', tForm: 'nyt', eForm: 'nye', glossEn: 'new' },
  { id: 'a-gammel', level: 1, base: 'gammel', tForm: 'gammelt', eForm: 'gamle', glossEn: 'old' },
  { id: 'a-stor', level: 1, base: 'stor', tForm: 'stort', eForm: 'store', glossEn: 'big' },
  { id: 'a-god', level: 1, base: 'god', tForm: 'godt', eForm: 'gode', glossEn: 'good' },
  { id: 'a-dygtig', level: 3, base: 'dygtig', tForm: 'dygtigt', eForm: 'dygtige', glossEn: 'skilled' },
  { id: 'a-sod', level: 2, base: 'sød', tForm: 'sødt', eForm: 'søde', glossEn: 'sweet' },
  { id: 'a-hard', level: 2, base: 'hård', tForm: 'hårdt', eForm: 'hårde', glossEn: 'hard' },
  { id: 'a-vigtig', level: 3, base: 'vigtig', tForm: 'vigtigt', eForm: 'vigtige', glossEn: 'important' },
  { id: 'a-svar', level: 2, base: 'svær', tForm: 'svært', eForm: 'svære', glossEn: 'difficult' },
  { id: 'a-lang', level: 1, base: 'lang', tForm: 'langt', eForm: 'lange', glossEn: 'long' },
  { id: 'a-billig', level: 2, base: 'billig', tForm: 'billigt', eForm: 'billige', glossEn: 'cheap' },
  {
    id: 'a-dansk',
    level: 2,
    base: 'dansk',
    tForm: 'dansk',
    eForm: 'danske',
    glossEn: 'Danish',
    irregularNote: 'Adjectives ending in unstressed -sk never take -t — "et dansk hus", never "et danskt hus".',
  },
  {
    id: 'a-lille',
    level: 1,
    base: 'lille',
    tForm: 'lille',
    eForm: 'små',
    glossEn: 'small',
    irregularNote: '"Lille" is fully irregular: unchanged in the singular, but the plural/definite form is the unrelated word "små".',
  },
];

/** Hand-written originals, then the drafted bank in data/adjectives.json. */
export const ADJECTIVE_BANK: AdjectiveEntry[] = [...HAND_WRITTEN, ...(SEED as AdjectiveEntry[])];

export function adjectiveById(id: string): AdjectiveEntry | undefined {
  return ADJECTIVE_BANK.find((a) => a.id === id);
}
