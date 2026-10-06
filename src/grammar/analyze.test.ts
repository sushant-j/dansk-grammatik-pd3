import { describe, expect, it } from 'vitest';
import { EXERCISES, exerciseById } from '../content/exercises';
import { evaluate, renderSentence, trayTokens } from './analyze';
import { fieldsFor } from './fields';
import type { Placement } from './types';

/**
 * These tests protect the thing the whole app rests on: that a wrong answer
 * gets named as the right rule. A trainer that mislabels an error is worse
 * than one that says nothing.
 */

describe('content integrity', () => {
  it('gives every offered exam a pool the exam-focus feature can actually lean on', () => {
    // The exam-focus setting biases the trainer toward the learner's exam. If
    // a level's pool is near-empty, that bias has nothing to select and the
    // feature is a promise the content can't keep. Guards against the pool
    // quietly thinning back out as PD3-only exercises are added over time.
    for (const exam of ['PD2', 'PD3'] as const) {
      const pool = EXERCISES.filter((e) => e.exams.includes(exam));
      expect(pool.length, `${exam} exercise pool`).toBeGreaterThanOrEqual(8);
    }
  });

  it('never lets FVU become a focus dead-end on the word-order map', () => {
    // FVU's real trainer is spelling, not the sætningsskema, so it does not
    // need the ≥8 pool the PD exams do. But it must light up *something*:
    // if zero exercises carry FVU, picking FVU dims the entire map to "NOT ON
    // FVU" and biases toward nothing — a broken option. At least the basic
    // sentence-construction exercises stay tagged.
    const fvu = EXERCISES.filter((e) => e.exams.includes('FVU'));
    expect(fvu.length, 'FVU exercise pool').toBeGreaterThanOrEqual(1);
  });

  it('every exercise places all its tokens exactly once in the solution', () => {
    for (const ex of EXERCISES) {
      const placed = Object.values(ex.solution).flat();
      expect(placed.sort(), `solution for ${ex.id}`).toEqual(
        ex.tokens.map((t) => t.id).sort(),
      );
    }
  });

  it('every alternative also places all tokens exactly once', () => {
    for (const ex of EXERCISES) {
      for (const [i, alt] of (ex.alternatives ?? []).entries()) {
        const placed = Object.values(alt).flat();
        expect(placed.sort(), `${ex.id} alternative ${i}`).toEqual(
          ex.tokens.map((t) => t.id).sort(),
        );
      }
    }
  });

  it('only uses fields that exist in the clause schema', () => {
    for (const ex of EXERCISES) {
      const legal = new Set(fieldsFor(ex.clause).map((f) => f.id));
      for (const cand of [ex.solution, ...(ex.alternatives ?? [])]) {
        for (const key of Object.keys(cand)) {
          expect(legal.has(key as never), `${ex.id} uses ${key}`).toBe(true);
        }
      }
    }
  });

  it('respects the declared capacity of each field', () => {
    for (const ex of EXERCISES) {
      const defs = fieldsFor(ex.clause);
      for (const cand of [ex.solution, ...(ex.alternatives ?? [])]) {
        for (const [key, ids] of Object.entries(cand)) {
          const d = defs.find((f) => f.id === key)!;
          expect(ids!.length, `${ex.id} ${key}`).toBeLessThanOrEqual(d.capacity);
        }
      }
    }
  });

  it('the canonical solution always evaluates as correct', () => {
    for (const ex of EXERCISES) {
      const res = evaluate(ex, ex.solution);
      expect(res.correct, `${ex.id}`).toBe(true);
      expect(res.viaAlternative).toBe(false);
      expect(res.diagnoses).toHaveLength(0);
    }
  });

  it('every declared alternative is accepted, and flagged as an alternative', () => {
    for (const ex of EXERCISES) {
      for (const [i, alt] of (ex.alternatives ?? []).entries()) {
        const res = evaluate(ex, alt);
        expect(res.correct, `${ex.id} alt ${i}`).toBe(true);
        expect(res.viaAlternative, `${ex.id} alt ${i}`).toBe(true);
      }
    }
  });
});

