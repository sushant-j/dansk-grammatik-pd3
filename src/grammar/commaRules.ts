/**
 * Comma rules.
 *
 * This domain is a different shape from the noun/adjective/verb modules: a
 * comma decision depends on the structure of a whole sentence, not on a
 * property of one word, so there is no small entry to generate a question
 * from — the exercise bank in `content/commaExamples.ts` is hand-written
 * sentence pairs, closer in spirit to the sætningsskema exercise bank than to
 * the noun/adjective/verb generators.
 *
 * Deliberately scoped to three rules that are genuinely unambiguous. Danish
 * comma rules have a real contested area — the "startkomma" before a fronted
 * subordinate clause is, under the modern (1996) rules, an optional stylistic
 * choice, not a grammatical requirement — and grading a style choice as a
 * right/wrong multiple-choice question would overstate how settled that rule
 * actually is. All three rules kept here hold without a hedge.
 */

export type CommaRuleId = 'comma-men-vs-og' | 'comma-list-items' | 'comma-relative-clause';

export interface CommaRuleExample {
  wrong: string;
  right: string;
  note: string;
}

export interface CommaRule {
  id: CommaRuleId;
  da: string;
  en: string;
  statement: string;
  explanation: string;
  whyHard: string;
  examples: CommaRuleExample[];
}

export const COMMA_RULES: Record<CommaRuleId, CommaRule> = {
  'comma-men-vs-og': {
    id: 'comma-men-vs-og',
    da: 'Komma før "men", ikke før "og"',
    en: 'Comma before "men", not before "og"',
    statement:
      '"Men" joining two clauses always takes a comma before it; "og" joining two actions with the same subject never does.',
    explanation:
      '"Men" signals a contrast between two complete thoughts, and Danish marks that break with a comma every time: "Jeg vil gerne, men jeg har ikke tid." "Og" is different — when it simply adds a second action to the same subject ("Han spiste morgenmad og gik i skole"), the two halves are not separate clauses at all, just one subject with two verbs, and a comma there is a genuine error, not a style choice.',
    whyHard:
      'English speakers often comma-splice before "and" out of habit from listing clauses, and the two conjunctions look similarly weighted, so it feels arbitrary that one takes a comma and the other actively forbids one.',
    examples: [
      {
        wrong: 'Jeg vil gerne komme men jeg har ikke tid.',
        right: 'Jeg vil gerne komme, men jeg har ikke tid.',
        note: '"Men" joins two full clauses, so it takes a comma.',
      },
      {
        wrong: 'Han spiste morgenmad, og gik i skole.',
        right: 'Han spiste morgenmad og gik i skole.',
        note: 'One subject, two verbs — not two clauses, so no comma before "og".',
      },
    ],
  },

  'comma-list-items': {
    id: 'comma-list-items',
    da: 'Komma i en opremsning',
    en: 'Commas in a list',
    statement:
      'Items in a list are separated by commas, but the final item — joined with "og" or "eller" — never gets a comma before that "og"/"eller".',
    explanation:
      'A list of three or more things is comma-separated the way you would expect — "mælk, brød, æg" — right up until the last item, where Danish uses "og" or "eller" alone with no comma in front of it: "mælk, brød, æg og smør". This is a firm rule in Danish, unlike English, which tolerates a comma before "and" in a list as a matter of house style (the "Oxford comma"). Danish does not have that option.',
    whyHard:
      'Learners who have seen the Oxford comma taught as acceptable, or even correct, in English carry that habit over — and because both versions look equally plausible, the extra comma is easy to add without noticing.',
    examples: [
      {
        wrong: 'Jeg købte mælk, brød, æg, og smør.',
        right: 'Jeg købte mælk, brød, æg og smør.',
        note: 'No comma before the final "og" in a list — ever.',
      },
      {
        wrong: 'Hun kan tale engelsk, tysk, og fransk.',
        right: 'Hun kan tale engelsk, tysk og fransk.',
        note: 'Same rule with three items instead of four.',
      },
    ],
  },

  'comma-relative-clause': {
    id: 'comma-relative-clause',
    da: 'Komma om en tilføjet relativsætning',
    en: 'Commas around a non-defining relative clause',
    statement:
      'A relative clause that adds extra information about someone or something already uniquely identified is set off with commas on both sides.',
    explanation:
      'When the noun a relative clause attaches to can only refer to one thing — "min bror", "min mor", "København" — the "som"-clause cannot be narrowing down which one you mean; there is only one. It is purely extra information, and Danish marks that with a comma before and after it: "Min bror, som bor i Aarhus, kommer på besøg." Leaving the commas out reads as though the clause were essential to identifying which brother, which does not make sense when there is only one.',
    whyHard:
      'The comma pair is easy to forget because the sentence still parses without it — nothing looks broken, it just quietly loses the signal that the clause is optional background rather than the main information.',
    examples: [
      {
        wrong: 'Min bror som bor i Aarhus kommer på besøg i morgen.',
        right: 'Min bror, som bor i Aarhus, kommer på besøg i morgen.',
        note: '"Min bror" already picks out one specific person — the "som"-clause is extra, so it takes commas on both sides.',
      },
      {
        wrong: 'København som er Danmarks hovedstad har mange museer.',
        right: 'København, som er Danmarks hovedstad, har mange museer.',
        note: 'There is only one København — the clause adds information, it does not narrow anything down.',
      },
    ],
  },
};

export const ALL_COMMA_RULE_IDS = Object.keys(COMMA_RULES) as CommaRuleId[];

export function commaRule(id: CommaRuleId): CommaRule {
  return COMMA_RULES[id];
}
