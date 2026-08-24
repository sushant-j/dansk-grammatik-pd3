import { describe, expect, it } from 'vitest';
import { ADJECTIVE_BANK } from '../content/adjectives';
import { ALL_ADJECTIVE_RULE_IDS, type AdjectiveRuleId } from '../grammar/adjectiveRules';
import { applyOutcome, EMPTY_STAT, type ItemStat } from './mastery';
import { adjectiveRuleProgress, nextAdjectiveQuestion, summarizeAdjectives } from './adjectiveStore';

const NOW = 1_700_000_000_000;

function statsWith(
  entries: Partial<Record<AdjectiveRuleId, ItemStat>>,
): Record<AdjectiveRuleId, ItemStat> {
  const base = Object.fromEntries(
    ALL_ADJECTIVE_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }]),
  ) as Record<AdjectiveRuleId, ItemStat>;
  return { ...base, ...entries };
}

describe('adjectiveRuleProgress', () => {
  it('covers all three rules', () => {
    expect(adjectiveRuleProgress(statsWith({}), NOW)).toHaveLength(3);
  });
});

describe('nextAdjectiveQuestion', () => {
  it('returns a question for a real adjective in the bank', () => {
    const q = nextAdjectiveQuestion(statsWith({}), undefined, NOW);
    expect(ADJECTIVE_BANK.map((a) => a.id)).toContain(q.adjective.id);
  });

  it('picks an en-word noun for common-form questions', () => {
    let weak = { ...EMPTY_STAT };
    const strong = (() => {
      let s = { ...EMPTY_STAT };
      for (let i = 0; i < 8; i++) s = applyOutcome(s, true, NOW);
      return s;
    })();
    const stats = statsWith({
      'adjective-common-form': weak,
      'adjective-neuter-form': strong,
      'adjective-e-form': strong,
    });
    for (let i = 0; i < 20; i++) {
      const q = nextAdjectiveQuestion(stats, undefined, NOW);
      if (q.kind === 'common-form') {
        expect(q.noun.gender).toBe('en');
      }
    }
  });

  it('picks an et-word noun for neuter-form questions', () => {
    const strong = (() => {
      let s = { ...EMPTY_STAT };
      for (let i = 0; i < 8; i++) s = applyOutcome(s, true, NOW);
      return s;
    })();
    const stats = statsWith({
      'adjective-common-form': strong,
      'adjective-neuter-form': { ...EMPTY_STAT },
      'adjective-e-form': strong,
    });
    for (let i = 0; i < 20; i++) {
      const q = nextAdjectiveQuestion(stats, undefined, NOW);
      if (q.kind === 'neuter-form') {
        expect(q.noun.gender).toBe('et');
      }
    }
  });

  it('prefers the weakest rule over strong ones', () => {
    const strong = (() => {
      let s = { ...EMPTY_STAT };
      for (let i = 0; i < 8; i++) s = applyOutcome(s, true, NOW);
      return s;
    })();
    const stats = statsWith({
      'adjective-common-form': strong,
      'adjective-neuter-form': strong,
      'adjective-e-form': { ...EMPTY_STAT },
    });

    let hits = 0;
    const runs = 40;
    for (let i = 0; i < runs; i++) {
      if (nextAdjectiveQuestion(stats, undefined, NOW).ruleId === 'adjective-e-form') hits++;
    }
    expect(hits / runs).toBeGreaterThan(0.6);
  });
});

describe('summarizeAdjectives', () => {
  it('counts a solid rule correctly', () => {
    let strong = { ...EMPTY_STAT };
    for (let i = 0; i < 8; i++) strong = applyOutcome(strong, true, NOW);
    const s = summarizeAdjectives(statsWith({ 'adjective-e-form': strong }), NOW);
    expect(s.solid).toBeGreaterThanOrEqual(1);
  });
});