describe('renderSentence', () => {
  it('reads the schema left to right and capitalises a main clause', () => {
    const ex = exerciseById('ex-igaar')!;
    expect(renderSentence(ex, ex.solution)).toBe('I går gik jeg ikke på arbejde.');
  });

  it('leaves a subordinate clause uncapitalised and unpunctuated', () => {
    const ex = exerciseById('ex-fordi-ikke')!;
    expect(renderSentence(ex, ex.solution)).toBe('fordi jeg ikke kan komme i morgen');
  });

  it('renders the learner arrangement, not the answer', () => {
    const ex = exerciseById('ex-igaar')!;
    const wrong: Placement = {
      forfelt: ['w3'],
      finitVerbum: ['w2'],
      centraladverbial: ['w4'],
      indholdsadverbial: ['w1', 'w5'],
    };
    expect(renderSentence(ex, wrong)).toBe('Jeg gik ikke i går på arbejde.');
  });

  it('sets a whole subordinate clause off with a comma, before or after it', () => {
    const fronted = exerciseById('ex-hvis-regner-hjemme')!;
    expect(renderSentence(fronted, fronted.solution)).toBe('Hvis det regner, bliver vi hjemme.');
    expect(renderSentence(fronted, fronted.alternatives![0])).toBe('Vi bliver hjemme, hvis det regner.');
    const reported = exerciseById('ex-siger-altid-travlt')!;
    expect(renderSentence(reported, reported.solution)).toBe('Han siger altid, at han har travlt.');
  });

  it('ends a question with a question mark, with no comma after a fronted hv-word', () => {
    const ex = exerciseById('ex-hvornaar-kommer-hjem')!;
    expect(renderSentence(ex, ex.solution)).toBe('Hvornår kommer du hjem?');
  });

});

describe('the ikke-regel', () => {
  const ex = exerciseById('ex-fordi-ikke')!;

  it('flags a central adverb placed after the finite verb', () => {
    // The main-clause pattern misapplied: "fordi jeg kan komme ikke i morgen"
    const attempt: Placement = {
      konjunktional: ['w1'],
      subjekt: ['w2'],
      finitVerbum: ['w4'],
      infinitVerbum: ['w5'],
      indholdsadverbial: ['w3', 'w6'],
    };
    const res = evaluate(ex, attempt);
    expect(res.correct).toBe(false);
    expect(res.diagnoses.map((d) => d.ruleId)).toContain('ikke-regel');
    const d = res.diagnoses.find((x) => x.ruleId === 'ikke-regel')!;
    expect(d.message).toContain('BEFORE');
    expect(d.tokenIds).toContain('w3');
  });

  it('accepts the correct pre-verbal placement without complaint', () => {
    expect(evaluate(ex, ex.solution).diagnoses).toHaveLength(0);
  });
});

describe('inversion in a main clause', () => {
  const ex = exerciseById('ex-derfor')!;

  it('flags the subject taking the Forfelt when something else is fronted', () => {
    // "Jeg kan ikke deltage derfor i mødet" — subject wrongly fronted.
    const attempt: Placement = {
      forfelt: ['w3'],
      finitVerbum: ['w2'],
      centraladverbial: ['w4'],
      infinitVerbum: ['w5'],
      indholdsadverbial: ['w1', 'w6'],
    };
    const res = evaluate(ex, attempt);
    expect(res.correct).toBe(false);
    expect(res.diagnoses.map((d) => d.ruleId)).toContain('v2-inversion');
  });
});

describe('the Forfelt holds one constituent', () => {
  const ex = exerciseById('ex-igaar')!;

  it('flags two constituents crammed in front of the verb', () => {
    // The signature error: "I går jeg gik ikke på arbejde."
    const attempt: Placement = {
      forfelt: ['w1', 'w3'],
      finitVerbum: ['w2'],
      centraladverbial: ['w4'],
      indholdsadverbial: ['w5'],
    };
    const res = evaluate(ex, attempt);
    expect(res.correct).toBe(false);
    expect(res.diagnoses.map((d) => d.ruleId)).toContain('forfelt-single');
    expect(res.diagnoses[0].severity).toBe('error');
  });

  it('is expressible on the board — the Forfelt accepts a second word', () => {
    const forfelt = fieldsFor('helsætning').find((f) => f.id === 'forfelt')!;
    expect(forfelt.capacity).toBeGreaterThan(1);
  });
});

describe('adverbial type confusion', () => {
  const ex = exerciseById('ex-kantinen')!;

  it('flags a content adverbial put in the central slot', () => {
    const attempt: Placement = {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      centraladverbial: ['w4'],
      indholdsadverbial: ['w3'],
    };
    const res = evaluate(ex, attempt);
    expect(res.correct).toBe(false);
    expect(res.diagnoses.map((d) => d.ruleId)).toContain('central-vs-content-adverbial');
  });
});

describe('the verb cluster', () => {
  const ex = exerciseById('ex-har-spist')!;

  it('flags a participle left outside the non-finite slot', () => {
    // "Jeg har ikke morgenmad spist i dag" — participle dumped in the object slot.
    const attempt: Placement = {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      centraladverbial: ['w3'],
      objekt: ['w5', 'w4'],
      indholdsadverbial: ['w6'],
    };
    const res = evaluate(ex, attempt);
    expect(res.correct).toBe(false);
    expect(res.diagnoses.map((d) => d.ruleId)).toContain('verb-cluster-order');
  });
});

