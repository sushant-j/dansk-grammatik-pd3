/**
 * Shared persistence settings for every learner store.
 *
 * Every store is versioned so that a future change to what it saves goes
 * through `migrate` instead of zustand's default for a version mismatch,
 * which is to *ignore* the saved state — i.e. silently wipe the learner's
 * progress. Version 0 is everything saved before versioning existed; it is
 * already in the current shape, so it passes through unchanged.
 *
 * Stats keys are run through the rule-alias map on every load, so renaming a
 * rule id (see `content/retired.ts`) carries its mastery over automatically.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type PersistOptions } from 'zustand/middleware';
import { remapAliases } from '../content/retired';

export const STORE_VERSION = 1;

/**
 * Bring a saved state from `fromVersion` up to STORE_VERSION. Add a case per
 * version bump; never drop a field a learner's progress lives in.
 */
export function migrateSaved(persisted: unknown, fromVersion: number): unknown {
  const state = persisted;
  switch (fromVersion) {
    case 0:
    // Pre-versioning saves already match version 1.
    // falls through
    default:
      return state;
  }
}

/** Merge saved state over defaults, re-keying any `stats` through the alias map. */
export function mergeSaved<S>(persisted: unknown, current: S): S {
  if (!persisted || typeof persisted !== 'object') return current;
  const saved = persisted as Record<string, unknown>;
  const stats = saved.stats;
  return {
    ...current,
    ...saved,
    ...(stats && typeof stats === 'object'
      ? { stats: { ...(current as { stats?: object }).stats, ...remapAliases(stats as Record<string, unknown>) } }
      : {}),
  };
}

export function persistOptions<S extends { hydrated: boolean }, P>(
  name: string,
  partialize: (state: S) => P,
): PersistOptions<S, P> {
  return {
    name,
    version: STORE_VERSION,
    storage: createJSONStorage(() => AsyncStorage),
    partialize,
    migrate: (persisted, version) => migrateSaved(persisted, version) as P,
    merge: mergeSaved,
    onRehydrateStorage: () => (state) => {
      if (state) state.hydrated = true;
    },
  };
}
