import { describe, expect, it } from 'vitest';
import { PRACTICE_TOPICS, TOPICS, allYears, topicById } from './topics';

describe('official 2024-S oral set', () => {
  const official = TOPICS.filter((t) => t.year === 2024 && t.term === 'S');

  it('has the three published topics A, B and C', () => {
    expect(official.map((t) => t.label)).toEqual(['A', 'B', 'C']);
    expect(official.every((t) => t.source?.url.startsWith('https://danskogproever.dk/'))).toBe(true);
  });

  it('follows the booklet shape: a first question per picture, a second question, each with a follow-up', () => {
    for (const t of official) {
      expect(t.questions.map((q) => q.kind)).toEqual(['main', 'follow', 'main', 'follow', 'obligatory', 'follow']);
      expect(t.questions.filter((q) => q.situation).map((q) => q.situation)).toEqual(['A', 'B']);
      expect(t.scenes).toHaveLength(2);
      for (const q of t.questions) expect(q.a.length).toBeGreaterThan(150);
    }
  });

  it('has unique ids that resolve and shows up in the year filter', () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(topicById('2024-s-mangel-paa-arbejdskraft')?.title).toBe('Mangel på arbejdskraft');
    expect(allYears()[0]).toBe(2024);
  });
});

describe('practice topics', () => {
  it('gives every follow-up its own answer rather than repeating the previous one', () => {
    for (const t of PRACTICE_TOPICS) {
      t.questions.forEach((q, i) => {
        if (i > 0) expect(q.a).not.toBe(t.questions[i - 1].a);
      });
    }
  });
});
