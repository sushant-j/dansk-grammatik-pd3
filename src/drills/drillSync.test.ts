/**
 * A drill answer goes through the same log as every other trainer's: recorded
 * via the bus, replayed into the drill store, and counted toward the domain's
 * niveau climb. Drill domains are listed from the registry everywhere replay
 * looks (ALL_DOMAINS, LEVEL_DOMAINS) — if one were missing, its answers would
 * be silently dropped, which is what this guards.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLevels } from '../profile/levelStore';
import { derive, switchUser, useLog } from '../sync/log';
import { replay } from '../sync/replay';
import { useDrillProfile } from './drillStore';
import { DRILL_DOMAIN_KEYS } from './registry';

const USER = 'drill-user';

afterEach(() => {
  vi.useRealTimers();
});

beforeEach(async () => {
  await AsyncStorage.clear();
  await switchUser(null);
  await switchUser(USER);
});

describe('drill answers in the progress log', () => {
  it('update the drill store and the domain’s niveau climb, and replay to the same', () => {
    const record = useDrillProfile.getState().record;
    // Niveau 3 is at or above any start niveau, so every answer counts toward the climb.
    const item = { id: 'vt-fixture-1', level: 3 as const, ruleId: 'vt-fixture' };
    record('verb-tenses', item, true);
    record('verb-tenses', { ...item, id: 'vt-fixture-2' }, false);

    const stat = useDrillProfile.getState().stats['verb-tenses']['vt-fixture'];
    expect(stat.attempts).toBe(2);
    expect(stat.correct).toBe(1);
    // Other domains are untouched.
    expect(useDrillProfile.getState().stats.pronouns).toEqual({});

    const level = useLevels.getState().domains['verb-tenses'];
    expect(level?.attempts).toBe(2);

    // A fresh replay of the stored log lands on the same stats.
    const { events, baselines } = useLog.getState();
    expect(replay(baselines, events).stats['verb-tenses']['vt-fixture']).toEqual(stat);
    expect(derive().levels['verb-tenses']).toEqual(level);
  });

  it('reset clears one drill domain only', () => {
    // Events order by time, so the reset must come a moment after the answers.
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-03-02T10:00:00Z'));
    const { record, reset } = useDrillProfile.getState();
    record('pronouns', { id: 'pr-x-1', level: 3, ruleId: 'pr-x' }, true);
    record('conjunctions', { id: 'cj-x-1', level: 3, ruleId: 'cj-x' }, true);
    vi.advanceTimersByTime(1000);
    reset('pronouns');
    expect(useDrillProfile.getState().stats.pronouns).toEqual({});
    expect(useDrillProfile.getState().stats.conjunctions['cj-x'].attempts).toBe(1);
  });

  it('has a stats slot for every registered domain', () => {
    expect(Object.keys(useDrillProfile.getState().stats).sort()).toEqual([...DRILL_DOMAIN_KEYS].sort());
  });
});
