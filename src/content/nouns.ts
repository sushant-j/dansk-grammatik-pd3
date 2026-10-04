/**
 * Noun bank for gender, the definite suffix, and double definiteness.
 *
 * Forms are hand-supplied rather than derived, because Danish plurals and
 * definite forms are riddled with small irregularities ("bog" → "bøger", not
 * "boger") that a suffix rule would get wrong exactly often enough to teach
 * bad habits. `wrongDefinite` is the specific, plausible mistake this noun
 * invites — the -en/-et suffix borrowed from the wrong gender — used to build
 * a distractor that targets the real error, not a random wrong answer.
 *
 * Vocabulary is drawn from the same PD3 register as the rest of the app
 * (uddannelse, virksomhed, kommune) rather than a beginner's object list, so
 * this module reads as a continuation of the same course, not a detour into
 * a different one.
 */

import SEED from './data/nouns.json';
import type { Level } from './levels';

export type Gender = 'en' | 'et';

export interface NounEntry {
  id: string;
  /** Niveau 1–5 (see levels.ts): when the trainer starts serving this item. */
  level: Level;
  /** Bare, indefinite singular — the citation form. */
  word: string;
  gender: Gender;
  /** Correct definite singular, e.g. "bilen". */
  definite: string;
  /** The plausible wrong suffix a learner would produce, e.g. "bilet". */
  wrongDefinite: string;
  glossEn: string;
  /**
   * An adjective in its definite/plural ("-e") form, already agreement-correct
   * for use in "den/det ___ {word}" — double definiteness always uses this
   * form regardless of the noun's own gender.
   */
  adjectiveE: string;
  adjectiveGlossEn: string;
  /** False until a person has checked the Danish; hand-written items are treated as checked. */
  reviewed?: boolean;
}

