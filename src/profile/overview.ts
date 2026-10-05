/**
 * Cross-domain review — the app-wide answer to "what should I do next?".
 *
 * Every trainer (sætningsskema, verbs, nouns, adjectives, comma, spelling,
 * vocabulary, and each grammar-drill domain) keeps its own per-item mastery via the shared `mastery.ts`.
 * But the home screen's headline recommendation historically looked only at
 * the word-order map, which quietly broke the app's core promise: a learner
 * solid on word order but shaky on verbs was told "you're doing great" and
 * pointed at a word-order gap that wasn't their real one.
 *
 * This module rolls every domain up to one honest picture. It works at the
 * *domain* level, not the item level, on purpose: the trainers are per-rule
 * (a handful of items each) but vocabulary is per-word (dozens), so an
 * item-level "weakest across everything" list would drown in vocabulary
 * cards. One row per trainer, counting what needs attention, keeps every
 * domain weighted fairly.
 */

import { ruleProgress, type RuleStat } from './store';
import type { Level } from '../content/levels';
import { vocabProgress } from './vocabStore';
import { nounRuleProgress } from './nounStore';
import { adjectiveRuleProgress } from './adjectiveStore';
import { verbRuleProgress } from './verbStore';
import { commaRuleProgress } from './commaStore';
import { spellingRuleProgress } from './spellingStore';
import type { ItemStat, MasteryLevel } from './mastery';
import { drillRuleProgress, type DrillStats } from '../drills/drillExercise';
import { drillRoute, LIVE_DRILL_DOMAINS, type DrillDomain, type DrillDomainKey } from '../drills/registry';

export type DomainKey =
  | 'grammar'
  | 'verbs'
  | 'nouns'
  | 'adjectives'
  | 'comma'
  | 'spelling'
  | 'vocab'
  | DrillDomainKey;

export interface DomainReview {
  key: DomainKey;
  /** English module name, matching the trainer's own screen title. */
  label: string;
  /** expo-router path the "review this" action should push. */
  route: string;
  /** Items that are shaky or developing — the open gaps in this domain. */
  attention: number;
  /** Items at solid or mastered. */
  solid: number;
  total: number;
  /** True once the learner has attempted anything in this domain. */
  started: boolean;
}

/** All that the tally needs from a progress row — every domain's shape fits. */
type MinimalProgress = { level: MasteryLevel; attempts: number };

function tally(progress: MinimalProgress[]): Omit<DomainReview, 'key' | 'label' | 'route'> {
  let attention = 0;
  let solid = 0;
  let started = false;
  for (const p of progress) {
    if (p.attempts > 0) started = true;
    if (p.level === 'solid' || p.level === 'mastered') solid++;
    // "Attention" mirrors the word-order map's openGaps: a gap you have
    // demonstrated, not something merely unseen. Decayed items already fall
    // to developing/shaky, so they are captured here too without a separate
    // needsRefresh clause.
    else if (p.level === 'shaky' || p.level === 'developing') attention++;
  }
  return { attention, solid, total: progress.length, started };
}

/** Stats for every domain, as held by their respective zustand stores. */
export interface OverviewStats {
  grammar: Record<string, RuleStat>;
  verbs: Record<string, ItemStat>;
  nouns: Record<string, ItemStat>;
  adjectives: Record<string, ItemStat>;
  comma: Record<string, ItemStat>;
  spelling: Record<string, ItemStat>;
  vocab: Record<string, ItemStat>;
  /** Per drill domain, per topic. A domain missing here counts as untouched. */
  drills: Partial<Record<DrillDomainKey, DrillStats>>;
  /** Vocabulary counts only the deck up to the learner's niveau, or 1,400 words would swamp every total. */
  vocabLevel?: Level;
}

/**
 * One row per trainer. Drill domains come from the registry, one row each,
 * leaving out any without topics yet (`drillDomains` is injectable so tests
 * can use a fixture). A drill domain is tallied per topic, exactly like the
 * hand-built trainers are per rule — and since `tally` only ever counts
 * practised topics as attention, a ten-topic domain the learner has not
 * opened adds nothing to the "widest gap", however many topics it has.
 */
export function crossDomainReview(
  s: OverviewStats,
  now = Date.now(),
  drillDomains: DrillDomain[] = LIVE_DRILL_DOMAINS,
): DomainReview[] {
  const domains: DomainReview[] = [
    { key: 'grammar', label: 'Word order', route: '/train', ...tally(ruleProgress(s.grammar, now)) },
    { key: 'verbs', label: 'Verb forms', route: '/verbs', ...tally(verbRuleProgress(s.verbs, now)) },
    { key: 'nouns', label: 'Gender: en / et', route: '/nouns', ...tally(nounRuleProgress(s.nouns, now)) },
    { key: 'adjectives', label: 'Adjective agreement', route: '/adjectives', ...tally(adjectiveRuleProgress(s.adjectives, now)) },
    { key: 'comma', label: 'Comma rules', route: '/comma', ...tally(commaRuleProgress(s.comma, now)) },
    { key: 'spelling', label: 'Spelling', route: '/spelling', ...tally(spellingRuleProgress(s.spelling, now)) },
    { key: 'vocab', label: 'Vocabulary', route: '/vocab', ...tally(vocabProgress(s.vocab, now, s.vocabLevel)) },
    ...drillDomains
      // An empty domain would also make the solid/total tiebreak below NaN.
      .filter((d) => d.rules.length > 0)
      .map((d) => ({
        key: d.key,
        label: d.label,
        route: drillRoute(d.key),
        ...tally(drillRuleProgress(d, s.drills[d.key] ?? {}, now)),
      })),
  ];

  // Most open gaps first; ties broken by the smaller solid fraction, so a
  // barely-started domain outranks a nearly-complete one at the same count.
  return domains.sort(
    (a, b) => b.attention - a.attention || a.solid / a.total - b.solid / b.total,
  );
}

export interface OverviewSummary {
  totalSolid: number;
  totalItems: number;
  totalAttention: number;
  /** Items never attempted — solid + attention + unseen === total. */
  totalUnseen: number;
  /** True once anything anywhere has been attempted. */
  started: boolean;
  /** The domain with the most open gaps, or undefined when all are clear. */
  widestGap?: DomainReview;
}

export function summarizeOverview(domains: DomainReview[]): OverviewSummary {
  const totalSolid = domains.reduce((n, d) => n + d.solid, 0);
  const totalItems = domains.reduce((n, d) => n + d.total, 0);
  const totalAttention = domains.reduce((n, d) => n + d.attention, 0);
  const totalUnseen = totalItems - totalSolid - totalAttention;
  const started = domains.some((d) => d.started);
  // domains is pre-sorted by crossDomainReview; the first with an open gap is
  // the widest.
  const widestGap = domains.find((d) => d.attention > 0);
  return { totalSolid, totalItems, totalAttention, totalUnseen, started, widestGap };
}
