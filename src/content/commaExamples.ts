/**
 * Comma exercise bank.
 *
 * Unlike the noun/adjective/verb banks, there is no small per-item property
 * to generate a multiple-choice question from — a comma decision depends on
 * the shape of the whole sentence. So each entry here already is the
 * question: a correct and an incorrect punctuation of the same sentence.
 *
 * Every "comma-relative-clause" sentence deliberately uses a referent that
 * can only mean one thing (a possessive family member, a named city) so the
 * relative clause is unambiguously non-defining. A sentence where the
 * restrictive/non-restrictive reading is genuinely debatable would teach the
 * exercise's own ambiguity as if it were a clean rule violation.
 */

import SEED from './data/comma.json';
import type { CommaRuleId } from '../grammar/commaRules';
import type { Level } from './levels';

export interface CommaEntry {
  id: string;
  /** Niveau 1–5 (see levels.ts): when the trainer starts serving this item. */
  level: Level;
  ruleId: CommaRuleId;
  correct: string;
  incorrect: string;
  explanation: string;
  /** False until a person has checked the Danish; hand-written items are treated as checked. */
  reviewed?: boolean;
}

/** Hand-written originals. */
const HAND_WRITTEN: CommaEntry[] = [
  // ── men vs. og ──────────────────────────────────────────────────────
  {
    id: 'c-men-1',
    level: 2,
    ruleId: 'comma-men-vs-og',
    correct: 'Jeg vil gerne komme, men jeg har ikke tid.',
    incorrect: 'Jeg vil gerne komme men jeg har ikke tid.',
    explanation: '"Men" joins two full clauses, so it takes a comma before it — every time.',
  },
  {
    id: 'c-men-2',
    level: 2,
    ruleId: 'comma-men-vs-og',
    correct: 'Hun elsker at rejse, men hun har ikke mange penge.',
    incorrect: 'Hun elsker at rejse men hun har ikke mange penge.',
    explanation: 'Two full clauses joined by "men" — the comma is required, not optional.',
  },
  {
    id: 'c-men-3',
    level: 2,
    ruleId: 'comma-men-vs-og',
    correct: 'Det var koldt, men solen skinnede.',
    incorrect: 'Det var koldt men solen skinnede.',
    explanation: '"Men" always takes a comma before it when it connects two clauses.',
  },
  {
    id: 'c-og-1',
    level: 2,
    ruleId: 'comma-men-vs-og',
    correct: 'Han spiste morgenmad og gik i skole.',
    incorrect: 'Han spiste morgenmad, og gik i skole.',
    explanation: 'One subject ("han"), two verbs — this is not two clauses, so "og" takes no comma.',
  },
  {
    id: 'c-og-2',
    level: 2,
    ruleId: 'comma-men-vs-og',
    correct: 'Vi kan tage bussen eller gå til fods.',
    incorrect: 'Vi kan tage bussen, eller gå til fods.',
    explanation: 'Same pattern with "eller" — one subject choosing between two actions, no comma.',
  },

  // ── list items ────────────────────────────────────────────────────────
  {
    id: 'c-list-1',
    level: 2,
    ruleId: 'comma-list-items',
    correct: 'Jeg købte mælk, brød, æg og smør.',
    incorrect: 'Jeg købte mælk, brød, æg, og smør.',
    explanation: 'Danish never puts a comma before the final "og" in a list.',
  },
  {
    id: 'c-list-2',
    level: 2,
    ruleId: 'comma-list-items',
    correct: 'Hun kan tale engelsk, tysk og fransk.',
    incorrect: 'Hun kan tale engelsk, tysk, og fransk.',
    explanation: 'Three items, and still no comma before the last "og".',
  },
  {
    id: 'c-list-3',
    level: 2,
    ruleId: 'comma-list-items',
    correct: 'Vi skal besøge Danmark, Sverige og Norge i sommer.',
    incorrect: 'Vi skal besøge Danmark, Sverige, og Norge i sommer.',
    explanation: 'The Oxford-comma option some English style guides allow does not exist in Danish.',
  },
  {
    id: 'c-list-4',
    level: 2,
    ruleId: 'comma-list-items',
    correct: 'Han arbejder om mandag, tirsdag og onsdag.',
    incorrect: 'Han arbejder om mandag, tirsdag, og onsdag.',
    explanation: 'Same rule again — the comma stops one item before the final "og".',
  },

  // ── non-defining relative clause ──────────────────────────────────────
  {
    id: 'c-rel-1',
    level: 3,
    ruleId: 'comma-relative-clause',
    correct: 'Min bror, som bor i Aarhus, kommer på besøg i morgen.',
    incorrect: 'Min bror som bor i Aarhus kommer på besøg i morgen.',
    explanation: '"Min bror" already picks out one person, so the "som"-clause is extra information — it needs commas on both sides.',
  },
  {
    id: 'c-rel-2',
    level: 3,
    ruleId: 'comma-relative-clause',
    correct: 'Min mor, som er 65 år, arbejder stadig.',
    incorrect: 'Min mor som er 65 år arbejder stadig.',
    explanation: 'Only one "min mor" is possible, so the age is added information, not identifying information — comma pair required.',
  },
  {
    id: 'c-rel-3',
    level: 3,
    ruleId: 'comma-relative-clause',
    correct: 'København, som er Danmarks hovedstad, har mange museer.',
    incorrect: 'København som er Danmarks hovedstad har mange museer.',
    explanation: 'There is only one København — the clause adds a fact, it does not narrow down which city.',
  },
  {
    id: 'c-rel-4',
    level: 4,
    ruleId: 'comma-relative-clause',
    correct: 'Min chef, som lige er kommet tilbage fra ferie, holder møde i dag.',
    incorrect: 'Min chef som lige er kommet tilbage fra ferie holder møde i dag.',
    explanation: '"Min chef" is already unique in context — the clause is background, so it takes commas on both sides.',
  },
  // ── comma after a fronted subordinate clause ────────────────────────
  {
    id: 'c-sub-1',
    level: 3,
    ruleId: 'comma-after-subclause',
    correct: 'Når jeg kommer hjem fra arbejde, laver jeg aftensmad.',
    incorrect: 'Når jeg kommer hjem fra arbejde laver jeg aftensmad.',
    explanation: 'The "når"-clause ends at "arbejde" — a comma closes it before the main clause, which starts with its verb "laver".',
  },
  {
    id: 'c-sub-2',
    level: 3,
    ruleId: 'comma-after-subclause',
    correct: 'Hvis du har spørgsmål, er du velkommen til at kontakte mig.',
    incorrect: 'Hvis du har spørgsmål er du velkommen til at kontakte mig.',
    explanation: 'A fronted "hvis"-clause is always closed with a comma before the main clause ("er du velkommen …").',
  },
];

/** Hand-written originals, then the drafted bank in data/comma.json. */
export const COMMA_EXAMPLES: CommaEntry[] = [...HAND_WRITTEN, ...(SEED as CommaEntry[])];

export function commaExamplesForRule(ruleId: CommaRuleId): CommaEntry[] {
  return COMMA_EXAMPLES.filter((e) => e.ruleId === ruleId);
}
