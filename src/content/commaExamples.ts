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

import type { CommaRuleId } from '../grammar/commaRules';

export interface CommaEntry {
  id: string;
  ruleId: CommaRuleId;
  correct: string;
  incorrect: string;
  explanation: string;
}

export const COMMA_EXAMPLES: CommaEntry[] = [
  // ── men vs. og ──────────────────────────────────────────────────────
  {
    id: 'c-men-1',
    ruleId: 'comma-men-vs-og',
    correct: 'Jeg vil gerne komme, men jeg har ikke tid.',
    incorrect: 'Jeg vil gerne komme men jeg har ikke tid.',
    explanation: '"Men" joins two full clauses, so it takes a comma before it — every time.',
  },
  {
    id: 'c-men-2',
    ruleId: 'comma-men-vs-og',
    correct: 'Hun elsker at rejse, men hun har ikke mange penge.',
    incorrect: 'Hun elsker at rejse men hun har ikke mange penge.',
    explanation: 'Two full clauses joined by "men" — the comma is required, not optional.',
  },
  {
    id: 'c-men-3',
    ruleId: 'comma-men-vs-og',
    correct: 'Det var koldt, men solen skinnede.',
    incorrect: 'Det var koldt men solen skinnede.',
    explanation: '"Men" always takes a comma before it when it connects two clauses.',
  },
  {
    id: 'c-og-1',
    ruleId: 'comma-men-vs-og',
    correct: 'Han spiste morgenmad og gik i skole.',
    incorrect: 'Han spiste morgenmad, og gik i skole.',
    explanation: 'One subject ("han"), two verbs — this is not two clauses, so "og" takes no comma.',
  },
  {
    id: 'c-og-2',
    ruleId: 'comma-men-vs-og',
    correct: 'Vi kan tage bussen eller gå til fods.',
    incorrect: 'Vi kan tage bussen, eller gå til fods.',
    explanation: 'Same pattern with "eller" — one subject choosing between two actions, no comma.',
  },

  // ── list items ────────────────────────────────────────────────────────
  {
    id: 'c-list-1',
    ruleId: 'comma-list-items',
    correct: 'Jeg købte mælk, brød, æg og smør.',
    incorrect: 'Jeg købte mælk, brød, æg, og smør.',
    explanation: 'Danish never puts a comma before the final "og" in a list.',
  },
  {
    id: 'c-list-2',
    ruleId: 'comma-list-items',
    correct: 'Hun kan tale engelsk, tysk og fransk.',
    incorrect: 'Hun kan tale engelsk, tysk, og fransk.',
    explanation: 'Three items, and still no comma before the last "og".',
  },
  {
    id: 'c-list-3',
    ruleId: 'comma-list-items',
    correct: 'Vi skal besøge Danmark, Sverige og Norge i sommer.',
    incorrect: 'Vi skal besøge Danmark, Sverige, og Norge i sommer.',
    explanation: 'The Oxford-comma option some English style guides allow does not exist in Danish.',
  },
  {
    id: 'c-list-4',
    ruleId: 'comma-list-items',
    correct: 'Han arbejder om mandag, tirsdag og onsdag.',
    incorrect: 'Han arbejder om mandag, tirsdag, og onsdag.',
    explanation: 'Same rule again — the comma stops one item before the final "og".',
  },

  // ── non-defining relative clause ──────────────────────────────────────
  {
    id: 'c-rel-1',
    ruleId: 'comma-relative-clause',
    correct: 'Min bror, som bor i Aarhus, kommer på besøg i morgen.',
    incorrect: 'Min bror som bor i Aarhus kommer på besøg i morgen.',
    explanation: '"Min bror" already picks out one person, so the "som"-clause is extra information — it needs commas on both sides.',
  },
  {
    id: 'c-rel-2',
    ruleId: 'comma-relative-clause',
    correct: 'Min mor, som er 65 år, arbejder stadig.',
    incorrect: 'Min mor som er 65 år arbejder stadig.',
    explanation: 'Only one "min mor" is possible, so the age is added information, not identifying information — comma pair required.',
  },
  {
    id: 'c-rel-3',
    ruleId: 'comma-relative-clause',
    correct: 'København, som er Danmarks hovedstad, har mange museer.',
    incorrect: 'København som er Danmarks hovedstad har mange museer.',
    explanation: 'There is only one København — the clause adds a fact, it does not narrow down which city.',
  },
  {
    id: 'c-rel-4',
    ruleId: 'comma-relative-clause',
    correct: 'Min chef, som lige er kommet tilbage fra ferie, holder møde i dag.',
    incorrect: 'Min chef som lige er kommet tilbage fra ferie holder møde i dag.',
    explanation: '"Min chef" is already unique in context — the clause is background, so it takes commas on both sides.',
  },
];

export function commaExamplesForRule(ruleId: CommaRuleId): CommaEntry[] {
  return COMMA_EXAMPLES.filter((e) => e.ruleId === ruleId);
}
