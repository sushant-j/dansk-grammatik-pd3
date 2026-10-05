import { describe, expect, it } from 'vitest';
import { NOUN_BANK } from '../content/nouns';
import { buildQuestion } from './nounExercise';

/**
 * The distractor IS the lesson in this module, so these tests protect the
 * thing that actually matters: every wrong option must be the *specific*
 * plausible mistake, never an arbitrary one, and the correct answer must
 * always be present and locatable by its index.
 */

describe('content integrity', () => {
  it('every noun has a gender-consistent definite suffix', () => {
    for (const n of NOUN_BANK) {
      const suffix = n.gender === 'en' ? 'en' : 'et';
      expect(n.definite.endsWith(suffix), `${n.word} definite="${n.definite}"`).toBe(true);
    }
  });

  it('the wrong-definite distractor uses the opposite suffix, not the correct one', () => {
    for (const n of NOUN_BANK) {
      expect(n.wrongDefinite, n.word).not.toBe(n.definite);
      const oppositeSuffix = n.gender === 'en' ? 'et' : 'en';
      expect(n.wrongDefinite.endsWith(oppositeSuffix), `${n.word} wrongDefinite="${n.wrongDefinite}"`).toBe(
        true,
      );
    }
  });

  it('has both genders represented', () => {
    expect(NOUN_BANK.some((n) => n.gender === 'en')).toBe(true);
    expect(NOUN_BANK.some((n) => n.gender === 'et')).toBe(true);
  });
});

describe('gender question', () => {
  it('always contains exactly en and et as options', () => {
    for (const n of NOUN_BANK) {
      const q = buildQuestion(n, 'gender', () => 0.5);
      expect([...q.options].sort()).toEqual(['en', 'et']);
      expect(q.options[q.correctIndex]).toBe(n.gender);
    }
  });
});

describe('definite-suffix question', () => {
  it('the correct option is always the noun\'s real definite form', () => {
    for (const n of NOUN_BANK) {
      const q = buildQuestion(n, 'definite-suffix', () => 0.5);
      expect(q.options[q.correctIndex]).toBe(n.definite);
      expect(q.options).toContain(n.wrongDefinite);
      expect(q.options).toHaveLength(2);
    }
  });
});

describe('double-definite question', () => {
  it('the correct option uses the bare noun with the right article', () => {
    for (const n of NOUN_BANK) {
      const q = buildQuestion(n, 'double-definite', () => 0.5);
      const article = n.gender === 'en' ? 'den' : 'det';
      expect(q.options[q.correctIndex]).toBe(`${article} ${n.adjectiveE} ${n.word}`);
    }
  });

  it('includes the double-marking error as a distractor', () => {
    for (const n of NOUN_BANK) {
      const q = buildQuestion(n, 'double-definite', () => 0.5);
      const article = n.gender === 'en' ? 'den' : 'det';
      const doubleMarked = `${article} ${n.adjectiveE} ${n.definite}`;
      expect(q.options).toContain(doubleMarked);
      expect(doubleMarked).not.toBe(q.options[q.correctIndex]);
    }
  });

  it('includes the wrong-gender-article error as a distractor', () => {
    for (const n of NOUN_BANK) {
      const q = buildQuestion(n, 'double-definite', () => 0.5);
      const wrongArticle = n.gender === 'en' ? 'det' : 'den';
      const wrongOption = `${wrongArticle} ${n.adjectiveE} ${n.word}`;
      expect(q.options).toContain(wrongOption);
    }
  });

  it('never produces duplicate options', () => {
    for (const n of NOUN_BANK) {
      const q = buildQuestion(n, 'double-definite', () => 0.5);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});

describe('rule attribution', () => {
  it('tags each question kind with its matching rule id', () => {
    const n = NOUN_BANK[0];
    expect(buildQuestion(n, 'gender').ruleId).toBe('en-et-gender');
    expect(buildQuestion(n, 'definite-suffix').ruleId).toBe('definite-suffix');
    expect(buildQuestion(n, 'double-definite').ruleId).toBe('double-definiteness');
  });
});

describe('the English explanation', () => {
  it('names the right answer for every kind of question', () => {
    for (const noun of NOUN_BANK.slice(0, 40)) {
      for (const kind of ['gender', 'definite-suffix', 'double-definite'] as const) {
        const q = buildQuestion(noun, kind);
        expect(q.explanationEn).toContain(q.options[q.correctIndex]);
      }
    }
  });
});
