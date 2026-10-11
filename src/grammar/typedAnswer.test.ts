import { describe, expect, it } from 'vitest';
import { EXERCISES, exerciseById } from '../content/exercises';
import { evaluate } from './analyze';
import {
  commaSentenceSeed,
  matchOption,
  normalizeTyped,
  placementFromTyped,
  sameSentence,
  typedFromPlacement,
} from './typedAnswer';
import type { Exercise } from './types';

/**
 * Typing replaced tapping, so a typed answer that is right must grade right.
 * The worst failure here is not a crash but a learner typing the correct
 * sentence and being told it is wrong.
 */

describe('normalizeTyped', () => {
  it('forgives case, spacing and a closing full stop', () => {
    expect(normalizeTyped('  Den  unge Mand. ')).toBe('den unge mand');
  });

  it('keeps æ, ø and å distinct from their look-alikes', () => {
    expect(normalizeTyped('gå')).not.toBe(normalizeTyped('ga'));
    expect(normalizeTyped('rød')).not.toBe(normalizeTyped('rod'));
    expect(normalizeTyped('æble')).not.toBe(normalizeTyped('aeble'));
  });

  it('treats a decomposed å as the same letter', () => {
    expect(normalizeTyped('gå')).toBe(normalizeTyped('gå'));
  });
});

describe('matchOption', () => {
  const options = ['spiste', 'spist'];
  it('finds the typed option regardless of case', () => {
    expect(matchOption('Spist', options)).toBe(1);
  });
  it('lets the words every option shares be left off, but not the part being tested', () => {
    const reflexive = ['glædede sig', 'glædte sig'];
    expect(matchOption('glædede', reflexive)).toBe(0);
    expect(matchOption('glædede sig', reflexive)).toBe(0);
    expect(matchOption('glædte', reflexive)).toBe(1);
    expect(matchOption('sig', reflexive)).toBe(-1);
    // No shared ending: nothing may be dropped.
    expect(matchOption('den unge', ['den unge mand', 'den unge manden'])).toBe(-1);
  });
  it('is -1 for anything that is not an option, including nothing', () => {
    expect(matchOption('spisede', options)).toBe(-1);
    expect(matchOption('  ', options)).toBe(-1);
  });
});

describe('comma sentences', () => {
  const key = 'Jeg er træt, men jeg skal på arbejde.';
  it('seeds the input with every comma removed', () => {
    expect(commaSentenceSeed(key)).toBe('Jeg er træt men jeg skal på arbejde.');
  });
  it('accepts the key however the comma is spaced', () => {
    expect(sameSentence('jeg er træt ,men jeg skal på arbejde', key)).toBe(true);
  });
  it('rejects a missing or extra comma', () => {
    expect(sameSentence(commaSentenceSeed(key), key)).toBe(false);
    expect(sameSentence('Jeg er træt, men jeg, skal på arbejde.', key)).toBe(false);
  });
});

describe('placementFromTyped', () => {
  const derfor = exerciseById('ex-derfor')!;

  it('resolves a multi-word chip typed in one field', () => {
    const r = placementFromTyped(derfor, {
      forfelt: 'Derfor',
      finitVerbum: 'kan',
      subjekt: 'jeg',
      centraladverbial: 'ikke',
      infinitVerbum: 'deltage',
      indholdsadverbial: 'i mødet',
    });
    expect(r.unknown).toEqual([]);
    expect(r.missing).toEqual([]);
    expect(evaluate(derfor, r.placement).correct).toBe(true);
  });

  it('reports words that are not in the exercise, and words not yet typed', () => {
    const r = placementFromTyped(derfor, { forfelt: 'derfor', finitVerbum: 'skal' });
    expect(r.unknown).toEqual(['skal']);
    expect(r.missing.map((t) => t.text)).toContain('kan');
  });

  it('places a word in the wrong field where it was typed, so evaluate can name the error', () => {
    const r = placementFromTyped(derfor, {
      forfelt: 'derfor',
      subjekt: 'jeg',
      finitVerbum: 'kan',
      centraladverbial: 'ikke',
      infinitVerbum: 'deltage',
      indholdsadverbial: 'i mødet',
    });
    expect(evaluate(derfor, r.placement).correct).toBe(true);
    const wrong = placementFromTyped(derfor, {
      forfelt: 'derfor',
      subjekt: 'kan',
      finitVerbum: 'jeg',
      centraladverbial: 'ikke',
      infinitVerbum: 'deltage',
      indholdsadverbial: 'i mødet',
    });
    expect(wrong.unknown).toEqual([]);
    expect(evaluate(derfor, wrong.placement).correct).toBe(false);
  });

  it('keeps order within a field', () => {
    const ex: Exercise = {
      ...derfor,
      id: 'two-objects',
      tokens: [
        { id: 'a', text: 'jeg' },
        { id: 'b', text: 'gav' },
        { id: 'c', text: 'ham' },
        { id: 'd', text: 'en bog', multiword: true },
      ],
      solution: { forfelt: ['a'], finitVerbum: ['b'], objekt: ['c', 'd'] },
      alternatives: [],
    };
    const right = placementFromTyped(ex, { forfelt: 'jeg', finitVerbum: 'gav', objekt: 'ham en bog' });
    expect(right.placement.objekt).toEqual(['c', 'd']);
    const swapped = placementFromTyped(ex, { forfelt: 'jeg', finitVerbum: 'gav', objekt: 'en bog ham' });
    expect(swapped.placement.objekt).toEqual(['d', 'c']);
    expect(evaluate(ex, swapped.placement).correct).toBe(false);
  });

  it('never lets two identical words turn a right answer wrong', () => {
    const ex: Exercise = {
      ...derfor,
      id: 'two-dets',
      tokens: [
        { id: 'd1', text: 'det' },
        { id: 'v', text: 'er' },
        { id: 'd2', text: 'det' },
        { id: 'x', text: 'ikke' },
      ],
      // "Det er det ikke" with the second det fronted in the alternative.
      solution: { forfelt: ['d2'], finitVerbum: ['v'], subjekt: ['d1'], centraladverbial: ['x'] },
      alternatives: [],
    };
    const r = placementFromTyped(ex, {
      forfelt: 'det',
      finitVerbum: 'er',
      subjekt: 'det',
      centraladverbial: 'ikke',
    });
    expect(evaluate(ex, r.placement).correct).toBe(true);
  });

  it('grades the typed answer key — and every accepted alternative — as correct, for every exercise', () => {
    for (const ex of EXERCISES) {
      for (const key of [ex.solution, ...(ex.alternatives ?? [])]) {
        const typed = typedFromPlacement(ex, key);
        const r = placementFromTyped(ex, typed);
        expect(r.unknown, ex.id).toEqual([]);
        expect(r.missing, ex.id).toEqual([]);
        expect(evaluate(ex, r.placement).correct, `${ex.id}: ${JSON.stringify(typed)}`).toBe(true);
      }
    }
  });
});