/** Hand-written originals. */
const HAND_WRITTEN: NounEntry[] = [
  // ── en-words ──────────────────────────────────────────────────────────
  { id: 'n-bil', level: 1, word: 'bil', gender: 'en', definite: 'bilen', wrongDefinite: 'bilet', glossEn: 'car', adjectiveE: 'røde', adjectiveGlossEn: 'red' },
  { id: 'n-bog', level: 1, word: 'bog', gender: 'en', definite: 'bogen', wrongDefinite: 'boget', glossEn: 'book', adjectiveE: 'gamle', adjectiveGlossEn: 'old' },
  { id: 'n-skole', level: 1, word: 'skole', gender: 'en', definite: 'skolen', wrongDefinite: 'skolet', glossEn: 'school', adjectiveE: 'nye', adjectiveGlossEn: 'new' },
  { id: 'n-by', level: 1, word: 'by', gender: 'en', definite: 'byen', wrongDefinite: 'byet', glossEn: 'town, city', adjectiveE: 'store', adjectiveGlossEn: 'big' },
  { id: 'n-uddannelse', level: 3, word: 'uddannelse', gender: 'en', definite: 'uddannelsen', wrongDefinite: 'uddannelset', glossEn: 'education', adjectiveE: 'gode', adjectiveGlossEn: 'good' },
  { id: 'n-familie', level: 1, word: 'familie', gender: 'en', definite: 'familien', wrongDefinite: 'familiet', glossEn: 'family', adjectiveE: 'store', adjectiveGlossEn: 'big' },
  { id: 'n-ven', level: 1, word: 'ven', gender: 'en', definite: 'vennen', wrongDefinite: 'vennet', glossEn: 'friend', adjectiveE: 'gode', adjectiveGlossEn: 'good' },
  { id: 'n-laerer', level: 1, word: 'lærer', gender: 'en', definite: 'læreren', wrongDefinite: 'læreret', glossEn: 'teacher', adjectiveE: 'dygtige', adjectiveGlossEn: 'skilled' },
  { id: 'n-dag', level: 1, word: 'dag', gender: 'en', definite: 'dagen', wrongDefinite: 'daget', glossEn: 'day', adjectiveE: 'lange', adjectiveGlossEn: 'long' },
  { id: 'n-bank', level: 2, word: 'bank', gender: 'en', definite: 'banken', wrongDefinite: 'banket', glossEn: 'bank', adjectiveE: 'store', adjectiveGlossEn: 'big' },
  { id: 'n-avis', level: 2, word: 'avis', gender: 'en', definite: 'avisen', wrongDefinite: 'aviset', glossEn: 'newspaper', adjectiveE: 'gamle', adjectiveGlossEn: 'old' },
  { id: 'n-computer', level: 2, word: 'computer', gender: 'en', definite: 'computeren', wrongDefinite: 'computeret', glossEn: 'computer', adjectiveE: 'nye', adjectiveGlossEn: 'new' },
  { id: 'n-virksomhed', level: 4, word: 'virksomhed', gender: 'en', definite: 'virksomheden', wrongDefinite: 'virksomhedet', glossEn: 'company, business', adjectiveE: 'store', adjectiveGlossEn: 'big' },
  { id: 'n-kommune', level: 3, word: 'kommune', gender: 'en', definite: 'kommunen', wrongDefinite: 'kommunet', glossEn: 'municipality', adjectiveE: 'små', adjectiveGlossEn: 'small' },
  { id: 'n-laege', level: 2, word: 'læge', gender: 'en', definite: 'lægen', wrongDefinite: 'læget', glossEn: 'doctor', adjectiveE: 'dygtige', adjectiveGlossEn: 'skilled' },
  { id: 'n-bolig', level: 2, word: 'bolig', gender: 'en', definite: 'boligen', wrongDefinite: 'boliget', glossEn: 'home, residence', adjectiveE: 'nye', adjectiveGlossEn: 'new' },

  // ── et-words ──────────────────────────────────────────────────────────
  { id: 'n-hus', level: 1, word: 'hus', gender: 'et', definite: 'huset', wrongDefinite: 'husen', glossEn: 'house', adjectiveE: 'røde', adjectiveGlossEn: 'red' },
  { id: 'n-barn', level: 1, word: 'barn', gender: 'et', definite: 'barnet', wrongDefinite: 'barnen', glossEn: 'child', adjectiveE: 'søde', adjectiveGlossEn: 'sweet' },
  { id: 'n-arbejde', level: 1, word: 'arbejde', gender: 'et', definite: 'arbejdet', wrongDefinite: 'arbejden', glossEn: 'work, job', adjectiveE: 'hårde', adjectiveGlossEn: 'hard' },
  { id: 'n-job', level: 1, word: 'job', gender: 'et', definite: 'jobbet', wrongDefinite: 'jobben', glossEn: 'job', adjectiveE: 'gode', adjectiveGlossEn: 'good' },
  { id: 'n-moede', level: 2, word: 'møde', gender: 'et', definite: 'mødet', wrongDefinite: 'møden', glossEn: 'meeting', adjectiveE: 'vigtige', adjectiveGlossEn: 'important' },
  { id: 'n-sprog', level: 2, word: 'sprog', gender: 'et', definite: 'sproget', wrongDefinite: 'sprogen', glossEn: 'language', adjectiveE: 'svære', adjectiveGlossEn: 'difficult' },
  { id: 'n-samfund', level: 4, word: 'samfund', gender: 'et', definite: 'samfundet', wrongDefinite: 'samfunden', glossEn: 'society', adjectiveE: 'danske', adjectiveGlossEn: 'Danish' },
  { id: 'n-system', level: 3, word: 'system', gender: 'et', definite: 'systemet', wrongDefinite: 'systemen', glossEn: 'system', adjectiveE: 'nye', adjectiveGlossEn: 'new' },
  { id: 'n-problem', level: 3, word: 'problem', gender: 'et', definite: 'problemet', wrongDefinite: 'problemen', glossEn: 'problem', adjectiveE: 'store', adjectiveGlossEn: 'big' },
  { id: 'n-brev', level: 2, word: 'brev', gender: 'et', definite: 'brevet', wrongDefinite: 'breven', glossEn: 'letter', adjectiveE: 'lange', adjectiveGlossEn: 'long' },
];

/** Hand-written originals, then the drafted bank in data/nouns.json. */
export const NOUN_BANK: NounEntry[] = [...HAND_WRITTEN, ...(SEED as NounEntry[])];

export function nounById(id: string): NounEntry | undefined {
  return NOUN_BANK.find((n) => n.id === id);
}
