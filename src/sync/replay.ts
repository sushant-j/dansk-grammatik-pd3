/**
 * Rebuild all progress from baselines and the event log.
 *
 * Pure and deterministic: the same baselines and events, in any order, always
 * give the same result, because events are sorted by (time, id) before they
 * are folded. That is the property sync relies on — every device that holds
 * the same log shows the same progress, whatever order the events arrived in.
 *
 * The per-answer math is the existing `applyOutcome` (mastery) and
 * `applyLevelOutcome` (niveau climb); replay only decides what to feed them.
 */

import { isLevel } from '../content/levels';
import type { Exam } from '../grammar/rules';
import { applyLevelOutcome, EMPTY_DOMAIN_LEVEL, LEVEL_DOMAINS, type DomainLevel, type LevelDomain } from '../profile/levelStore';
import { applyOutcome, EMPTY_STAT, type ItemStat } from '../profile/mastery';
import { todayIso } from '../profile/settings';
import { ALL_DOMAINS, PATH_DOMAIN, type AnswerEvent, type Baseline, type Derived, type Domain, type PathResult, type ProgressEvent } from './types';

/** Grammar answers kept in `history`, as before accounts. */
export const HISTORY_LIMIT = 300;
/** Active days kept for the streak, as before accounts. */
const MAX_DAYS = 400;

export function emptyDerived(): Derived {
  return {
    stats: Object.fromEntries(ALL_DOMAINS.map((d) => [d, {}])) as Derived['stats'],
    seen: [],
    history: [],
    activeDays: [],
    levels: {},
    path: {},
  };
}

/**
 * Fold one finished path session into its node's result. The best score is
 * the one with the most right; a tie keeps the larger session.
 */
function foldPath(prev: PathResult | undefined, e: AnswerEvent): PathResult {
  const outcomes = Object.values(e.outcomes);
  const right = outcomes.filter(Boolean).length;
  const total = outcomes.length;
  const better = !prev || right > prev.best || (right === prev.best && total > prev.total);
  return {
    best: better ? right : prev.best,
    total: better ? total : prev.total,
    passes: (prev?.passes ?? 0) + (e.correct ? 1 : 0),
    attempts: (prev?.attempts ?? 0) + 1,
    lastAt: Math.max(prev?.lastAt ?? 0, e.at),
  };
}

export function sortEvents(events: ProgressEvent[]): ProgressEvent[] {
  return [...events].sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

const isDomain = (d: string): d is Domain => (ALL_DOMAINS as string[]).includes(d);
const isLevelDomain = (d: string): d is LevelDomain => (LEVEL_DOMAINS as string[]).includes(d);

export function replay(baselines: Baseline[], events: ProgressEvent[], exam: Exam | null = null): Derived {
  const out = emptyDerived();
  const seen = new Set<string>();
  const days = new Set<string>();
  /** domain → key → asOf: answers up to then are already inside the baseline. */
  const coveredUntil: Record<string, Record<string, number>> = {};

  for (const b of baselines) {
    if (isDomain(b.domain)) {
      out.stats[b.domain][b.key] = { ...EMPTY_STAT, ...(b.value as ItemStat) };
      (coveredUntil[b.domain] ??= {})[b.key] = b.asOf;
    } else if (b.domain === 'grammar-seen' && Array.isArray(b.value)) {
      for (const id of b.value) seen.add(String(id));
    } else if (b.domain === 'activity' && Array.isArray(b.value)) {
      for (const day of b.value) days.add(String(day));
    } else if (b.domain === 'levels' && isLevelDomain(b.key)) {
      const lvl = b.value as DomainLevel;
      if (lvl && (lvl.current === null || isLevel(lvl.current))) out.levels[b.key] = { ...EMPTY_DOMAIN_LEVEL, ...lvl };
    }
  }

  for (const e of sortEvents(events)) {
    if (e.kind === 'reset') {
      const domains = e.domain === 'all' ? ALL_DOMAINS : [e.domain];
      for (const d of domains) {
        out.stats[d] = {};
        delete coveredUntil[d];
        if (isLevelDomain(d)) delete out.levels[d];
        if (d === 'grammar') {
          seen.clear();
          out.history = [];
        }
      }
      if (e.domain === 'all') {
        days.clear();
        out.path = {};
      }
      continue;
    }

    if (e.kind === 'set-level') {
      out.levels[e.domain] = { current: e.level, recent: [], attempts: 0 };
      continue;
    }

    // An answer.
    if (e.domain === PATH_DOMAIN) {
      // A finished path session. It carries no mastery: its questions were
      // each logged as answers in their own domains as they were asked.
      out.path[e.itemId] = foldPath(out.path[e.itemId], e);
      continue;
    }
    if (!isDomain(e.domain)) continue; // a domain from a newer app version: keep it in the log, skip it here
    const stats = out.stats[e.domain];
    for (const [key, ok] of Object.entries(e.outcomes)) {
      const covered = coveredUntil[e.domain]?.[key];
      if (covered !== undefined && e.at <= covered) continue;
      stats[key] = applyOutcome(stats[key] ?? { ...EMPTY_STAT }, ok, e.at);
    }

    if (e.level !== null && isLevel(e.level) && isLevelDomain(e.domain)) {
      out.levels[e.domain] = applyLevelOutcome(
        out.levels[e.domain] ?? EMPTY_DOMAIN_LEVEL,
        e.level,
        e.correct,
        exam,
      ).next;
    }

    if (e.domain === 'grammar') {
      if (e.correct) seen.add(e.itemId);
      out.history.push({ exerciseId: e.itemId, correct: e.correct, violated: e.violated ?? [], at: e.at });
    }
    days.add(todayIso(new Date(e.at)));
  }

  out.history = out.history.slice(-HISTORY_LIMIT);
  out.seen = [...seen];
  out.activeDays = [...days].sort().slice(-MAX_DAYS);
  return out;
}
