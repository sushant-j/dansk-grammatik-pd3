/**
 * Mastery for every drill domain, in one store.
 *
 * One store rather than one per domain because the domains differ only in
 * content: eleven identical zustand stores would be eleven more places for
 * publish() and useOverview to forget. Like the other practice stores it has
 * no persistence of its own — sync/log.ts replays the progress log and
 * publishes the stats here; `record` only appends an answer to the log.
 */

import { create } from 'zustand';
import type { Level } from '../content/levels';
import { recordAnswer, recordReset } from '../sync/bus';
import type { DrillStats } from './drillExercise';
import { DRILL_DOMAIN_KEYS, type DrillDomainKey } from './registry';

export type AllDrillStats = Record<DrillDomainKey, DrillStats>;

interface DrillState {
  stats: AllDrillStats;
  hydrated: boolean;
  /** `item` is what was answered: its id and niveau go into the log, its topic is what the answer is evidence for. */
  record: (domain: DrillDomainKey, item: { id: string; level: Level; ruleId: string }, correct: boolean) => void;
  reset: (domain: DrillDomainKey) => void;
}

/** Topics missing from a domain's map are unseen; progress reads them as EMPTY_STAT. */
export function emptyDrillStats(): AllDrillStats {
  return Object.fromEntries(DRILL_DOMAIN_KEYS.map((k) => [k, {}])) as AllDrillStats;
}

export const useDrillProfile = create<DrillState>()(() => ({
  stats: emptyDrillStats(),
  hydrated: true,
  record: (domain, item, correct) =>
    recordAnswer({ domain, itemId: item.id, level: item.level, outcomes: { [item.ruleId]: correct }, correct }),
  reset: (domain) => recordReset(domain),
}));