describe('partial credit and unfinished boards', () => {
  const ex = exerciseById('ex-igaar')!;

  it('reports accuracy as the fraction of tokens in the right field', () => {
    const attempt: Placement = {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      subjekt: ['w3'],
      centraladverbial: ['w5'],
      indholdsadverbial: ['w4'],
    };
    const res = evaluate(ex, attempt);
    expect(res.accuracy).toBeCloseTo(3 / 5, 5);
  });

  it('names the words still in the tray', () => {
    const res = evaluate(ex, { forfelt: ['w1'], finitVerbum: ['w2'] });
    const d = res.diagnoses.find((x) => x.message.includes('Still to place'))!;
    expect(d).toBeDefined();
    expect(d.tokenIds.sort()).toEqual(['w3', 'w4', 'w5']);
  });

  it('grades against the closest accepted answer, not always the canonical one', () => {
    // Subject-first is a declared alternative for this exercise. An attempt
    // that is subject-first but otherwise flawed must not be told to invert.
    const ex2 = exerciseById('ex-om-sommeren')!;
    const attempt: Placement = {
      forfelt: ['w3'],
      finitVerbum: ['w2'],
      centraladverbial: ['w1'],
      indholdsadverbial: ['w5', 'w4'],
    };
    const res = evaluate(ex2, attempt);
    expect(res.correct).toBe(false);
    expect(res.diagnoses.map((d) => d.ruleId)).not.toContain('v2-inversion');
  });

  it('does not blame inversion for a plain misplaced adverbial', () => {
    // ex-om-sommeren is *built* to drill inversion, but this attempt gets the
    // inversion right and only misfiles "til Skagen". Attributing the error to
    // the exercise's headline rule would teach the wrong lesson.
    const ex2 = exerciseById('ex-om-sommeren')!;
    const attempt: Placement = {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      subjekt: ['w3'],
      centraladverbial: ['w4'],
      objekt: ['w5'], // "til Skagen" misfiled as an object
    };
    const res = evaluate(ex2, attempt);
    expect(res.correct).toBe(false);
    expect(res.diagnoses.map((d) => d.ruleId)).not.toContain('v2-inversion');
    // and the message should say where it actually belongs
    expect(res.diagnoses[0].message).toContain('Indholdsadverbial');
  });

  it('never returns an empty diagnosis list for a wrong answer', () => {
    for (const ex2 of EXERCISES) {
      const shuffled: Placement = { forfelt: ex2.tokens.map((t) => t.id).slice(0, 2) };
      const res = evaluate(ex2, shuffled);
      if (!res.correct) {
        expect(res.diagnoses.length, `${ex2.id}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('double objects', () => {
  const ex = exerciseById('ex-sendte-chef-mail')!;

  it('flags the objects swapped', () => {
    const attempt: Placement = {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      objekt: ['w4', 'w3'], // "en mail" before "sin chef" — backwards
      indholdsadverbial: ['w5'],
    };
    const res = evaluate(ex, attempt);
    expect(res.correct).toBe(false);
    expect(res.diagnoses.map((d) => d.ruleId)).toContain('object-order');
  });

  it('accepts the correct receiver-then-thing order', () => {
    expect(evaluate(ex, ex.solution).correct).toBe(true);
  });
});

describe('stacked content adverbials', () => {
  const ex = exerciseById('ex-cyklede-skole')!;

  it('flags every word in the right field but the wrong internal order', () => {
    // time, manner, place instead of manner, place, time
    const attempt: Placement = {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      indholdsadverbial: ['w5', 'w3', 'w4'],
    };
    const res = evaluate(ex, attempt);
    expect(res.correct).toBe(false);
    expect(res.diagnoses.map((d) => d.ruleId)).toContain('adverbial-order');
    // and it must not be silently empty, which was the gap this rule closed
    expect(res.diagnoses.length).toBeGreaterThan(0);
  });

  it('accepts manner-place-time order', () => {
    expect(evaluate(ex, ex.solution).correct).toBe(true);
  });
});

describe('relative clauses with som', () => {
  const ex = exerciseById('ex-som-ikke-loese')!;

  it('treats "som" as an ordinary subordinator and still enforces the ikke-regel', () => {
    // "ikke" wrongly dumped in the non-finite slot instead of before the verb
    const wrong: Placement = {
      konjunktional: ['w1'],
      subjekt: ['w2'],
      finitVerbum: ['w4'],
      infinitVerbum: ['w3'],
    };
    const res = evaluate(ex, wrong);
    expect(res.correct).toBe(false);
    expect(res.diagnoses.length).toBeGreaterThan(0);
  });

  it('accepts the correct subordinate order', () => {
    expect(evaluate(ex, ex.solution).correct).toBe(true);
  });
});

describe('trayTokens', () => {
  it('returns the unplaced tokens in presentation order', () => {
    const ex = exerciseById('ex-igaar')!;
    expect(trayTokens(ex, { forfelt: ['w1'] }).map((t) => t.id)).toEqual([
      'w2',
      'w3',
      'w4',
      'w5',
    ]);
  });
});
