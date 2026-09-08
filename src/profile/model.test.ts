import { describe, expect, it } from 'vitest';
import { ALL_RULE_IDS, RULES, type RuleId } from '../grammar/rules';
import {
  decayedStrength,
  levelOf,
  nextExercise,
  ruleProgress,
  summarize,
  type RuleStat,
} from './store';

/**
 * The learner model is the app's answer to the streak, so its behaviour is a
 * product claim, not an implementation detail: gaps must surface, mastery must
 * decay honestly, and practice must not repeat what you already know.
 */

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

function stat(over: Partial<RuleStat> = {}): RuleStat {
  return { attempts: 0, correct: 0, recent: [], lastSeen: 0, raw: 0, ...over };
}

function statsWith(entries: Partial<Record<RuleId, RuleStat>>): Record<RuleId, RuleStat> {
  const base = Object.fromEntries(ALL_RULE_IDS.map((id) => [id, stat()])) as Record<
    RuleId,
    RuleStat
  >;
  return { ...base, ...entries };
}

describe('decay', () => {
  it('is zero for a rule never practised', () => {
    expect(decayedStrength(stat(), NOW)).toBe(0);
  });

  it('leaves a just-practised rule at full strength', () => {
    const s = stat({ attempts: 3, raw: 0.8, lastSeen: NOW });
    expect(decayedStrength(s, NOW)).toBeCloseTo(0.8, 5);
  });

  it('halves after the half-life', () => {
    const s = stat({ attempts: 3, raw: 0.8, lastSeen: NOW - 12 * DAY });
    expect(decayedStrength(s, NOW)).toBeCloseTo(0.4, 2);
  });

  it('keeps decaying but never goes negative', () => {
    const s = stat({ attempts: 3, raw: 0.9, lastSeen: NOW - 365 * DAY });
    const v = decayedStrength(s, NOW);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(0.01);
  });
});

describe('levels', () => {
  it('calls an unattempted rule unseen regardless of strength', () => {
    expect(levelOf(0.95, 0)).toBe('unseen');
  });

  it('maps strength onto the four practised bands', () => {
    expect(levelOf(0.95, 5)).toBe('mastered');
    expect(levelOf(0.75, 5)).toBe('solid');
    expect(levelOf(0.5, 5)).toBe('developing');
    expect(levelOf(0.2, 5)).toBe('shaky');
  });
});

