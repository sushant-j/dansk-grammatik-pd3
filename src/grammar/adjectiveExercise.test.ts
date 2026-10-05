import { describe, expect, it } from 'vitest';
import { ADJECTIVE_BANK } from '../content/adjectives';
import { NOUN_BANK } from '../content/nouns';
import { buildAdjectiveQuestion } from './adjectiveExercise';

const EN_NOUN = NOUN_BANK.find((n) => n.gender === 'en')!;
const ET_NOUN = NOUN_BANK.find((n) => n.gender === 'et')!;

describe('content integrity', () => {
  it('every adjective has a distinct -e form from its base', () => {
    for (const a of ADJECTIVE_BANK) {
      expect(a.eForm, a.id).not.toBe(a.base);
    }
  });

  it('every adjective has a distinct -e form from its -t form', () => {
    for (const a of ADJECTIVE_BANK) {
      expect(a.eForm, a.id).not.toBe(a.tForm);
    }
  });

  it('the two irregular entries carry an explanatory note', () => {
    const dansk = ADJECTIVE_BANK.find((a) => a.id === 'a-dansk')!;
    const lille = ADJECTIVE_BANK.find((a) => a.id === 'a-lille')!;
    expect(dansk.irregularNote).toBeTruthy();
    expect(lille.irregularNote).toBeTruthy();
    expect(dansk.base).toBe(dansk.tForm);
    expect(lille.base).toBe(lille.tForm);
  });

  it('regular adjectives have three genuinely distinct forms', () => {
    for (const a of ADJECTIVE_BANK.filter((x) => !x.irregularNote)) {
      expect(new Set([a.base, a.tForm, a.eForm]).size, a.id).toBe(3);
    }
  });
});

describe('common-form question', () => {
  it('the correct option is always the bare base form', () => {
    for (const a of ADJECTIVE_BANK) {
      const q = buildAdjectiveQuestion(EN_NOUN, a, 'common-form', () => 0.5);
      expect(q.options[q.correctIndex]).toBe(a.base);
    }
  });

  it('never produces duplicate options, even for irregular adjectives', () => {
    for (const a of ADJECTIVE_BANK) {
      const q = buildAdjectiveQuestion(EN_NOUN, a, 'common-form', () => 0.5);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });

  it('always has at least one distractor', () => {
    for (const a of ADJECTIVE_BANK) {
      const q = buildAdjectiveQuestion(EN_NOUN, a, 'common-form', () => 0.5);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('neuter-form question', () => {
  it('the correct option is always the -t form', () => {
    for (const a of ADJECTIVE_BANK) {
      const q = buildAdjectiveQuestion(ET_NOUN, a, 'neuter-form', () => 0.5);
      expect(q.options[q.correctIndex]).toBe(a.tForm);
    }
  });

  it('produces a valid two-option question for irregular adjectives (base === tForm)', () => {
    const dansk = ADJECTIVE_BANK.find((a) => a.id === 'a-dansk')!;
    const q = buildAdjectiveQuestion(ET_NOUN, dansk, 'neuter-form', () => 0.5);
    expect(q.options).toHaveLength(2);
    expect(new Set(q.options).size).toBe(2);
    expect(q.options).toContain(dansk.eForm);
  });

  it('mentions the irregularity in the explanation when one exists', () => {
    const lille = ADJECTIVE_BANK.find((a) => a.id === 'a-lille')!;
    const q = buildAdjectiveQuestion(ET_NOUN, lille, 'neuter-form', () => 0.5);
    expect(q.explanation).toContain(lille.irregularNote);
  });
});

describe('e-form question', () => {
  it('the correct option is always the -e form', () => {
    for (const a of ADJECTIVE_BANK) {
      const q = buildAdjectiveQuestion(EN_NOUN, a, 'e-form', () => 0.5);
      expect(q.options[q.correctIndex]).toBe(a.eForm);
    }
  });

  it('uses "den" for en-word nouns and "det" for et-word nouns', () => {
    const a = ADJECTIVE_BANK[0];
    const qEn = buildAdjectiveQuestion(EN_NOUN, a, 'e-form', () => 0.5);
    const qEt = buildAdjectiveQuestion(ET_NOUN, a, 'e-form', () => 0.5);
    expect(qEn.prompt).toContain('den ___');
    expect(qEt.prompt).toContain('det ___');
  });
});

describe('rule attribution', () => {
  it('tags each kind with its matching rule id', () => {
    const a = ADJECTIVE_BANK[0];
    expect(buildAdjectiveQuestion(EN_NOUN, a, 'common-form').ruleId).toBe('adjective-common-form');
    expect(buildAdjectiveQuestion(ET_NOUN, a, 'neuter-form').ruleId).toBe('adjective-neuter-form');
    expect(buildAdjectiveQuestion(EN_NOUN, a, 'e-form').ruleId).toBe('adjective-e-form');
  });
});

describe('the English explanation', () => {
  it('names the right answer for every kind of question, or the irregularity', () => {
    const noun = NOUN_BANK[0];
    for (const adjective of ADJECTIVE_BANK.slice(0, 40)) {
      for (const kind of ['common-form', 'neuter-form', 'e-form'] as const) {
        const q = buildAdjectiveQuestion(noun, adjective, kind);
        const expected = kind === 'neuter-form' && adjective.irregularNote ? adjective.irregularNote : q.options[q.correctIndex];
        expect(q.explanationEn).toContain(expected);
      }
    }
  });
});
