import { describe, expect, it } from 'vitest';
import { computeStreak } from './activity';
import { shiftIso, todayIso } from './settings';

const NOW = new Date('2026-06-15T09:00:00');
const TODAY = todayIso(NOW); // 2026-06-15
const d = (n: number) => shiftIso(TODAY, n);

describe('computeStreak', () => {
  it('is all zeros for no activity', () => {
    const s = computeStreak([], NOW);
    expect(s).toEqual({ current: 0, longest: 0, activeToday: false, totalDays: 0 });
  });

  it('counts a run ending today', () => {
    const s = computeStreak([d(-2), d(-1), d(0)], NOW);
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
    expect(s.activeToday).toBe(true);
    expect(s.totalDays).toBe(3);
  });

  it('does not break the streak just because today is not done yet', () => {
    // Active yesterday and before, but not today → streak still counts back
    // from yesterday, so a mid-morning open shows 2, not 0.
    const s = computeStreak([d(-2), d(-1)], NOW);
    expect(s.activeToday).toBe(false);
    expect(s.current).toBe(2);
  });

  it('breaks the current streak once a full day is missed', () => {
    // Last active two days ago (missed yesterday and today) → current 0.
    const s = computeStreak([d(-3), d(-2)], NOW);
    expect(s.current).toBe(0);
    expect(s.longest).toBe(2);
  });

  it('finds the longest run even when it is in the past', () => {
    // A 4-day run last week, then a single day today.
    const s = computeStreak([d(-9), d(-8), d(-7), d(-6), d(0)], NOW);
    expect(s.longest).toBe(4);
    expect(s.current).toBe(1);
  });

  it('ignores duplicate days and unordered input', () => {
    const s = computeStreak([d(0), d(-1), d(0), d(-2), d(-1)], NOW);
    expect(s.totalDays).toBe(3);
    expect(s.current).toBe(3);
  });
});