describe('the grammar map', () => {
  it('reports every rule, so the map is never partially drawn', () => {
    expect(ruleProgress(statsWith({}), NOW)).toHaveLength(ALL_RULE_IDS.length);
  });

  it('keeps at least one rule tagged for every offered exam, including FVU', () => {
    // The exam-focus setting dims and marks "NOT ON {exam}" every rule not
    // tagged for the chosen exam. If no rule carries a given exam, picking it
    // greys out the entire map — a dead-end. FVU is the one at risk: its real
    // trainer is spelling, so only the two most basic sentence rules are
    // tagged, but there must always be at least one.
    for (const exam of ['PD2', 'PD3', 'FVU'] as const) {
      const tagged = ALL_RULE_IDS.filter((id) => RULES[id].exams.includes(exam));
      expect(tagged.length, `rules tagged ${exam}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('marks a decayed but previously solid rule as needing a refresh', () => {
    const stats = statsWith({
      'ikke-regel': stat({ attempts: 6, raw: 0.85, lastSeen: NOW - 30 * DAY }),
    });
    const p = ruleProgress(stats, NOW).find((x) => x.ruleId === 'ikke-regel')!;
    expect(p.needsRefresh).toBe(true);
    expect(p.strength).toBeLessThan(0.7);
  });

  it('does not mark a never-strong rule as needing a refresh', () => {
    const stats = statsWith({
      'ikke-regel': stat({ attempts: 2, raw: 0.3, lastSeen: NOW - 30 * DAY }),
    });
    const p = ruleProgress(stats, NOW).find((x) => x.ruleId === 'ikke-regel')!;
    expect(p.needsRefresh).toBe(false);
  });

  it('orders open gaps weakest first, so the map names the real priority', () => {
    const stats = statsWith({
      'ikke-regel': stat({ attempts: 4, raw: 0.55, lastSeen: NOW }),
      'v2-inversion': stat({ attempts: 4, raw: 0.15, lastSeen: NOW }),
      'forfelt-single': stat({ attempts: 4, raw: 0.45, lastSeen: NOW }),
    });
    const gaps = summarize(stats, NOW).openGaps.map((g) => g.ruleId);
    expect(gaps[0]).toBe('v2-inversion');
    expect(gaps.indexOf('forfelt-single')).toBeLessThan(gaps.indexOf('ikke-regel'));
  });

  it('counts solid and mastered rules together', () => {
    const stats = statsWith({
      'ikke-regel': stat({ attempts: 9, raw: 0.95, lastSeen: NOW }),
      'v2-inversion': stat({ attempts: 5, raw: 0.75, lastSeen: NOW }),
      'forfelt-single': stat({ attempts: 5, raw: 0.2, lastSeen: NOW }),
    });
    expect(summarize(stats, NOW).solid).toBe(2);
  });
});

describe('choosing what to practise next', () => {
  it('returns a real exercise from a blank profile', () => {
    const ex = nextExercise(statsWith({}), [], undefined, NOW);
    expect(ex).toBeTruthy();
    expect(ex.tokens.length).toBeGreaterThan(0);
  });

  it('never immediately repeats the exercise just completed', () => {
    const stats = statsWith({});
    for (let i = 0; i < 40; i++) {
      const ex = nextExercise(stats, [], 'ex-igaar', NOW);
      expect(ex.id).not.toBe('ex-igaar');
    }
  });

  it('prefers an exercise targeting the weakest rule', () => {
    // Everything strong except the ikke-regel, which only ledsætning
    // exercises train. Over many draws those should dominate.
    const strong = stat({ attempts: 8, raw: 0.95, lastSeen: NOW });
    const stats = statsWith(
      Object.fromEntries(ALL_RULE_IDS.map((id) => [id, strong])) as Record<RuleId, RuleStat>,
    );
    stats['ikke-regel'] = stat({ attempts: 8, raw: 0.05, lastSeen: NOW });

    let hits = 0;
    const runs = 60;
    for (let i = 0; i < runs; i++) {
      if (nextExercise(stats, [], undefined, NOW).targets.includes('ikke-regel')) hits++;
    }
    expect(hits / runs).toBeGreaterThan(0.7);
  });

  it('favours unsolved exercises over ones already answered correctly', () => {
    const stats = statsWith({});
    const allIds = nextExercise(stats, [], undefined, NOW);
    expect(allIds).toBeTruthy();

    // Mark every ledsætning exercise as solved; draws should skew to the rest.
    const solved = ['ex-fordi-ikke', 'ex-om-tid', 'ex-hvis-aldrig'];
    let resolvedAgain = 0;
    const runs = 60;
    for (let i = 0; i < runs; i++) {
      if (solved.includes(nextExercise(stats, solved, undefined, NOW).id)) resolvedAgain++;
    }
    expect(resolvedAgain / runs).toBeLessThan(0.5);
  });

  it('leans toward the target exam without ever fully excluding others', () => {
    // Only two exercises in the bank are tagged PD1. With every rule at equal
    // (untouched) strength, the exam bonus should be the deciding signal and
    // PD1-tagged exercises should dominate draws — but not every single one,
    // since jitter and the unseen bonus still apply to everything else too.
    const stats = statsWith({});
    let pd1Hits = 0;
    const runs = 60;
    for (let i = 0; i < runs; i++) {
      const ex = nextExercise(stats, [], undefined, NOW, 'PD1');
      if (ex.exams.includes('PD1')) pd1Hits++;
    }
    expect(pd1Hits / runs).toBeGreaterThan(0.5);
  });

  it('a rule the learner is weak on can still win over the exam bonus', () => {
    // The exam tag breaks ties; it does not override mastery. A PD3-only
    // exercise targeting a rule at rock-bottom strength should still beat a
    // PD1-tagged exercise whose rules are already solid.
    const strong = stat({ attempts: 8, raw: 0.95, lastSeen: NOW });
    const stats = statsWith(
      Object.fromEntries(ALL_RULE_IDS.map((id) => [id, strong])) as Record<RuleId, RuleStat>,
    );
    stats['ikke-regel'] = stat({ attempts: 8, raw: 0.02, lastSeen: NOW });

    let hits = 0;
    const runs = 60;
    for (let i = 0; i < runs; i++) {
      if (nextExercise(stats, [], undefined, NOW, 'PD1').targets.includes('ikke-regel')) hits++;
    }
    expect(hits / runs).toBeGreaterThan(0.5);
  });

  it('with no target exam set, behaves exactly as before', () => {
    const stats = statsWith({});
    const withNull = nextExercise(stats, [], 'ex-igaar', NOW, null);
    const withUndefined = nextExercise(stats, [], 'ex-igaar', NOW, undefined);
    expect(withNull.id).not.toBe('ex-igaar');
    expect(withUndefined.id).not.toBe('ex-igaar');
  });
});
