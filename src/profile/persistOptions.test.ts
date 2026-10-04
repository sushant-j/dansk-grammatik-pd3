import AsyncStorage from '@react-native-async-storage/async-storage';
import { describe, expect, it } from 'vitest';
import { RULE_ALIASES, remapAliases } from '../content/retired';
import { EMPTY_STAT } from './mastery';
import { mergeSaved, STORE_VERSION } from './persistOptions';
import { useSettings } from './settings';

const practised = { attempts: 4, correct: 3, recent: [true, false, true, true], lastSeen: 1_700_000_000_000, raw: 0.6 };

describe('versioned persistence', () => {
  it('loads settings saved before stores were versioned, unchanged', async () => {
    // Exactly what zustand wrote for skema-settings-v1 before `version` existed.
    const saved = { targetExam: 'PD3', examDate: '2026-11-20', themeMode: 'dark', onboarded: true };
    await AsyncStorage.setItem('skema-settings-v1', JSON.stringify({ state: saved, version: 0 }));
    await useSettings.persist.rehydrate();

    const s = useSettings.getState();
    expect(s.hydrated).toBe(true);
    expect({ targetExam: s.targetExam, examDate: s.examDate, themeMode: s.themeMode, onboarded: s.onboarded }).toEqual(saved);

    const rewritten = JSON.parse((await AsyncStorage.getItem('skema-settings-v1'))!);
    expect(rewritten.version).toBe(STORE_VERSION);
    expect(rewritten.state).toEqual(saved);
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
