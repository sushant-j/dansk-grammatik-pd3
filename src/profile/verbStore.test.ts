import { describe, expect, it } from 'vitest';
import { VERB_BANK } from '../content/verbs';
import { ALL_VERB_RULE_IDS, type VerbRuleId } from '../grammar/verbRules';
import { applyOutcome, EMPTY_STAT, type ItemStat } from './mastery';
import { nextVerbQuestion, summarizeVerbs, verbRuleProgress } from './verbStore';

const NOW = 1_700_000_000_000;

function statsWith(entries: Partial<Record<VerbRuleId, ItemStat>>): Record<VerbRuleId, ItemStat> {
  const base = Object.fromEntries(ALL_VERB_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }])) as Record<
    VerbRuleId,
    ItemStat
  >;
  return { ...base, ...entries };
}

function strongStat(): ItemStat {
  let s = { ...EMPTY_STAT };
  for (let i = 0; i < 8; i++) s = applyOutcome(s, true, NOW);
  return s;
}

describe('verbRuleProgress', () => {
  it('covers all three rules', () => {
    expect(verbRuleProgress(statsWith({}), NOW)).toHaveLength(3);
  });
});

describe('nextVerbQuestion', () => {
  it('returns a question for a real verb in the bank', () => {
    const q = nextVerbQuestion(statsWith({}), undefined, NOW);
    expect(VERB_BANK.map((v) => v.id)).toContain(q.verb.id);
  });

  it('never draws a strong verb for a weak-suffix question', () => {
    const stats = statsWith({
      'weak-suffix-choice': { ...EMPTY_STAT },
      'strong-verb-forms': strongStat(),
      'perfect-auxiliary': strongStat(),
    });
    for (let i = 0; i < 30; i++) {
      const q = nextVerbQuestion(stats, undefined, NOW);
      if (q.kind === 'weak-suffix') {
        expect(q.verb.verbClass).not.toBe('strong');
      }
    }
  });

  it('never draws a weak verb for a strong-form question', () => {
    const stats = statsWith({
      'weak-suffix-choice': strongStat(),
      'strong-verb-forms': { ...EMPTY_STAT },
      'perfect-auxiliary': strongStat(),
    });
    for (let i = 0; i < 30; i++) {
      const q = nextVerbQuestion(stats, undefined, NOW);
      if (q.kind === 'strong-form') {
        expect(q.verb.verbClass).toBe('strong');
      }
    }
  });

  it('prefers the weakest rule over strong ones', () => {
    const stats = statsWith({
      'weak-suffix-choice': strongStat(),
      'strong-verb-forms': strongStat(),
      'perfect-auxiliary': { ...EMPTY_STAT },
    });
    let hits = 0;
    const runs = 40;
    for (let i = 0; i < runs; i++) {
      if (nextVerbQuestion(stats, undefined, NOW).ruleId === 'perfect-auxiliary') hits++;
    }
    expect(hits / runs).toBeGreaterThan(0.6);
  });
});

describe('summarizeVerbs', () => {
  it('counts a solid rule correctly', () => {
    const s = summarizeVerbs(statsWith({ 'perfect-auxiliary': strongStat() }), NOW);
    expect(s.solid).toBeGreaterThanOrEqual(1);
  });
});
