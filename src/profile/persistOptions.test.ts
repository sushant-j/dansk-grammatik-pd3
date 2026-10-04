import AsyncStorage from '@react-native-async-storage/async-storage';
import { describe, expect, it } from 'vitest';
import { RULE_ALIASES, remapAliases } from '../content/retired';
import { EMPTY_STAT } from './mastery';
import { useNounProfile } from './nounStore';
import { mergeSaved, STORE_VERSION } from './persistOptions';

const practised = { attempts: 4, correct: 3, recent: [true, false, true, true], lastSeen: 1_700_000_000_000, raw: 0.6 };

describe('versioned persistence', () => {
  it('loads progress saved before stores were versioned, unchanged', async () => {
    // Exactly what zustand wrote for skema-nouns-v1 before `version` existed.
    await AsyncStorage.setItem(
      'skema-nouns-v1',
      JSON.stringify({ state: { stats: { 'en-et-gender': practised } }, version: 0 }),
    );
    await useNounProfile.persist.rehydrate();

    const { stats, hydrated } = useNounProfile.getState();
    expect(hydrated).toBe(true);
    expect(stats['en-et-gender']).toEqual(practised);
    // Rules missing from the save get an empty stat instead of vanishing.
    expect(stats['definite-suffix']).toEqual(EMPTY_STAT);

    const saved = JSON.parse((await AsyncStorage.getItem('skema-nouns-v1'))!);
    expect(saved.version).toBe(STORE_VERSION);
    expect(saved.state.stats['en-et-gender']).toEqual(practised);
  });
});

describe('rule aliases', () => {
  it('carries a renamed rule’s stats over to its new id', () => {
    RULE_ALIASES['old-rule'] = 'new-rule';
    try {
      expect(remapAliases({ 'old-rule': practised, other: EMPTY_STAT })).toEqual({
        'new-rule': practised,
        other: EMPTY_STAT,
      });
      // If both exist, the stat already under the new id wins.
      expect(remapAliases({ 'old-rule': practised, 'new-rule': EMPTY_STAT })).toEqual({
        'new-rule': EMPTY_STAT,
      });
      const merged = mergeSaved({ stats: { 'old-rule': practised } }, { stats: {}, hydrated: false });
      expect(merged.stats).toEqual({ 'new-rule': practised });
    } finally {
      delete RULE_ALIASES['old-rule'];
    }
  });
});
