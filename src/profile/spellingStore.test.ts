import { describe, expect, it } from 'vitest';
import { spellingExamplesForRule } from '../content/spellingExamples';
import { ALL_SPELLING_RULE_IDS, type SpellingRuleId } from '../grammar/spellingRules';
import { applyOutcome, EMPTY_STAT, type ItemStat } from './mastery';
import { nextSpellingQuestion, spellingRuleProgress, summarizeSpelling } from './spellingStore';

const NOW = 1_700_000_000_000;

function statsWith(
  entries: Partial<Record<SpellingRuleId, ItemStat>>,
): Record<SpellingRuleId, ItemStat> {
  const base = Object.fromEntries(
    ALL_SPELLING_RULE_IDS.map((id) => [id, { ...EMPTY_STAT }]),
  ) as Record<SpellingRuleId, ItemStat>;
  return { ...base, ...entries };
}

function strongStat(): ItemStat {
  let s = { ...EMPTY_STAT };
  for (let i = 0; i < 8; i++) s = applyOutcome(s, true, NOW);
  return s;
}

describe('spellingRuleProgress', () => {
  it('covers every spelling rule', () => {
    expect(spellingRuleProgress(statsWith({}), NOW)).toHaveLength(ALL_SPELLING_RULE_IDS.length);
  });
});

describe('nextSpellingQuestion', () => {
  it('returns a question whose entry belongs to a real rule pool', () => {
    const q = nextSpellingQuestion(statsWith({}), undefined, NOW);
    const pool = spellingExamplesForRule(q.ruleId);
    expect(pool.map((e) => e.id)).toContain(q.entry.id);
  });

  it('prefers the weakest rule over strong ones', () => {
    // Make every rule strong except the target, so it is the sole weak one —
    // otherwise a second untouched rule would split the draws with it.
    const strong = strongStat();
    const stats = statsWith(
      Object.fromEntries(ALL_SPELLING_RULE_IDS.map((id) => [id, strong])) as Record<
        SpellingRuleId,
        ItemStat
      >,
    );
    stats['nogen-vs-nogle'] = { ...EMPTY_STAT };
    let hits = 0;
    const runs = 40;
    for (let i = 0; i < runs; i++) {
      if (nextSpellingQuestion(stats, undefined, NOW).ruleId === 'nogen-vs-nogle') hits++;
    }
    expect(hits / runs).toBeGreaterThan(0.6);
  });

  it('can avoid immediately repeating the same sentence', () => {
    const stats = statsWith({});
    const first = nextSpellingQuestion(stats, undefined, NOW);
    let sawDifferent = false;
    for (let i = 0; i < 20; i++) {
      if (nextSpellingQuestion(stats, first.entry.id, NOW).entry.id !== first.entry.id) {
        sawDifferent = true;
        break;
      }
    }
    expect(sawDifferent).toBe(true);
  });
});

describe('summarizeSpelling', () => {
  it('counts a solid rule correctly', () => {
    const s = summarizeSpelling(statsWith({ 'silent-d': strongStat() }), NOW);
    expect(s.solid).toBeGreaterThanOrEqual(1);
  });
});
