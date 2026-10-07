/**
 * Every rule in the app, from every family, in one lookup.
 *
 * The rules live where their trainer needs them — word order in `rules.ts`,
 * the form trainers in their own modules, the drill topics in JSON — and each
 * family has its own id type. The path and the rule book need to treat them
 * as one collection, so this flattens them into a single shape (the rules
 * pane's, plus where the rule comes from) keyed by rule id. That only works
 * because rule ids are unique across families, which `curriculum.test.ts`
 * holds.
 */

import { ADJECTIVE_RULES } from '../grammar/adjectiveRules';
import { COMMA_RULES } from '../grammar/commaRules';
import { NOUN_RULES } from '../grammar/nounRules';
import { RULES } from '../grammar/rules';
import { SPELLING_RULES } from '../grammar/spellingRules';
import { VERB_RULES } from '../grammar/verbRules';
import { DRILL_DOMAINS, drillRoute, type DrillDomainKey } from '../drills/registry';
import { DOMAIN_LABELS, DOMAIN_ROUTES } from '../profile/levelStore';
import type { PaneRule } from '../ui/RulesPane';

/** Where a rule's exercises and mastery live: a trainer's domain. */
export type RuleFamily = 'grammar' | 'verbs' | 'nouns' | 'adjectives' | 'comma' | 'spelling' | DrillDomainKey;

export interface IndexedRule extends PaneRule {
  family: RuleFamily;
  /** Why learners get it wrong; the drill topics don't have one. */
  whyHard?: string;
  /** The trainer's name, e.g. "Word order" or "Prepositions". */
  familyLabel: string;
  /** Free practice of this rule outside the path. */
  practiceRoute: string;
}

function fromFamily(family: RuleFamily, rules: Record<string, PaneRule & { whyHard?: string }>): IndexedRule[] {
  return Object.values(rules).map((r) => ({
    id: r.id,
    da: r.da,
    en: r.en,
    statement: r.statement,
    explanation: r.explanation,
    examples: r.examples,
    whyHard: r.whyHard,
    family,
    familyLabel: DOMAIN_LABELS[family],
    practiceRoute: DOMAIN_ROUTES[family],
  }));
}

export const ALL_INDEXED_RULES: IndexedRule[] = [
  ...fromFamily('grammar', RULES),
  ...fromFamily('verbs', VERB_RULES),
  ...fromFamily('nouns', NOUN_RULES),
  ...fromFamily('adjectives', ADJECTIVE_RULES),
  ...fromFamily('comma', COMMA_RULES),
  ...fromFamily('spelling', SPELLING_RULES),
  ...DRILL_DOMAINS.flatMap((d) =>
    d.rules.map((r) => ({
      id: r.id,
      da: r.da,
      en: r.en,
      statement: r.statement,
      explanation: r.explanation,
      examples: r.examples,
      family: d.key,
      familyLabel: d.label,
      // A drill topic opens straight into its own practice.
      practiceRoute: `${drillRoute(d.key)}?topic=${encodeURIComponent(r.id)}`,
    })),
  ),
];

const BY_ID = new Map(ALL_INDEXED_RULES.map((r) => [r.id, r]));

export function indexedRule(id: string): IndexedRule | undefined {
  return BY_ID.get(id);
}
