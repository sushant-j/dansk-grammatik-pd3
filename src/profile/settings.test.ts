import { describe, expect, it } from 'vitest';
import {
  EXAM_DESCRIPTIONS,
  EXAM_LABELS,
  daysUntil,
  shiftIso,
  todayIso,
  useSettings,
} from './settings';

describe('useSettings', () => {
  it('defaults to no target exam', () => {
    expect(useSettings.getState().targetExam).toBeNull();
  });

  it('sets and clears the target exam', () => {
    useSettings.getState().setTargetExam('PD3');
    expect(useSettings.getState().targetExam).toBe('PD3');

    useSettings.getState().setTargetExam(null);
    expect(useSettings.getState().targetExam).toBeNull();
  });

  it('starts un-onboarded and latches once completed', () => {
    // Fresh users see the welcome (onboarded false); completing it latches
    // true so it never shows again. It lives in the persisted partial, so the
    // latch survives reloads.
    expect(useSettings.getState().onboarded).toBe(false);
    useSettings.getState().setOnboarded(true);
    expect(useSettings.getState().onboarded).toBe(true);
    useSettings.getState().setOnboarded(false); // reset for other tests
  });
});

describe('date helpers', () => {
  it('daysUntil counts whole days at day granularity, ignoring time of day', () => {
    const now = new Date('2026-06-01T23:30:00').getTime();
    expect(daysUntil('2026-06-01', now)).toBe(0);
    expect(daysUntil('2026-06-08', now)).toBe(7);
    expect(daysUntil('2026-05-30', now)).toBe(-2);
  });

  it('shiftIso moves an ISO date by whole days both ways', () => {
    expect(shiftIso('2026-06-01', 7)).toBe('2026-06-08');
    expect(shiftIso('2026-06-01', -1)).toBe('2026-05-31');
  });

  it('todayIso formats local Y-M-D with zero padding', () => {
    expect(todayIso(new Date('2026-03-05T10:00:00'))).toBe('2026-03-05');
  });
});

describe('exam labels and descriptions', () => {
  it('has a label and description for every exam offered in the picker', () => {
    for (const exam of ['PD2', 'PD3', 'FVU'] as const) {
      expect(EXAM_LABELS[exam]).toBeTruthy();
      expect(EXAM_DESCRIPTIONS[exam].length).toBeGreaterThan(10);
    }
  });
});
