import { describe, expect, it } from 'vitest';
import { VERB_BANK } from '../content/verbs';
import { buildVerbQuestion } from './verbExercise';

const WEAK_VERB = VERB_BANK.find((v) => v.verbClass === 'weak-ede')!;
const STRONG_VERB = VERB_BANK.find((v) => v.verbClass === 'strong')!;

describe('content integrity', () => {
  it('every verb has a distinct wrongPast from its real past tense', () => {
    for (const v of VERB_BANK) {
      expect(v.wrongPast, v.id).not.toBe(v.past);
    }
  });

  // Reflexive and particle verbs ("bevæge sig", "dukke op") carry their extra
  // word on every form; the suffix sits on the verb word itself.
  const verbWord = (form: string) => form.split(' ')[0];

  it('weak -ede verbs really end in -ede, and their wrong form does not', () => {
    for (const v of VERB_BANK.filter((x) => x.verbClass === 'weak-ede')) {
      expect(verbWord(v.past).endsWith('ede'), v.id).toBe(true);
    }
  });

  it('weak -te verbs really end in -te', () => {
    for (const v of VERB_BANK.filter((x) => x.verbClass === 'weak-te')) {
      expect(verbWord(v.past).endsWith('te'), v.id).toBe(true);
    }
  });

  it('irregular verbs are not just the stem plus a regular suffix', () => {
    // "Strong" here means irregular: true ablaut (gå → gik) and the irregular
    // weak verbs that change their vowel too (vælge → valgte, bringe → bragte).
    for (const v of VERB_BANK.filter((x) => x.verbClass === 'strong')) {
      const stem = verbWord(v.infinitive).replace(/e$/, '');
      const past = verbWord(v.past);
      expect(past === stem + 'ede' || past === stem + 'te', v.id).toBe(false);
    }
  });

  it('has both perfect auxiliaries represented', () => {
    expect(VERB_BANK.some((v) => v.perfectAux === 'er')).toBe(true);
    expect(VERB_BANK.some((v) => v.perfectAux === 'har')).toBe(true);
  });

  it('has all three verb classes represented', () => {
    expect(VERB_BANK.some((v) => v.verbClass === 'weak-ede')).toBe(true);
    expect(VERB_BANK.some((v) => v.verbClass === 'weak-te')).toBe(true);
    expect(VERB_BANK.some((v) => v.verbClass === 'strong')).toBe(true);
  });
});

describe('weak-suffix question', () => {
  it('the correct option is always the real past tense', () => {
    for (const v of VERB_BANK.filter((x) => x.verbClass !== 'strong')) {
      const q = buildVerbQuestion(v, 'weak-suffix', () => 0.5);
      expect(q.options[q.correctIndex]).toBe(v.past);
      expect(q.options).toContain(v.wrongPast);
    }
  });

  it('explains -ede vs -te correctly per verb class', () => {
    const edeQ = buildVerbQuestion(WEAK_VERB, 'weak-suffix', () => 0.5);
    expect(edeQ.explanation).toContain('-ede');

    const teVerb = VERB_BANK.find((v) => v.verbClass === 'weak-te')!;
    const teQ = buildVerbQuestion(teVerb, 'weak-suffix', () => 0.5);
    expect(teQ.explanation).toContain('-te');
  });
});

describe('strong-form question', () => {
  it('the correct option is always the real (irregular) past tense', () => {
    for (const v of VERB_BANK.filter((x) => x.verbClass === 'strong')) {
      const q = buildVerbQuestion(v, 'strong-form', () => 0.5);
      expect(q.options[q.correctIndex]).toBe(v.past);
      expect(q.options).toContain(v.wrongPast);
    }
  });

  it('never produces duplicate options', () => {
    for (const v of VERB_BANK) {
      const q = buildVerbQuestion(v, 'strong-form', () => 0.5);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});

describe('reflexive verbs', () => {
  it('only pair "sig" with a third-person subject', () => {
    const verb = { ...STRONG_VERB, infinitive: 'bevæge sig', past: 'bevægede sig', reflexive: true };
    for (let i = 0; i < 6; i++) {
      const q = buildVerbQuestion(verb, 'strong-form', () => i / 6);
      expect(q.prompt).toMatch(/: (Han|Hun|De) ___/);
    }
  });
});

describe('perfect-aux question', () => {
  it('the correct option always matches the verb\'s tagged auxiliary', () => {
    for (const v of VERB_BANK.filter((v) => v.perfectAux !== 'both')) {
      const q = buildVerbQuestion(v, 'perfect-aux', () => 0.5);
      expect(q.options[q.correctIndex]).toBe(v.perfectAux);
      expect(q.options.sort()).toEqual(['er', 'har']);
    }
  });

  it('the prompt uses the participle, not the infinitive or past tense', () => {
    const q = buildVerbQuestion(STRONG_VERB, 'perfect-aux', () => 0.5);
    expect(q.prompt).toContain(STRONG_VERB.participle);
  });

  it('explains motion/change-of-state verbs take er, others take har', () => {
    const erVerb = VERB_BANK.find((v) => v.perfectAux === 'er')!;
    const harVerb = VERB_BANK.find((v) => v.perfectAux === 'har')!;
    expect(buildVerbQuestion(erVerb, 'perfect-aux', () => 0.5).explanation).toContain('er');
    expect(buildVerbQuestion(harVerb, 'perfect-aux', () => 0.5).explanation).toContain('har');
  });
});

describe('rule attribution', () => {
  it('tags each kind with its matching rule id', () => {
    expect(buildVerbQuestion(WEAK_VERB, 'weak-suffix').ruleId).toBe('weak-suffix-choice');
    expect(buildVerbQuestion(STRONG_VERB, 'strong-form').ruleId).toBe('strong-verb-forms');
    expect(buildVerbQuestion(WEAK_VERB, 'perfect-aux').ruleId).toBe('perfect-auxiliary');
  });
});
