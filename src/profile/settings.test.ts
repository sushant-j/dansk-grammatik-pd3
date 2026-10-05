import { describe, expect, it } from 'vitest';
import {
  EXAM_DESCRIPTIONS,
  EXAM_LABELS,
  dateFromIso,
  daysUntil,
  isPlausibleExamIso,
  isoFromDate,
  pickerMinIso,
  resolveThemeMode,
  shiftIso,
  toggledThemeMode,
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

describe('ISO <-> Date helpers', () => {
  it('isoFromDate reads local date parts, even late in the evening', () => {
    // 23:30 local is already "tomorrow" in UTC for anyone east of Greenwich;
    // toISOString would report the wrong day there.
    expect(isoFromDate(new Date(2026, 11, 31, 23, 30))).toBe('2026-12-31');
    expect(isoFromDate(new Date(2026, 0, 1, 0, 0, 1))).toBe('2026-01-01');
  });

  it('dateFromIso lands on local midnight of that day', () => {
    const d = dateFromIso('2026-06-01');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 5, 1]);
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0]);
  });

  it('round-trips, including the days DST changes in Denmark', () => {
    for (const iso of ['2026-03-29', '2026-10-25', '2027-03-28', '2028-02-29', '2026-01-01']) {
      expect(isoFromDate(dateFromIso(iso))).toBe(iso);
    }
  });

  it('shiftIso crosses a DST change without losing a day', () => {
    expect(shiftIso('2027-03-27', 2)).toBe('2027-03-29');
    expect(shiftIso('2026-10-24', 2)).toBe('2026-10-26');
  });
});

describe('daysUntil around local midnight', () => {
  it('a second before midnight and a second after are a day apart', () => {
    const before = new Date(2026, 5, 1, 23, 59, 59).getTime();
    const after = new Date(2026, 5, 2, 0, 0, 1).getTime();
    expect(daysUntil('2026-06-02', before)).toBe(1);
    expect(daysUntil('2026-06-02', after)).toBe(0);
    expect(daysUntil('2026-06-01', after)).toBe(-1);
  });

  it('counts calendar days across the spring-forward DST change', () => {
    // 2027-03-28 is a 23-hour day in Denmark; a raw millisecond diff of
    // local midnights used to floor that span down to one day.
    const now = new Date(2027, 2, 27, 12).getTime();
    expect(daysUntil('2027-03-29', now)).toBe(2);
    expect(daysUntil('2027-06-01', now)).toBe(66);
  });

  it('counts calendar days across the autumn DST change', () => {
    const now = new Date(2026, 9, 24, 0, 0, 1).getTime();
    expect(daysUntil('2026-10-26', now)).toBe(2);
  });
});

describe('picker bounds', () => {
  it('pickerMinIso is today, or an already-past stored date', () => {
    expect(pickerMinIso(null, '2026-10-05')).toBe('2026-10-05');
    expect(pickerMinIso('2026-12-01', '2026-10-05')).toBe('2026-10-05');
    expect(pickerMinIso('2026-09-01', '2026-10-05')).toBe('2026-09-01');
  });

  it('isPlausibleExamIso rejects cleared fields, half-typed years and bad days', () => {
    const min = '2026-10-05';
    expect(isPlausibleExamIso('2027-05-20', min)).toBe(true);
    expect(isPlausibleExamIso('2026-10-05', min)).toBe(true);
    expect(isPlausibleExamIso('', min)).toBe(false);
    expect(isPlausibleExamIso('0002-05-20', min)).toBe(false);
    expect(isPlausibleExamIso('2026-10-04', min)).toBe(false);
    expect(isPlausibleExamIso('2027-02-30', min)).toBe(false);
    expect(isPlausibleExamIso('20270-05-20', min)).toBe(false);
  });
});

describe('toggledThemeMode', () => {
  it('flips whatever is currently on screen', () => {
    expect(toggledThemeMode('light')).toBe('dark');
    expect(toggledThemeMode('dark')).toBe('light');
  });

  it('from system, pins the opposite of the OS scheme so the tap is visible', () => {
    const shown = resolveThemeMode('system', 'dark');
    const next = toggledThemeMode(shown);
    expect(next).toBe('light');
    expect(resolveThemeMode(next, 'dark')).toBe('light');
  });
});

describe('resolveThemeMode', () => {
  it('an explicit preference always wins over the OS scheme', () => {
    expect(resolveThemeMode('light', 'dark')).toBe('light');
    expect(resolveThemeMode('dark', 'light')).toBe('dark');
  });

  it('system follows the OS, defaulting to light for anything not "dark"', () => {
    expect(resolveThemeMode('system', 'dark')).toBe('dark');
    expect(resolveThemeMode('system', 'light')).toBe('light');
    expect(resolveThemeMode('system', null)).toBe('light');
    expect(resolveThemeMode('system', undefined)).toBe('light');
    expect(resolveThemeMode('system', 'unspecified')).toBe('light');
  });

  it('defaults themeMode to system', () => {
    expect(useSettings.getState().themeMode).toBe('system');
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
