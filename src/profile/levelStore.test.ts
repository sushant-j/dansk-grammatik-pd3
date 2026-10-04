import { describe, expect, it } from 'vitest';
import { poolForLevel, startLevelFor, type Level } from '../content/levels';
import { EXERCISES } from '../content/exercises';
import { NOUN_BANK } from '../content/nouns';
import { ALL_NOUN_RULE_IDS, type NounRuleId } from '../grammar/nounRules';
import { EMPTY_STAT, type ItemStat } from './mastery';
import {
  applyLevelOutcome,
  climbProgress,
  EMPTY_DOMAIN_LEVEL,
  LEVEL_UP_ATTEMPTS,
  resolveLevel,
  type DomainLevel,
} from './levelStore';
import { nextNounQuestion } from './nounStore';
import { nextCommaQuestion } from './commaStore';
import { ALL_COMMA_RULE_IDS, type CommaRuleId } from '../grammar/commaRules';
import { ALL_RULE_IDS, type RuleId } from '../grammar/rules';
import { nextExercise } from './store';

const commaStats = Object.fromEntries(ALL_COMMA_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
  CommaRuleId,
  ItemStat
>;

const items = (levels: Level[]) => levels.map((level, i) => ({ id: `i${i}`, level }));

function run(start: DomainLevel, outcomes: [Level, boolean][]) {
  let state = start;
  let unlocked: Level | null = null;
  for (const [level, ok] of outcomes) {
    const r = applyLevelOutcome(state, level, ok, null);
    state = r.next;
    unlocked = r.unlocked ?? unlocked;
  }
  return { state, unlocked };
}

describe('startLevelFor', () => {
  it('starts PD3 candidates at niveau 3 and PD2/FVU at 2', () => {
    expect(startLevelFor('PD3')).toBe(3);
    expect(startLevelFor('PD2')).toBe(2);
    expect(startLevelFor('FVU')).toBe(2);
    expect(startLevelFor(null)).toBe(1);
  });

  it('is only a fallback: a niveau of their own wins', () => {
    expect(resolveLevel({ current: 4, recent: [], attempts: 0 }, 'PD2')).toBe(4);
    expect(resolveLevel(undefined, 'PD3')).toBe(3);
  });
});

describe('poolForLevel', () => {
  const pool = items([1, 2, 3, 4, 5]);

  it('never serves anything above the current niveau', () => {
    for (const r of [0, 0.5, 0.99]) {
      expect(poolForLevel(pool, 3, () => r).every((i) => i.level <= 3)).toBe(true);
    }
  });

  it('draws the current niveau most of the time and lower ones for review', () => {
    expect(poolForLevel(pool, 3, () => 0.1).map((i) => i.level)).toEqual([3]);
    expect(poolForLevel(pool, 3, () => 0.9).map((i) => i.level)).toEqual([1, 2]);
  });

  it('falls back to the easiest items rather than an empty pool', () => {
    expect(poolForLevel(items([4, 5]), 2).map((i) => i.level)).toEqual([4]);
    expect(poolForLevel(items([1, 1]), 5).length).toBe(2);
  });
});

describe('applyLevelOutcome', () => {
  it(`climbs after ${LEVEL_UP_ATTEMPTS} attempts at ≥ 80%`, () => {
    const outcomes: [Level, boolean][] = Array.from({ length: LEVEL_UP_ATTEMPTS }, (_, i) => [2, i % 5 !== 0]);
    const { state, unlocked } = run({ ...EMPTY_DOMAIN_LEVEL, current: 2 }, outcomes);
    expect(unlocked).toBe(3);
    expect(state).toEqual({ current: 3, recent: [], attempts: 0 });
  });

  it('does not climb on a low hit rate, however many attempts', () => {
    const outcomes: [Level, boolean][] = Array.from({ length: 40 }, (_, i) => [2, i % 2 === 0]);
    const { state, unlocked } = run({ ...EMPTY_DOMAIN_LEVEL, current: 2 }, outcomes);
    expect(unlocked).toBeNull();
    expect(state.current).toBe(2);
  });

  it('ignores review items from lower niveaus', () => {
    const outcomes: [Level, boolean][] = Array.from({ length: 30 }, () => [1, true]);
    const { state } = run({ ...EMPTY_DOMAIN_LEVEL, current: 2 }, outcomes);
    expect(state).toEqual({ current: 2, recent: [], attempts: 0 });
  });

  it('counts items above the niveau, so a domain with nothing at it can still climb', () => {
    // No comma sentence is niveau 1; a niveau-1 learner is served niveau-2 ones.
    const outcomes: [Level, boolean][] = [];
    for (let i = 0; i < LEVEL_UP_ATTEMPTS; i++) {
      outcomes.push([nextCommaQuestion(commaStats, undefined, Date.now(), 1).entry.level, true]);
    }
    expect(outcomes.every(([level]) => level > 1)).toBe(true);
    const { state, unlocked } = run({ ...EMPTY_DOMAIN_LEVEL, current: 1 }, outcomes);
    expect(unlocked).toBe(2);
    expect(state.current).toBe(2);
  });

  it('stops at niveau 5', () => {
    const outcomes: [Level, boolean][] = Array.from({ length: 30 }, () => [5, true]);
    const { state, unlocked } = run({ ...EMPTY_DOMAIN_LEVEL, current: 5 }, outcomes);
    expect(unlocked).toBeNull();
    expect(state.current).toBe(5);
  });

  it('reports climb progress toward the next niveau', () => {
    expect(climbProgress({ current: 2, recent: Array(10).fill(true), attempts: 10 }).value).toBeCloseTo(0.5);
  });
});

describe('pickers respect the niveau', () => {
  const nounStats = Object.fromEntries(ALL_NOUN_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    NounRuleId,
    ItemStat
  >;
  const grammarStats = Object.fromEntries(ALL_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    RuleId,
    ItemStat
  >;

  it('serves no noun above the learner’s niveau', () => {
    for (let i = 0; i < 50; i++) {
      expect(nextNounQuestion(nounStats, undefined, Date.now(), 1).noun.level).toBe(1);
    }
    expect(NOUN_BANK.some((n) => n.level > 1)).toBe(true);
  });

  it('serves no word-order exercise above the learner’s niveau', () => {
    for (let i = 0; i < 50; i++) {
      expect(nextExercise(grammarStats, [], undefined, Date.now(), null, 2).level).toBeLessThanOrEqual(2);
    }
    expect(EXERCISES.some((e) => e.level > 2)).toBe(true);
  });
});
