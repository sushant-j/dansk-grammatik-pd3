import { describe, expect, it } from 'vitest';
import type { ReadingPaper } from '../content/exams/types';
import { gradeFor, keyAnswers, matchesKey, paperMax, scorePart } from './grade';

describe('censor key notation', () => {
  it('treats parentheses as optional', () => {
    expect(matchesKey('sten', '(Store) sten')).toBe(true);
    expect(matchesKey('Store sten', '(Store) sten')).toBe(true);
    expect(matchesKey('træ', '(Store) sten')).toBe(false);
  });

  it('expands optional parts inside a word', () => {
    expect(matchesKey('sikkerhed', '(Et 3-ugers obligatorisk) sikkerhed(skursus)')).toBe(true);
    expect(matchesKey('et 3-ugers obligatorisk sikkerhedskursus', '(Et 3-ugers obligatorisk) sikkerhed(skursus)')).toBe(true);
    expect(matchesKey('Jobsøgningskurser', 'Jobsøgning(skurser)')).toBe(true);
  });

  it('reads unspaced slashes as phrase alternatives', () => {
    const key = 'Græs/høj bevoksning/trampesti';
    expect(matchesKey('græs', key)).toBe(true);
    expect(matchesKey('høj bevoksning', key)).toBe(true);
    expect(matchesKey('På en trampesti', key)).toBe(true);
    expect(matchesKey('asfalt', key)).toBe(false);
  });

  it('reads slashes between words as word alternatives', () => {
    const key = '(At/Hvis) du/man ikke (i forvejen) får elevløn';
    expect(matchesKey('hvis man ikke får elevløn', key)).toBe(true);
    expect(matchesKey('At du ikke i forvejen får elevløn', key)).toBe(true);
    expect(matchesKey('man får elevløn', key)).toBe(false);
  });

  it('splits only on spaced slashes when the key uses them', () => {
    const key = '4 år / 2 år på skolen efterfulgt af 2 års praktik';
    expect(matchesKey('4 år', key)).toBe(true);
    expect(matchesKey('fire år', key)).toBe(true);
    expect(matchesKey('2 år på skolen efterfulgt af 2 års praktik', key)).toBe(true);
  });

  it('matches numbers written as words or digits', () => {
    expect(matchesKey('9', 'Ni')).toBe(true);
    expect(matchesKey('ni måneder', '(I ca.) ni måneder')).toBe(true);
    expect(matchesKey('i ca. 9 måneder', '(I ca.) ni måneder')).toBe(true);
  });

  it('matches dates with or without the optional year', () => {
    expect(matchesKey('15. juni', '15. juni (1920)')).toBe(true);
    expect(matchesKey('15. juni 1920', '15. juni (1920)')).toBe(true);
    expect(matchesKey('16. juni', '15. juni (1920)')).toBe(false);
  });

  it('accepts a few words around the answer but not a long answer that merely contains it', () => {
    expect(matchesKey('De er krydrede', '(De er) krydrede')).toBe(true);
    expect(matchesKey('pølserne er meget krydrede', '(De er) krydrede')).toBe(true);
    expect(
      matchesKey('de laves af svinekød fra lokale landmænd og er ikke særlig krydrede men grove', '(De er) krydrede'),
    ).toBe(false);
  });

  it('accepts extra answers listed in `also`', () => {
    expect(matchesKey('billig husleje', 'Huslejen er billig', ['billig husleje'])).toBe(true);
  });

  it('never yields an empty answer from an all-optional key', () => {
    expect(keyAnswers('(Ja)')).toEqual(['ja']);
    expect(matchesKey('', '(Ja)')).toBe(false);
  });
});

