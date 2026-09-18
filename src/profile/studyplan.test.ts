import { describe, expect, it } from 'vitest';
import type { OverviewSummary } from './overview';
import { shiftIso, todayIso } from './settings';
import { buildStudyPlan } from './studyplan';

const NOW = new Date('2026-06-01T12:00:00').getTime();
const TODAY = todayIso(new Date(NOW)); // '2026-06-01'

/** An overview summary with the given not-yet-solid split. */
function ov(attention: number, unseen: number, solid = 10): OverviewSummary {
  return {
    totalAttention: attention,
    totalUnseen: unseen,
    totalSolid: solid,
    totalItems: attention + unseen + solid,
    started: attention + solid > 0,
    widestGap: undefined,
  };
}

describe('buildStudyPlan', () => {
  it('asks for a date when none is set, but still counts the work', () => {
    const p = buildStudyPlan(null, ov(3, 5), NOW);
    expect(p.readiness).toBe('no-date');
    expect(p.toMakeSolid).toBe(8);
    expect(p.message).toMatch(/set your exam date/i);
  });

  it('reports a passed date rather than a negative pace', () => {
    const p = buildStudyPlan(shiftIso(TODAY, -2), ov(3, 0), NOW);
    expect(p.readiness).toBe('past');
    expect(p.daysLeft).toBe(-2);
    expect(p.perWeek).toBe(0);
  });

  it('computes whole days left at day granularity, ignoring the time of day', () => {
    const p = buildStudyPlan(shiftIso(TODAY, 14), ov(4, 0), NOW);
    expect(p.daysLeft).toBe(14);
    expect(p.weeksLeft).toBe(2);
  });

  it('is "ready" when nothing is left to make solid, today', () => {
    const p = buildStudyPlan(TODAY, ov(0, 0, 20), NOW);
    expect(p.readiness).toBe('ready');
    expect(p.daysLeft).toBe(0);
    expect(p.message).toMatch(/rest well/i);
  });

  it('is "ready" with time to spare when nothing is open', () => {
    const p = buildStudyPlan(shiftIso(TODAY, 10), ov(0, 0, 20), NOW);
    expect(p.readiness).toBe('ready');
    expect(p.message).toMatch(/10 days to spare/i);
  });

  it('calls a gentle pace on-track', () => {
    // 4 to close over 4 weeks → 1/week.
    const p = buildStudyPlan(shiftIso(TODAY, 28), ov(2, 2), NOW);
    expect(p.readiness).toBe('on-track');
    expect(p.perWeek).toBe(1);
  });

  it('calls a moderate pace tight', () => {
    // 9 to close over 3 weeks → 3/week.
    const p = buildStudyPlan(shiftIso(TODAY, 21), ov(5, 4), NOW);
    expect(p.readiness).toBe('tight');
    expect(p.perWeek).toBe(3);
  });

  it('calls a steep pace behind', () => {
    // 20 to close over 2 weeks → 10/week.
    const p = buildStudyPlan(shiftIso(TODAY, 14), ov(10, 10), NOW);
    expect(p.readiness).toBe('behind');
    expect(p.perWeek).toBe(10);
  });

  it('calls an imminent exam with real work behind, even if the count is small', () => {
    // 5 to close, 2 days left — too little time regardless of weekly maths.
    const p = buildStudyPlan(shiftIso(TODAY, 2), ov(5, 0), NOW);
    expect(p.readiness).toBe('behind');
  });

  it('pace arithmetic is checkable: ceil(toMakeSolid / weeksLeft)', () => {
    const p = buildStudyPlan(shiftIso(TODAY, 20), ov(7, 0), NOW);
    // 20 days -> ceil(20/7)=3 weeks; ceil(7/3)=3 per week.
    expect(p.weeksLeft).toBe(3);
    expect(p.perWeek).toBe(3);
  });
});
