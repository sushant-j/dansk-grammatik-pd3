import { describe, expect, it } from 'vitest';
import { EXAM_DESCRIPTIONS, EXAM_LABELS, useSettings } from './settings';

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
});

describe('exam labels and descriptions', () => {
  it('has a label and description for every exam offered in the picker', () => {
    for (const exam of ['PD2', 'PD3', 'FVU'] as const) {
      expect(EXAM_LABELS[exam]).toBeTruthy();
      expect(EXAM_DESCRIPTIONS[exam].length).toBeGreaterThan(10);
    }
  });
});