const PAPER: ReadingPaper = {
  id: 'test',
  title: 'Test',
  format: 'current',
  source: { kind: 'simulated' },
  lf1Theme: 'Tema',
  lf2Titles: ['A', 'B', 'C'],
  gradeTable: [[38, '12'], [33, '10'], [27, '7'], [22, '4'], [20, '02'], [10, '00'], [0, '-3']],
  lf1: {
    theme: 'Tema',
    sections: [],
    questions: [
      { n: 1, section: 'S', prompt: '?', key: '(Store) sten' },
      { n: 2, section: 'S', prompt: '?', key: 'Ni' },
    ],
  },
  lf2: {
    tasks: [
      {
        kind: 'mc',
        label: '2A',
        title: 'A',
        passages: [],
        questions: [{ prompt: '?', options: ['a', 'b', 'c'], correct: 'B' }],
        points: 2,
      },
      { kind: 'insert', label: '2B', title: 'B', passage: { title: '', blocks: [] }, inserts: [], correct: ['C', 'A'], points: 2 },
      {
        kind: 'cloze',
        label: '3',
        title: 'C',
        passage: { title: '', blocks: [] },
        gaps: [{ options: ['w', 'x', 'y', 'z'], correct: 'D' }],
        points: 1,
      },
    ],
  },
};

describe('scoring', () => {
  it('scores LF1 with the matcher and lets self-marks override it', () => {
    const auto = scorePart(PAPER, 'lf1', { q1: 'sten', q2: 'otte' });
    expect(auto.points).toBe(1);
    expect(auto.max).toBe(2);

    const marked = scorePart(PAPER, 'lf1', { q1: 'sten', q2: 'otte' }, { q2: true });
    expect(marked.points).toBe(2);
    expect(marked.items[1].selfMarked).toBe(true);
  });

  it('scores LF2 per task with each task’s points', () => {
    const s = scorePart(PAPER, 'lf2', { '0:1': 'B', '1:1': 'C', '1:2': 'B', '2:1': 'D' });
    expect(s.byTask.map((t) => [t.points, t.max])).toEqual([[2, 2], [2, 4], [1, 1]]);
    expect(s.points).toBe(5);
    expect(paperMax(PAPER)).toBe(9);
  });

  it('converts points to grades at the table boundaries', () => {
    expect(gradeFor(PAPER.gradeTable, 39)).toBe('12');
    expect(gradeFor(PAPER.gradeTable, 38)).toBe('12');
    expect(gradeFor(PAPER.gradeTable, 37)).toBe('10');
    expect(gradeFor(PAPER.gradeTable, 20)).toBe('02');
    expect(gradeFor(PAPER.gradeTable, 19)).toBe('00');
    expect(gradeFor(PAPER.gradeTable, 0)).toBe('-3');
  });
});

describe('matcher details', () => {
  it('expands `also` in the same notation as the key', () => {
    expect(matchesKey('særligt indtjekningssted', 'X', ['(Man kan tjekke ind ved et) særligt indtjekningssted (ved området)'])).toBe(true);
  });

  it('accepts a two-part answer joined by "og"', () => {
    expect(matchesKey('cykelparkering og cykeltjek', 'Cykelparkering (og) cykeltjek')).toBe(true);
    expect(matchesKey('cykelparkering og cykeltjek', 'Cykelparkering, cykeltjek')).toBe(true);
  });
});

describe('forcensur rulings', () => {
  it('accepts a cloze letter the forcensur also allows', () => {
    const p = structuredClone(PAPER);
    const cloze = p.lf2.tasks[2];
    if (cloze.kind === 'cloze') cloze.gaps[0].alsoCorrect = ['C'];
    expect(scorePart(p, 'lf2', { '2:1': 'C' }).byTask[2].points).toBe(1);
    expect(scorePart(p, 'lf2', { '2:1': 'B' }).byTask[2].points).toBe(0);
  });
});

describe('units', () => {
  it('reads "km/t" in an answer against a key with an optional unit part', () => {
    expect(matchesKey('10 km/t', '10 km(/t)')).toBe(true);
    expect(matchesKey('10 km', '10 km(/t)')).toBe(true);
  });
});
