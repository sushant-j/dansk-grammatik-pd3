import { describe, expect, it } from 'vitest';
import { COMMA_EXAMPLES } from '../content/commaExamples';
import { ALL_COMMA_RULE_IDS } from './commaRules';
import { buildCommaQuestion } from './commaExercise';

describe('content integrity', () => {
  it('every entry has a genuinely different correct and incorrect sentence', () => {
    for (const e of COMMA_EXAMPLES) {
      expect(e.incorrect, e.id).not.toBe(e.correct);
    }
  });

  it('every rule has at least two exercise sentences', () => {
    for (const ruleId of ALL_COMMA_RULE_IDS) {
      const pool = COMMA_EXAMPLES.filter((e) => e.ruleId === ruleId);
      expect(pool.length, ruleId).toBeGreaterThanOrEqual(2);
    }
  });

  it('every entry has a non-empty explanation', () => {
    for (const e of COMMA_EXAMPLES) {
      expect(e.explanation.length, e.id).toBeGreaterThan(10);
    }
  });

  it('has no duplicate ids', () => {
    const ids = COMMA_EXAMPLES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('buildCommaQuestion', () => {
  it('the correct option always matches the entry\'s correct sentence', () => {
    for (const e of COMMA_EXAMPLES) {
      const q = buildCommaQuestion(e, () => 0.5);
      expect(q.options[q.correctIndex]).toBe(e.correct);
    }
  });

  it('always presents exactly the two sentences from the entry', () => {
    for (const e of COMMA_EXAMPLES) {
      const q = buildCommaQuestion(e, () => 0.5);
      expect(q.options.sort()).toEqual([e.correct, e.incorrect].sort());
    }
  });

  it('tags the question with the entry\'s rule id', () => {
    for (const e of COMMA_EXAMPLES) {
      expect(buildCommaQuestion(e).ruleId).toBe(e.ruleId);
    }
  });

  it('carries the entry\'s explanation through unchanged', () => {
    for (const e of COMMA_EXAMPLES) {
      expect(buildCommaQuestion(e).explanation).toBe(e.explanation);
    }
  });
});
