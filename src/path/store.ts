/**
 * The learner's path results, and the hook that turns them into path state.
 *
 * Like every practice store this is a view of the progress log: log.ts
 * publishes the replayed results here, and finishing a session adds an event
 * rather than editing them.
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { useAdjectiveProfile } from '../profile/adjectiveStore';
import { useCommaProfile } from '../profile/commaStore';
import type { ItemStat } from '../profile/mastery';
import { useNounProfile } from '../profile/nounStore';
import { useSpellingProfile } from '../profile/spellingStore';
import { useProfile } from '../profile/store';
import { useVerbProfile } from '../profile/verbStore';
import { useDrillProfile } from '../drills/drillStore';
import { isDrillDomainKey } from '../drills/registry';
import { recordAnswer } from '../sync/bus';
import { PATH_DOMAIN } from '../sync/types';
import type { PathLesson } from './curriculum';
import { pathState, type MasteryLookup, type PathResults, type PathState } from './progress';

interface PathStore {
  results: PathResults;
}

export const usePathResults = create<PathStore>()(() => ({ results: {} }));

/** Log a finished lesson or checkpoint: one outcome per question asked, keyed by its item. */
export function recordPathSession(nodeId: string, outcomes: Record<string, boolean>, passed: boolean): void {
  recordAnswer({ domain: PATH_DOMAIN, itemId: nodeId, level: null, outcomes, correct: passed });
}

/** A rule's mastery stat, read from whichever trainer's store holds it. */
export const currentMastery: MasteryLookup = (lesson: PathLesson): ItemStat | undefined => {
  const { family, id } = lesson.rule;
  const pick = (stats: Record<string, ItemStat> | undefined) => stats?.[id];
  switch (family) {
    case 'grammar':
      return pick(useProfile.getState().stats);
    case 'verbs':
      return pick(useVerbProfile.getState().stats);
    case 'nouns':
      return pick(useNounProfile.getState().stats);
    case 'adjectives':
      return pick(useAdjectiveProfile.getState().stats);
    case 'comma':
      return pick(useCommaProfile.getState().stats);
    case 'spelling':
      return pick(useSpellingProfile.getState().stats);
    default:
      return isDrillDomainKey(family) ? pick(useDrillProfile.getState().stats[family]) : undefined;
  }
};

/**
 * Path state for the screens. It re-derives when results or any mastery
 * changes (mastery decides the cracks), which all happen together on publish.
 */
export function usePathState(): PathState {
  const results = usePathResults((s) => s.results);
  const grammar = useProfile((s) => s.stats);
  const verbs = useVerbProfile((s) => s.stats);
  const nouns = useNounProfile((s) => s.stats);
  const adjectives = useAdjectiveProfile((s) => s.stats);
  const comma = useCommaProfile((s) => s.stats);
  const spelling = useSpellingProfile((s) => s.stats);
  const drills = useDrillProfile((s) => s.stats);
  return useMemo(
    () => pathState(results, currentMastery),
    // The stores are read through currentMastery; these deps are what change it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results, grammar, verbs, nouns, adjectives, comma, spelling, drills],
  );
}
