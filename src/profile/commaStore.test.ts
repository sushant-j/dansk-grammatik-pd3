import { describe, expect, it } from 'vitest';
import { commaExamplesForRule } from '../content/commaExamples';
import { ALL_COMMA_RULE_IDS, type CommaRuleId } from '../grammar/commaRules';
import { applyOutcome, EMPTY_STAT, type ItemStat } from './mastery';
import { commaRuleProgress, nextCommaQuestion, summarizeComma } from './commaStore';

const NOW = 1_700_000_000_000;

function statsWith(entries: Partial<Record<CommaRuleId, ItemStat>>): Record<CommaRuleId, ItemStat> {
  const base = Object.fromEntries(ALL_COMMA_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    CommaRuleId,
    ItemStat
  >;
  return { ...base, ...entries };
}

function strongStat(): ItemStat {
  let s = { ...EMPTY_STAT };
  for (let i = 0; i < 8; i++) s = applyOutcome(s, true, NOW);
  return s;
}

describe('commaRuleProgress', () => {
  it('covers all three rules', () => {
    expect(commaRuleProgress(statsWith({}), NOW)).toHaveLength(3);
  });
});

describe('nextCommaQuestion', () => {
  it('returns a question whose entry belongs to a real rule pool', () => {
    const q = nextCommaQuestion(statsWith({}), undefined, NOW);
    const pool = commaExamplesForRule(q.ruleId);
    expect(pool.map((e) => e.id)).toContain(q.entry.id);
  });

  it('prefers the weakest rule over strong ones', () => {
    const stats = statsWith({
      'comma-men-vs-og': strongStat(),
      'comma-list-items': strongStat(),
      'comma-relative-clause': { ...EMPTY_STAT },
    });
    let hits = 0;
    const runs = 40;
    for (let i = 0; i < runs; i++) {
      if (nextCommaQuestion(stats, undefined, NOW).ruleId === 'comma-relative-clause') hits++;
    }
    expect(hits / runs).toBeGreaterThan(0.6);
  });

  it('can avoid immediately repeating the same sentence pair', () => {
    const stats = statsWith({});
    const first = nextCommaQuestion(stats, undefined, NOW);
    let sawDifferent = false;
    for (let i = 0; i < 20; i++) {
      if (nextCommaQuestion(stats, first.entry.id, NOW).entry.id !== first.entry.id) {
        sawDifferent = true;
        break;
      }
    }
    expect(sawDifferent).toBe(true);
  });
});

describe('summarizeComma', () => {
  it('counts a solid rule correctly', () => {
    const s = summarizeComma(statsWith({ 'comma-men-vs-og': strongStat() }), NOW);
    expect(s.solid).toBeGreaterThanOrEqual(1);
  });
});
