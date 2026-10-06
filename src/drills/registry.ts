/**
 * Every grammar-drill domain, and the one place they are listed.
 *
 * The older trainers (nouns, verbs, comma, spelling, …) are each a set of
 * hand-wired files: rules, a bank, a question builder, a store, a screen.
 * That was fine for six of them; it would not be for eleven more with ~75
 * topics between them. A drill domain is instead pure content — a
 * `rules.json` of topics and an `items.json` of gap-fill questions — and
 * this registry is the only code that knows a given domain exists. Everything
 * else that must list domains (the progress log, niveau climb, overview,
 * Practise, Progress, Settings) derives its list from `DRILL_DOMAIN_KEYS` /
 * `DRILL_DOMAINS` here, so adding a domain is: a folder of JSON, one row in
 * `META`, and two imports.
 *
 * Kept free of runtime dependencies (the PaneRule import is type-only): the
 * sync layer imports this, and that has to load in a plain node test.
 */

import type { Level } from '../content/levels';
import type { PaneRule } from '../ui/RulesPane';

import adjectiveUsageItems from '../content/drills/adjective-usage/items.json';
import adjectiveUsageRules from '../content/drills/adjective-usage/rules.json';
import adverbsItems from '../content/drills/adverbs/items.json';
import adverbsRules from '../content/drills/adverbs/rules.json';
import conjunctionsItems from '../content/drills/conjunctions/items.json';
import conjunctionsRules from '../content/drills/conjunctions/rules.json';
import modalVerbsItems from '../content/drills/modal-verbs/items.json';
import modalVerbsRules from '../content/drills/modal-verbs/rules.json';
import nounUsageItems from '../content/drills/noun-usage/items.json';
import nounUsageRules from '../content/drills/noun-usage/rules.json';
import prepositionsItems from '../content/drills/prepositions/items.json';
import prepositionsRules from '../content/drills/prepositions/rules.json';
import pronounsItems from '../content/drills/pronouns/items.json';
import pronounsRules from '../content/drills/pronouns/rules.json';
import verbBliveFaaItems from '../content/drills/verb-blive-faa/items.json';
import verbBliveFaaRules from '../content/drills/verb-blive-faa/rules.json';
import verbTensesItems from '../content/drills/verb-tenses/items.json';
import verbTensesRules from '../content/drills/verb-tenses/rules.json';
import wordChoiceOtherItems from '../content/drills/word-choice-other/items.json';
import wordChoiceOtherRules from '../content/drills/word-choice-other/rules.json';
import wordChoiceVerbsItems from '../content/drills/word-choice-verbs/items.json';
import wordChoiceVerbsRules from '../content/drills/word-choice-verbs/rules.json';

/** A drill topic: a rule card in the pane, plus the niveau it is introduced at. */
export interface DrillRule extends PaneRule {
  level: Level;
}

/** One gap-fill question. `prompt` holds exactly one `___`; `answer` is one of `options`. */
export interface DrillItem {
  id: string;
  /** Niveau 1–5 (see levels.ts): when the trainer starts serving this item. */
  level: Level;
  /** The topic (DrillRule id) this item is evidence for. */
  ruleId: string;
  prompt: string;
  options: string[];
  answer: string;
  /** English: why the answer is right, naming the rule and the clue in the sentence. */
  explanation: string;
  /** False until a person has checked the Danish. */
  reviewed: boolean;
}

/** Where a domain sits on the Practise tab. */
export type DrillGroup = 'Verbs' | 'Word forms' | 'Small words' | 'Words';

/**
 * The keys, as a literal tuple so `DrillDomainKey` is a real union: the log,
 * niveau and overview maps are typed `Record<…, …>` over it and the compiler
 * catches a domain left out of any of them. They double as progress-log
 * domain names, so a key must never change once it has shipped.
 */
export const DRILL_DOMAIN_KEYS = [
  'verb-tenses',
  'verb-blive-faa',
  'modal-verbs',
  'noun-usage',
  'adjective-usage',
  'adverbs',
  'pronouns',
  'conjunctions',
  'prepositions',
  'word-choice-verbs',
  'word-choice-other',
] as const;

export type DrillDomainKey = (typeof DRILL_DOMAIN_KEYS)[number];

export interface DrillDomain {
  key: DrillDomainKey;
  /** English trainer name, as on Practise, Progress and the screen heading. */
  label: string;
  group: DrillGroup;
  /** One line under the label on Practise and the topic list. */
  blurb: string;
  /** Every topic id and item id in this domain starts with it. */
  prefix: string;
  rules: DrillRule[];
  items: DrillItem[];
}

type Meta = Omit<DrillDomain, 'key' | 'rules' | 'items'>;

