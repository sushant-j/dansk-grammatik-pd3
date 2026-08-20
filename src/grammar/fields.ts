/**
 * Diderichsen's sætningsskema (the Danish field schema).
 *
 * This is the model Danish schools and every seriøs PD3 textbook actually use
 * to teach word order, and it is the thing this app exists to make interactive.
 * Two topologies, and the contrast between them IS the lesson:
 *
 *   HELSÆTNING (main clause)
 *     Forfelt | v finit | n subjekt | a centraladv. | V infinit | N objekt | A indholdsadv.
 *     "I går  | gik     | jeg       | ikke          |           |          | i skole"
 *              ^ position 2, always — this is the V2 rule
 *
 *   LEDSÆTNING (subordinate clause)
 *     k konj. | n subjekt | a centraladv. | v finit | V infinit | N objekt | A indholdsadv.
 *     "fordi  | jeg       | ikke          | kunne   | komme     |          |"
 *                          ^ adverbial BEFORE the finite verb — the "ikke-regel",
 *                            the exact mirror of the main clause, and the single
 *                            most common word-order error at PD3 level.
 *
 * Field ids are English-ish camelCase for code; `abbr` and `name` carry the
 * Danish terms the learner will meet in any classroom or textbook.
 */

export type FieldId =
  | 'forfelt'
  | 'konjunktional'
  | 'finitVerbum'
  | 'subjekt'
  | 'centraladverbial'
  | 'infinitVerbum'
  | 'objekt'
  | 'indholdsadverbial';

export type ClauseType = 'helsætning' | 'ledsætning';

export interface FieldDef {
  id: FieldId;
  /** Diderichsen's traditional one-letter abbreviation. */
  abbr: string;
  /** Danish name, as it appears in textbooks. */
  name: string;
  /** Plain-English gloss for learners who don't have the metalanguage yet. */
  gloss: string;
  /** What belongs here, in one learner-facing sentence. */
  hint: string;
  /** Most fields hold at most one constituent; N and A can hold several. */
  capacity: number;
  /** A field the learner may legitimately leave empty. */
  optional: boolean;
}

const FIELD_LIBRARY: Record<FieldId, Omit<FieldDef, 'capacity' | 'optional'>> = {
  forfelt: {
    id: 'forfelt',
    abbr: 'F',
    name: 'Forfelt',
    gloss: 'Front slot',
    hint: 'Exactly one thing goes here — whatever you choose to start the sentence with. It does not have to be the subject.',
  },
  konjunktional: {
    id: 'konjunktional',
    abbr: 'k',
    name: 'Konjunktional',
    gloss: 'Subordinator',
    hint: 'The word that makes this a subordinate clause: at, fordi, hvis, når, som, da…',
  },
  finitVerbum: {
    id: 'finitVerbum',
    abbr: 'v',
    name: 'Finit verbum',
    gloss: 'Finite verb',
    hint: 'The verb carrying the tense — gik, er, har, kan. In a main clause it is locked to slot 2.',
  },
  subjekt: {
    id: 'subjekt',
    abbr: 'n',
    name: 'Subjekt',
    gloss: 'Subject',
    hint: 'Who or what performs the action — unless it already sits in the Forfelt.',
  },
  centraladverbial: {
    id: 'centraladverbial',
    abbr: 'a',
    name: 'Centraladverbial',
    gloss: 'Central adverb',
    hint: 'Sentence adverbs: ikke, aldrig, altid, ofte, måske, jo, nok, kun.',
  },
  infinitVerbum: {
    id: 'infinitVerbum',
    abbr: 'V',
    name: 'Infinit verbum',
    gloss: 'Non-finite verb',
    hint: 'Infinitives and participles that follow a helping verb — har *spist*, vil *gå*.',
  },
  objekt: {
    id: 'objekt',
    abbr: 'N',
    name: 'Objekt',
    gloss: 'Object(s)',
    hint: 'What the verb acts on. Indirect object first, then direct.',
  },
  indholdsadverbial: {
    id: 'indholdsadverbial',
    abbr: 'A',
    name: 'Indholdsadverbial',
    gloss: 'Content adverbial',
    hint: 'Manner, place and time — hurtigt, i skole, hver dag.',
  },
};

function def(id: FieldId, capacity: number, optional: boolean): FieldDef {
  return { ...FIELD_LIBRARY[id], capacity, optional };
}

/**
 * Field order for a main clause. The order of this array IS the word order.
 *
 * Note the Forfelt's capacity of 2 even though the rule allows exactly one
 * constituent. That is deliberate: a board that refuses the second word makes
 * the classic "I går jeg gik" error impossible to express, and an error you
 * cannot make is an error nobody can teach you about. We let the learner build
 * it, then name the rule they just broke.
 */
export const HELSAETNING_FIELDS: FieldDef[] = [
  def('forfelt', 2, false),
  def('finitVerbum', 1, false),
  def('subjekt', 1, true),
  def('centraladverbial', 2, true),
  def('infinitVerbum', 2, true),
  def('objekt', 2, true),
  def('indholdsadverbial', 3, true),
];

/** Field order for a subordinate clause — note a before v. */
export const LEDSAETNING_FIELDS: FieldDef[] = [
  def('konjunktional', 1, false),
  def('subjekt', 1, false),
  def('centraladverbial', 2, true),
  def('finitVerbum', 1, false),
  def('infinitVerbum', 2, true),
  def('objekt', 2, true),
  def('indholdsadverbial', 3, true),
];

export function fieldsFor(clause: ClauseType): FieldDef[] {
  return clause === 'helsætning' ? HELSAETNING_FIELDS : LEDSAETNING_FIELDS;
}

export function fieldDef(clause: ClauseType, id: FieldId): FieldDef | undefined {
  return fieldsFor(clause).find((f) => f.id === id);
}
