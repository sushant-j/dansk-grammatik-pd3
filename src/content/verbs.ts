/**
 * Verb bank for the tense trainer.
 *
 * Danish splits verbs into two entirely different systems, and conflating
 * them is the single biggest source of tense errors at this level:
 *
 * - Weak verbs form the past tense with a suffix (-ede or -te) glued onto the
 *   stem, plus a matching perfektum suffix (-et or -t). Which of the two
 *   suffixes a given verb takes correlates loosely with the sound at the end
 *   of the stem, but — like en/et gender — it is ultimately a property of the
 *   word, not something reliably derivable, so it is treated the same way:
 *   memorised per verb, with `wrongPast` recording the specific suffix-swap
 *   error a learner would produce.
 * - Strong verbs change their internal vowel instead (ablaut) — "gå" becomes
 *   "gik", not "gåede". There is no suffix rule to almost-apply here; the verb
 *   simply has to be known. `wrongPast` for these records the over-regularised
 *   form a learner produces by reaching for a weak ending anyway.
 *
 * `perfectAux` is the third, orthogonal fact this bank carries: most verbs
 * take "har" in the perfect tense, but a specific, learnable class — verbs of
 * motion or change of state — take "er" instead ("han ER gået", "hun ER
 * blevet syg"). This has nothing to do with weak/strong. A handful of motion
 * verbs take either, with a shift in meaning ("har gået en tur" / "er gået
 * hjem"); those are `both` and never asked in the auxiliary drill, where only
 * one answer can be right.
 *
 * The bank is the 500 most common Danish verbs, imported from basby.dk's list
 * by `scripts/import-verbs.mjs` into `data/verbs.json` (forms only). English
 * glosses and niveaus live beside it in `data/verbs.meta.json`; a verb is
 * served only once it has both.
 */

import IMPORTED_VERBS from './data/verbs.json';
import VERB_META from './data/verbs.meta.json';
import type { Level } from './levels';

export type VerbClass = 'weak-ede' | 'weak-te' | 'strong';
export type PerfectAux = 'har' | 'er' | 'both';

export interface VerbEntry {
  id: string;
  /** Niveau 1–5 (see levels.ts): when the trainer starts serving this item. */
  level: Level;
  infinitive: string;
  present: string;
  /** Datid — simple past. */
  past: string;
  /** The specific wrong form this verb invites: a suffix-swap for weak verbs, an over-regularised guess for strong ones. */
  wrongPast: string;
  /** Perfektum — past participle, used after the auxiliary. */
  participle: string;
  verbClass: VerbClass;
  perfectAux: PerfectAux;
  glossEn: string;
  /** Førdatid, e.g. "havde arbejdet". */
  pluperfect?: string;
  /** Bydeform, e.g. "arbejd"; absent for verbs without one (modals). */
  imperative?: string | null;
  /** True for "bevæge sig"-type verbs, whose "sig" has to agree with the subject. */
  reflexive?: boolean;
  /** Set for the list's transitive/intransitive homograph pairs ("hænge"). */
  transitivity?: 'tr' | 'intr' | null;
  /** False until a person has checked the gloss and niveau. */
  reviewed?: boolean;
}

interface VerbMeta {
  glossEn: string;
  level: Level;
  reviewed?: boolean;
}

/** Verbs the app teaches that the source list doesn't include. */
const EXTRA_VERBS: VerbEntry[] = [
  { id: 'v-cykle', level: 2, infinitive: 'cykle', present: 'cykler', past: 'cyklede', wrongPast: 'cyklte', participle: 'cyklet', verbClass: 'weak-ede', perfectAux: 'har', glossEn: 'to cycle' },
];

const META = VERB_META as Record<string, VerbMeta>;

export const VERB_BANK: VerbEntry[] = [
  ...(IMPORTED_VERBS as unknown as Omit<VerbEntry, 'level' | 'glossEn'>[]).flatMap((verb) => {
    const meta = META[verb.id];
    return meta ? [{ ...verb, ...meta }] : [];
  }),
  ...EXTRA_VERBS,
];

export function verbById(id: string): VerbEntry | undefined {
  return VERB_BANK.find((v) => v.id === id);
}
