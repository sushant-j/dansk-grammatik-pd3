import { describe, expect, it } from 'vitest';
import { NOUN_BANK } from '../content/nouns';
import { ALL_NOUN_RULE_IDS, type NounRuleId } from '../grammar/nounRules';
import { applyOutcome, EMPTY_STAT, type ItemStat } from './mastery';
import { nextNounQuestion, nounRuleProgress, summarizeNouns } from './nounStore';

const NOW = 1_700_000_000_000;

function statsWith(entries: Partial<Record<NounRuleId, ItemStat>>): Record<NounRuleId, ItemStat> {
  const base = Object.fromEntries(ALL_NOUN_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    NounRuleId,
    ItemStat
  >;
  return { ...base, ...entries };
}

describe('nounRuleProgress', () => {
  it('covers all three rules', () => {
    expect(nounRuleProgress(statsWith({}), NOW)).toHaveLength(3);
  });
});

describe('summarizeNouns', () => {
  it('names the weakest rule when everything is untouched', () => {
    const s = summarizeNouns(statsWith({}), NOW);
    expect(ALL_NOUN_RULE_IDS).toContain(s.weakest.id);
  });

  it('counts a solid rule correctly', () => {
    let strong = { ...EMPTY_STAT };
    for (let i = 0; i < 8; i++) strong = applyOutcome(strong, true, NOW);
    const s = summarizeNouns(statsWith({ 'en-et-gender': strong }), NOW);
    expect(s.solid).toBeGreaterThanOrEqual(1);
  });
});

describe('nextNounQuestion', () => {
  it('returns a question for a real noun in the bank', () => {
    const q = nextNounQuestion(statsWith({}), undefined, NOW);
    expect(NOUN_BANK.map((n) => n.id)).toContain(q.noun.id);
  });

  it('prefers the weakest rule over strong ones', () => {
    let strong = { ...EMPTY_STAT };
    for (let i = 0; i < 8; i++) strong = applyOutcome(strong, true, NOW);
    const stats = statsWith({
      'en-et-gender': strong,
      'definite-suffix': strong,
      'double-definiteness': { ...EMPTY_STAT },
    });

    let hits = 0;
    const runs = 40;
    for (let i = 0; i < runs; i++) {
      if (nextNounQuestion(stats, undefined, NOW).ruleId === 'double-definiteness') hits++;
    }
    expect(hits / runs).toBeGreaterThan(0.6);
  });

  it('can avoid immediately repeating the same noun', () => {
    const stats = statsWith({});
    let sawDifferent = false;
    for (let i = 0; i < 20; i++) {
      if (nextNounQuestion(stats, NOUN_BANK[0].id, NOW).noun.id !== NOUN_BANK[0].id) {
        sawDifferent = true;
        break;
      }
    }
    expect(sawDifferent).toBe(true);
  });
});
