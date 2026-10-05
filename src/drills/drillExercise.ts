/**
 * Question picking and mastery for every drill domain.
 *
 * The same shape as commaStore/commaExercise — mastery per topic (a learner
 * shaky on "var vs havde" across several sentences has a gap in that rule,
 * not in those sentences), weakest topic first, niveau-capped pools — but
 * written once against a `DrillDomain` instead of once per domain. Every
 * function takes the domain object rather than a key, so tests can hand in a
 * small fixture domain instead of depending on the content bank.
 */

import { MAX_LEVEL, poolForLevel, type Level } from '../content/levels';
import { EMPTY_STAT, progressFor, type ItemProgress, type ItemStat } from '../profile/mastery';
import type { DrillDomain, DrillItem } from './registry';

/** Per-topic stats for one domain, keyed by topic (rule) id. */
export type DrillStats = Record<string, ItemStat>;

/** The gap every prompt carries exactly one of. */
export const GAP = '___';

export interface DrillQuestion {
  item: DrillItem;
  ruleId: string;
  /** The item's options, shuffled. */
  options: string[];
  correctIndex: number;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffle on every serving: content writers tend to put the answer first, and
 * a learner who notices that stops reading the sentence.
 */
export function buildDrillQuestion(item: DrillItem, rng: () => number = Math.random): DrillQuestion {
  const options = shuffle(item.options, rng);
  return { item, ruleId: item.ruleId, options, correctIndex: options.indexOf(item.answer) };
}

/**
 * The option that means "no word belongs here" — for topics where leaving the
 * slot empty is the right answer (no article, no "at", no direction adverb).
 * Content writes it as this literal; the screen never shows it as is.
 */
export const NO_WORD = '(ingen)';

/** How an option reads on its button. */
export function optionLabel(option: string): string {
  return option === NO_WORD ? '— (no word)' : option;
}

/**
 * The prompt split around its gap, for rendering the gap as its own element.
 *
 * With `fill` set to NO_WORD the gap is closed up instead: the two spaces
 * that framed it become one (or none before punctuation), and a sentence that
 * began with the gap gets its capital back — so "Hun er ___ lærer." reads
 * "Hun er lærer.", not "Hun er  lærer.".
 */
export function splitPrompt(prompt: string, fill?: string): { before: string; after: string } {
  const i = prompt.indexOf(GAP);
  if (i < 0) return { before: prompt, after: '' };
  let before = prompt.slice(0, i);
  let after = prompt.slice(i + GAP.length);
  if (fill === NO_WORD) {
    before = before.replace(/\s+$/, '');
    after = after.replace(/^\s+/, '');
    if (!before) after = after.charAt(0).toUpperCase() + after.slice(1);
    else if (after && !/^[.,!?;:]/.test(after)) before += ' ';
  }
  return { before, after };
}

export type DrillRuleProgress = ItemProgress<string>;

export function drillRuleProgress(domain: DrillDomain, stats: DrillStats, now = Date.now()): DrillRuleProgress[] {
  return domain.rules.map((r) => progressFor(r.id, stats[r.id] ?? EMPTY_STAT, now));
}

export interface DrillSummary {
  solid: number;
  total: number;
  /** Undefined only for a domain with no topics. */
  weakest?: DrillRuleProgress;
}

export function summarizeDrill(domain: DrillDomain, stats: DrillStats, now = Date.now()): DrillSummary {
  const progress = drillRuleProgress(domain, stats, now);
  const weakest = [...progress].sort((a, b) => a.strength - b.strength)[0];
  return {
    solid: progress.filter((p) => p.level === 'solid' || p.level === 'mastered').length,
    total: progress.length,
    weakest,
  };
}

export interface NextDrillOptions {
  /** Drill this topic only. Without it, the weakest topic in the domain. */
  topicId?: string;
  rng?: () => number;
}

/**
 * The next question in a domain, or null when there is nothing to serve (a
 * domain or topic with no items yet).
 *
 * Mixed practice picks the weakest topic with the same scoring as the comma
 * trainer — unseen topics sit at a middling 0.55 so they get introduced
 * without crowding out a demonstrated gap, plus a little noise so one stuck
 * topic does not monopolise the session. Topics without items are skipped:
 * they cannot be served, and picking one would stall the trainer.
 *
 * Within the topic the pool is capped at the learner's niveau (poolForLevel,
 * with its fallback to the easiest items when nothing is that easy). The item
 * just answered is never served again straight away: if the niveau slice
 * holds only that one, the rest of the topic's eligible items are used
 * instead. Only a topic with a single item can repeat.
 */
export function nextDrillQuestion(
  domain: DrillDomain,
  stats: DrillStats,
  lastItemId?: string,
  now = Date.now(),
  level: Level = MAX_LEVEL,
  { topicId, rng = Math.random }: NextDrillOptions = {},
): DrillQuestion | null {
  const servable = new Set(domain.items.map((i) => i.ruleId));

  let ruleId: string | undefined;
  if (topicId !== undefined) {
    ruleId = servable.has(topicId) ? topicId : undefined;
  } else {
    ruleId = drillRuleProgress(domain, stats, now)
      .filter((p) => servable.has(p.id))
      .map((p) => ({ id: p.id, score: (p.attempts ? 1 - p.strength : 0.55) + rng() * 0.2 }))
      .sort((a, b) => b.score - a.score)[0]?.id;
  }
  if (ruleId === undefined) return null;

  const topicItems = domain.items.filter((i) => i.ruleId === ruleId);
  const pool = poolForLevel(topicItems, level, rng);
  let candidates = pool.filter((i) => i.id !== lastItemId);
  if (candidates.length === 0) {
    // The niveau slice was just the last item. Widen to everything this
    // learner may see in the topic (or, failing that, the whole topic).
    const eligible = topicItems.filter((i) => i.level <= level);
    candidates = (eligible.length ? eligible : topicItems).filter((i) => i.id !== lastItemId);
  }
  const item = candidates.length ? candidates[Math.floor(rng() * candidates.length)] : pool[0];
  return buildDrillQuestion(item, rng);
}
