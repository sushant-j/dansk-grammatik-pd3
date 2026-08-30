import { describe, expect, it } from 'vitest';
import { SPELLING_EXAMPLES } from '../content/spellingExamples';
import { ALL_SPELLING_RULE_IDS } from './spellingRules';
import { buildSpellingQuestion } from './spellingExercise';

describe('content integrity', () => {
  it('every entry has a genuinely different correct and incorrect word', () => {
    for (const e of SPELLING_EXAMPLES) {
      expect(e.incorrect, e.id).not.toBe(e.correct);
    }
  });

  it('every entry\'s prompt contains a blank', () => {
    for (const e of SPELLING_EXAMPLES) {
      expect(e.prompt, e.id).toContain('___');
    }
  });

  it('every rule has at least two exercise sentences', () => {
    for (const ruleId of ALL_SPELLING_RULE_IDS) {
      const pool = SPELLING_EXAMPLES.filter((e) => e.ruleId === ruleId);
      expect(pool.length, ruleId).toBeGreaterThanOrEqual(2);
    }
  });

  it('has no duplicate ids', () => {
    const ids = SPELLING_EXAMPLES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('the silent-d entries genuinely drop only the d between the two words', () => {
    for (const e of SPELLING_EXAMPLES.filter((x) => x.ruleId === 'silent-d')) {
      expect(e.correct.replace(/d/g, ''), e.id).toBe(e.incorrect);
    }
  });

  it('the silent-h entries genuinely drop only the leading h', () => {
    for (const e of SPELLING_EXAMPLES.filter((x) => x.ruleId === 'silent-h-hv')) {
      expect(e.correct.toLowerCase(), e.id).toBe('h' + e.incorrect.toLowerCase());
    }
  });
});

describe('buildSpellingQuestion', () => {
  it('the correct option always matches the entry\'s correct word', () => {
    for (const e of SPELLING_EXAMPLES) {
      const q = buildSpellingQuestion(e, () => 0.5);
      expect(q.options[q.correctIndex]).toBe(e.correct);
    }
  });

  it('always presents exactly the two words from the entry', () => {
    for (const e of SPELLING_EXAMPLES) {
      const q = buildSpellingQuestion(e, () => 0.5);
      expect(q.options.sort()).toEqual([e.correct, e.incorrect].sort());
    }
  });

  it('carries the prompt and explanation through unchanged', () => {
    for (const e of SPELLING_EXAMPLES) {
      const q = buildSpellingQuestion(e);
      expect(q.prompt).toBe(e.prompt);
      expect(q.explanation).toBe(e.explanation);
      expect(q.ruleId).toBe(e.ruleId);
    }
  });
});
