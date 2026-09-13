/**
 * Cross-domain review — the app-wide answer to "what should I do next?".
 *
 * Every trainer (sætningsskema, verbs, nouns, adjectives, comma, spelling,
 * vocabulary) keeps its own per-item mastery via the shared `mastery.ts`.
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
import { vocabProgress } from './vocabStore';
import { nounRuleProgress } from './nounStore';
import { adjectiveRuleProgress } from './adjectiveStore';
import { verbRuleProgress } from './verbStore';
import { commaRuleProgress } from './commaStore';
import { spellingRuleProgress } from './spellingStore';
import type { ItemStat, MasteryLevel } from './mastery';

export type DomainKey =
  | 'grammar'
  | 'verbs'
  | 'nouns'
  | 'adjectives'
  | 'comma'
  | 'spelling'
  | 'vocab';

export interface DomainReview {
  key: DomainKey;
  /** Danish module name, matching the trainer's own screen title. */
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
}

export function crossDomainReview(s: OverviewStats, now = Date.now()): DomainReview[] {
  const domains: DomainReview[] = [
    { key: 'grammar', label: 'Sætningsskema', route: '/train', ...tally(ruleProgress(s.grammar, now)) },
    { key: 'verbs', label: 'Datid og førnutid', route: '/verbs', ...tally(verbRuleProgress(s.verbs, now)) },
    { key: 'nouns', label: 'En-ord og et-ord', route: '/nouns', ...tally(nounRuleProgress(s.nouns, now)) },
    { key: 'adjectives', label: 'Adjektivets former', route: '/adjectives', ...tally(adjectiveRuleProgress(s.adjectives, now)) },
    { key: 'comma', label: 'Kommaregler', route: '/comma', ...tally(commaRuleProgress(s.comma, now)) },
    { key: 'spelling', label: 'Stavning', route: '/spelling', ...tally(spellingRuleProgress(s.spelling, now)) },
    { key: 'vocab', label: 'Ordforråd', route: '/vocab', ...tally(vocabProgress(s.vocab, now)) },
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
  /** True once anything anywhere has been attempted. */
  started: boolean;
  /** The domain with the most open gaps, or undefined when all are clear. */
  widestGap?: DomainReview;
}

export function summarizeOverview(domains: DomainReview[]): OverviewSummary {
  const totalSolid = domains.reduce((n, d) => n + d.solid, 0);
  const totalItems = domains.reduce((n, d) => n + d.total, 0);
  const totalAttention = domains.reduce((n, d) => n + d.attention, 0);
  const started = domains.some((d) => d.started);
  // domains is pre-sorted by crossDomainReview; the first with an open gap is
  // the widest.
  const widestGap = domains.find((d) => d.attention > 0);
  return { totalSolid, totalItems, totalAttention, started, widestGap };
}
