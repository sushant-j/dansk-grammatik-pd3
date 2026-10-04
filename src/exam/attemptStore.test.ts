import { beforeEach, describe, expect, it } from 'vitest';
import type { ReadingPaper } from '../content/exams/types';
import {
  bestTotal,
  draftKey,
  markAttemptsUploaded,
  markChecked,
  mergeAttempts,
  setAnswer,
  setSelfMark,
  startDraft,
  submitDraft,
  switchAttemptUser,
  useAttempts,
} from './attemptStore';

const PAPER: ReadingPaper = {
  id: 'p',
  title: 'P',
  format: 'current',
  source: { kind: 'simulated' },
  lf1Theme: 'T',
  lf2Titles: ['A'],
  gradeTable: [[0, '-3']],
  lf1: {
    theme: 'T',
    sections: [],
    questions: [
      { n: 1, section: 'S', prompt: '?', key: 'sten' },
      { n: 2, section: 'S', prompt: '?', key: 'Ni' },
    ],
  },
  lf2: {
    tasks: [
      { kind: 'mc', label: '2A', title: 'A', passages: [], questions: [{ prompt: '?', options: ['a', 'b', 'c'], correct: 'C' }], points: 2 },
    ],
  },
};

beforeEach(async () => {
  await switchAttemptUser(`u-${Math.random()}`);
});

describe('attempts', () => {
  it('keeps answers in a draft and scores it on submit', () => {
    startDraft('p', 'lf1', 'practice', 1000);
    setAnswer('p', 'lf1', 'q1', 'sten');
    setAnswer('p', 'lf1', 'q2', '8');
    const a = submitDraft(PAPER, 'lf1', 61_000)!;
    expect(a.points).toBe(1);
    expect(a.max).toBe(2);
    expect(a.durationMs).toBe(60_000);
    expect(useAttempts.getState().drafts[draftKey('p', 'lf1')]).toBeUndefined();
    expect(useAttempts.getState().outbox).toEqual([a.id]);
  });

  it('locks a checked practice answer', () => {
    startDraft('p', 'lf1', 'practice');
    setAnswer('p', 'lf1', 'q1', 'sten');
    markChecked('p', 'lf1', 'q1');
    setAnswer('p', 'lf1', 'q1', 'changed');
    expect(useAttempts.getState().drafts[draftKey('p', 'lf1')].answers.q1).toBe('sten');
  });

  it('caps an exam attempt’s time at the deadline', () => {
    startDraft('p', 'lf1', 'exam', 0);
    const a = submitDraft(PAPER, 'lf1', 60 * 60_000)!;
    expect(a.durationMs).toBe(25 * 60_000);
  });

  it('rescores when the learner marks an answer themselves, and requeues it', () => {
    startDraft('p', 'lf1', 'practice', 0);
    setAnswer('p', 'lf1', 'q2', 'otte');
    const a = submitDraft(PAPER, 'lf1', 10)!;
    markAttemptsUploaded([a.id], [a]);
    expect(useAttempts.getState().outbox).toEqual([]);
    setSelfMark(PAPER, a.id, 'q2', true, 20);
    const after = useAttempts.getState().attempts[0];
    expect(after.points).toBe(1);
    expect(after.updatedAt).toBe(20);
    expect(useAttempts.getState().outbox).toEqual([a.id]);
  });

  it('keeps a change made during an upload queued', () => {
    startDraft('p', 'lf1', 'practice', 0);
    const a = submitDraft(PAPER, 'lf1', 10)!;
    const sent = [{ ...a }];
    setSelfMark(PAPER, a.id, 'q1', true, 30);
    markAttemptsUploaded([a.id], sent);
    expect(useAttempts.getState().outbox).toEqual([a.id]);
  });

  it('merges server copies, newest change winning, without clobbering queued local edits', () => {
    startDraft('p', 'lf1', 'practice', 0);
    const a = submitDraft(PAPER, 'lf1', 10)!;
    mergeAttempts([{ ...a, points: 2, updatedAt: 99 }]);
    expect(useAttempts.getState().attempts[0].points).toBe(0); // still queued locally
    markAttemptsUploaded([a.id], [a]);
    mergeAttempts([{ ...a, points: 2, updatedAt: 99 }, { ...a, id: 'other', updatedAt: 5 }]);
    expect(useAttempts.getState().attempts.map((x) => x.points)).toEqual([2, 0]);
  });

  it('adds the best LF1 and best LF2 into a paper total', () => {
    startDraft('p', 'lf1', 'exam', 0);
    setAnswer('p', 'lf1', 'q1', 'sten');
    submitDraft(PAPER, 'lf1', 10);
    expect(bestTotal(useAttempts.getState().attempts, 'p')).toBeNull();
    startDraft('p', 'lf2', 'practice', 0);
    setAnswer('p', 'lf2', '0:1', 'C');
    submitDraft(PAPER, 'lf2', 10);
    expect(bestTotal(useAttempts.getState().attempts, 'p')).toEqual({ points: 3, max: 4 });
  });
});
