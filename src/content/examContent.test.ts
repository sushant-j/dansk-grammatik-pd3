import { describe, expect, it } from 'vitest';
import { EXAM_GUIDES, GUIDE_ORDER } from './examGuides';
import { WRITING_TASKS } from './writingTasks';
import { offlineProvider } from '../feedback/offlineRules';

describe('exam guides', () => {
  it('has a guide for every exam in the switcher, each with official links', () => {
    for (const exam of GUIDE_ORDER) {
      const g = EXAM_GUIDES[exam];
      expect(g.exam).toBe(exam);
      expect(g.sections.length).toBeGreaterThan(0);
      for (const sec of g.sections) {
        expect(sec.parts.length).toBeGreaterThan(0);
        expect(sec.docs.every((d) => d.url.startsWith('https://'))).toBe(true);
      }
    }
  });

  it('covers reading, writing and speaking for PD2 and PD3', () => {
    for (const exam of ['PD2', 'PD3'] as const) {
      expect(EXAM_GUIDES[exam].sections.map((s) => s.key)).toEqual(['reading', 'writing', 'speaking']);
    }
  });
});

describe('writing tasks', () => {
  it('offers tasks for each exam', () => {
    for (const exam of ['PD3', 'PD2', 'FVU'] as const) {
      expect(WRITING_TASKS.some((t) => t.exam === exam)).toBe(true);
    }
  });

  it('never labels FVU practice as official', () => {
    expect(WRITING_TASKS.filter((t) => t.exam === 'FVU').every((t) => !t.task.source)).toBe(true);
  });

  it('applies the PD2 e-mail 100-word minimum even though it is a letter', async () => {
    const entry = WRITING_TASKS.find((t) => t.exam === 'PD2' && t.task.minWords === 100)!;
    expect(entry.task.kind).toBe('letter');
    const fb = await offlineProvider.review('Hej Viktor. Jeg bor i en lille lejlighed.', entry.task);
    expect(fb.notes[0]).toMatch(/at least 100/);
  });
});
