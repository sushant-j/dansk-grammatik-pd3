import { describe, expect, it } from 'vitest';
import { LEVEL_UP_ATTEMPTS } from '../profile/levelStore';
import { applyOutcome, EMPTY_STAT } from '../profile/mastery';
import { replay } from './replay';
import type { AnswerEvent, Baseline, ProgressEvent } from './types';

const DAY = 86_400_000;
const T0 = Date.parse('2026-03-02T10:00:00Z');

let n = 0;
function answer(over: Partial<AnswerEvent> & { outcomes: Record<string, boolean> }): AnswerEvent {
  n++;
  return {
    kind: 'answer',
    id: `e${String(n).padStart(4, '0')}`,
    at: T0 + n * 60_000,
    domain: 'nouns',
    itemId: 'n-bil',
    level: 1,
    correct: Object.values(over.outcomes).every(Boolean),
    ...over,
  };
}

function shuffled<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

describe('replay', () => {
  it('computes the same stats the stores used to compute, answer by answer', () => {
    const events = [true, false, true, true].map((ok) => answer({ outcomes: { 'en-et-gender': ok } }));
    let expected = { ...EMPTY_STAT };
    for (const e of events) expected = applyOutcome(expected, e.outcomes['en-et-gender'], e.at);
    expect(replay([], events).stats.nouns['en-et-gender']).toEqual(expected);
  });

  it('gives the same result whatever order the events arrive in', () => {
    const events: ProgressEvent[] = [
      ...Array.from({ length: 12 }, (_, i) => answer({ outcomes: { 'definite-suffix': i % 3 !== 0 } })),
      ...Array.from({ length: 8 }, (_, i) => answer({ domain: 'grammar', itemId: `ex-${i}`, outcomes: { 'v2-inversion': i % 2 === 0 } })),
    ];
    const reference = replay([], events);
    for (const seed of [1, 7, 42]) expect(replay([], shuffled(events, seed))).toEqual(reference);
  });

  it('starts from a baseline and skips answers it already contains', () => {
    const baselineStat = applyOutcome({ ...EMPTY_STAT }, true, T0);
    const baselines: Baseline[] = [{ domain: 'nouns', key: 'en-et-gender', value: baselineStat, asOf: T0 + 5 * 60_000 }];
    const before = answer({ outcomes: { 'en-et-gender': false } }); // at or before asOf: already in the snapshot
    n += 10;
    const after = answer({ outcomes: { 'en-et-gender': true } });
    before.at = T0 + 60_000;
    const stat = replay(baselines, [before, after]).stats.nouns['en-et-gender'];
    expect(stat).toEqual(applyOutcome(baselineStat, true, after.at));
  });

  it('a reset clears its domain only; "all" clears everything', () => {
    const events: ProgressEvent[] = [
      answer({ outcomes: { 'en-et-gender': true } }),
      answer({ domain: 'verbs', itemId: 'v-gå', outcomes: { 'strong-verb-forms': true } }),
      { kind: 'reset', domain: 'nouns', id: 'r1', at: T0 + DAY },
    ];
    const d = replay([], events);
    expect(d.stats.nouns).toEqual({});
    expect(d.stats.verbs['strong-verb-forms'].attempts).toBe(1);

    const all = replay([], [...events, { kind: 'reset', domain: 'all', id: 'r2', at: T0 + 2 * DAY }]);
    expect(all.stats.verbs).toEqual({});
    expect(all.activeDays).toEqual([]);
  });

  it('tracks seen, history and active days for grammar', () => {
    const a = answer({ domain: 'grammar', itemId: 'ex-igaar', outcomes: { 'v2-inversion': true }, at: T0 });
    const b = answer({ domain: 'grammar', itemId: 'ex-derfor', outcomes: { 'v2-inversion': false }, violated: ['v2-inversion'], at: T0 + DAY });
    const d = replay([{ domain: 'grammar-seen', key: 'seen', value: ['ex-old'], asOf: T0 }], [a, b]);
    expect(d.seen.sort()).toEqual(['ex-igaar', 'ex-old']);
    expect(d.history).toEqual([
      { exerciseId: 'ex-igaar', correct: true, violated: [], at: T0 },
      { exerciseId: 'ex-derfor', correct: false, violated: ['v2-inversion'], at: T0 + DAY },
    ]);
    expect(d.activeDays).toHaveLength(2);
  });

  it('replays the niveau climb, and a hand-set niveau restarts it', () => {
    const climb = Array.from({ length: LEVEL_UP_ATTEMPTS }, () => answer({ level: 2, outcomes: { 'en-et-gender': true } }));
    const set: ProgressEvent = { kind: 'set-level', domain: 'nouns', level: 2, id: 'set', at: T0 };
    expect(replay([], [set, ...climb]).levels.nouns?.current).toBe(3);

    const later: ProgressEvent = { kind: 'set-level', domain: 'nouns', level: 4, id: 'set2', at: T0 + DAY * 10 };
    expect(replay([], [set, ...climb, later]).levels.nouns).toEqual({ current: 4, recent: [], attempts: 0 });
  });

  it('keeps events from unknown domains in the log without failing', () => {
    const odd = answer({ domain: 'pronunciation' as never, outcomes: { x: true } });
    expect(() => replay([], [odd])).not.toThrow();
  });
});

describe('replay: grammar path sessions', () => {
  const session = (itemId: string, right: number, total: number, at?: number) =>
    answer({
      domain: 'path',
      itemId,
      level: null,
      outcomes: Object.fromEntries(Array.from({ length: total }, (_, i) => [`q${i}`, i < right])),
      correct: right >= Math.ceil(total * 0.75),
      ...(at ? { at } : {}),
    });

  it('keeps the best session per node and counts passes', () => {
    const d = replay([], [session('vt-past-vs-perfect', 5, 8), session('vt-past-vs-perfect', 7, 8), session('vt-past-vs-perfect', 6, 8)]);
    expect(d.path['vt-past-vs-perfect']).toMatchObject({ best: 7, total: 8, passes: 2, attempts: 3 });
  });

  it('leaves mastery, niveaus, seen and history alone', () => {
    const d = replay([], [session('cp-w1-first', 12, 12)]);
    expect(d.path['cp-w1-first'].best).toBe(12);
    expect(Object.values(d.stats).every((s) => Object.keys(s).length === 0)).toBe(true);
    expect(d.levels).toEqual({});
    expect(d.seen).toEqual([]);
    expect(d.history).toEqual([]);
  });

  it('is cleared by a full reset but not by a domain reset', () => {
    const before = session('subject-required', 8, 8);
    const domainReset: ProgressEvent = { kind: 'reset', domain: 'grammar', id: 'r1', at: before.at + 1 };
    expect(replay([], [before, domainReset]).path['subject-required']).toBeDefined();
    const fullReset: ProgressEvent = { kind: 'reset', domain: 'all', id: 'r2', at: before.at + 1 };
    expect(replay([], [before, fullReset]).path).toEqual({});
  });
});