const META: Record<DrillDomainKey, Meta> = {
  'verb-tenses': {
    label: 'Tenses in use',
    group: 'Verbs',
    prefix: 'vt-',
    blurb: 'Past or perfect, "at" or not — picking the right form in a real sentence.',
  },
  'verb-blive-faa': {
    label: 'Være/blive, have/få',
    group: 'Verbs',
    prefix: 'vb-',
    blurb: 'A state or a change: "var" or "blev", "har" or "får".',
  },
  'modal-verbs': {
    label: 'Modal verbs',
    group: 'Verbs',
    prefix: 'mv-',
    blurb: 'Skal, vil, må, kan, bør — and their passives.',
  },
  'noun-usage': {
    label: 'Nouns in use',
    group: 'Word forms',
    prefix: 'nu-',
    blurb: 'Plural, definite or no article at all.',
  },
  'adjective-usage': {
    label: 'Adjectives in use',
    group: 'Word forms',
    prefix: 'au-',
    blurb: 'God, godt or gode — plus al/alt/alle and hel/helt/hele.',
  },
  adverbs: {
    label: 'Adverbs',
    group: 'Word forms',
    prefix: 'ad-',
    blurb: 'Ud or ude, hjem or hjemme — and when an adverb takes -t.',
  },
  pronouns: {
    label: 'Pronouns',
    group: 'Small words',
    prefix: 'pr-',
    blurb: 'Han or ham, hans or sin, det or der.',
  },
  conjunctions: {
    label: 'Conjunctions',
    group: 'Small words',
    prefix: 'cj-',
    blurb: 'Hvis or om, da or når, for or fordi.',
  },
  prepositions: {
    label: 'Prepositions & time',
    group: 'Small words',
    prefix: 'pp-',
    blurb: 'For or til, af or fra — and "i går", "om en uge", "for to år siden".',
  },
  'word-choice-verbs': {
    label: 'Tricky verbs',
    group: 'Words',
    prefix: 'wv-',
    blurb: 'Vide or kende, sige or fortælle, tro or synes.',
  },
  'word-choice-other': {
    label: 'Tricky words',
    group: 'Words',
    prefix: 'wo-',
    blurb: 'Længe or lang tid, kun or bare, anderledes or forskellig.',
  },
};

// The JSON is typed by inference (and `[]` infers as never[]), so it is
// cast to the contract here; drills.test.ts is what actually enforces it.
const CONTENT: Record<DrillDomainKey, { rules: unknown; items: unknown }> = {
  'verb-tenses': { rules: verbTensesRules, items: verbTensesItems },
  'verb-blive-faa': { rules: verbBliveFaaRules, items: verbBliveFaaItems },
  'modal-verbs': { rules: modalVerbsRules, items: modalVerbsItems },
  'noun-usage': { rules: nounUsageRules, items: nounUsageItems },
  'adjective-usage': { rules: adjectiveUsageRules, items: adjectiveUsageItems },
  adverbs: { rules: adverbsRules, items: adverbsItems },
  pronouns: { rules: pronounsRules, items: pronounsItems },
  conjunctions: { rules: conjunctionsRules, items: conjunctionsItems },
  prepositions: { rules: prepositionsRules, items: prepositionsItems },
  'word-choice-verbs': { rules: wordChoiceVerbsRules, items: wordChoiceVerbsItems },
  'word-choice-other': { rules: wordChoiceOtherRules, items: wordChoiceOtherItems },
};

export const DRILL_DOMAINS: DrillDomain[] = DRILL_DOMAIN_KEYS.map((key) => ({
  key,
  ...META[key],
  rules: CONTENT[key].rules as DrillRule[],
  items: CONTENT[key].items as DrillItem[],
}));

const BY_KEY = Object.fromEntries(DRILL_DOMAINS.map((d) => [d.key, d])) as Record<DrillDomainKey, DrillDomain>;

export function isDrillDomainKey(value: unknown): value is DrillDomainKey {
  return typeof value === 'string' && (DRILL_DOMAIN_KEYS as readonly string[]).includes(value);
}

export function drillDomain(key: DrillDomainKey): DrillDomain {
  return BY_KEY[key];
}

/**
 * Whether a domain has anything to show. A domain with no topics yet is still
 * registered — its key is a valid log domain, so answers recorded by a newer
 * build replay fine — but it is left off Practise, Progress, Settings and the
 * overview rather than shown as an empty, unopenable trainer.
 */
export function isDrillDomainLive(d: DrillDomain): boolean {
  return d.rules.length > 0;
}

/** Domains with content, in registry order. */
export const LIVE_DRILL_DOMAINS: DrillDomain[] = DRILL_DOMAINS.filter(isDrillDomainLive);

/** Expo-router path of a domain's trainer. */
export function drillRoute(key: DrillDomainKey): string {
  return `/drill/${key}`;
}
