import { beforeEach, describe, expect, it } from 'vitest';
import type { ReadingPaper } from '../content/exams/types';
import {
  bestTotal,
  deadline,
  discardDraft,
  draftKey,
  isPaused,
  markAttemptsUploaded,
  markChecked,
  mergeAttempts,
  pauseDraft,
  remainingMs,
  resumeDraft,
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

describe('pausing an exam', () => {
  const MIN = 60_000;
  const draft = () => useAttempts.getState().drafts[draftKey('p', 'lf1')];

  it('pushes the deadline back by the time spent paused', () => {
    startDraft('p', 'lf1', 'exam', 0);
    pauseDraft('p', 'lf1', 5 * MIN);
    resumeDraft('p', 'lf1', 15 * MIN);
    expect(draft().pausedMs).toBe(10 * MIN);
    expect(isPaused(draft())).toBe(false);
    expect(deadline(draft())).toBe(35 * MIN);
    expect(remainingMs(draft(), 15 * MIN)).toBe(20 * MIN);
  });

  it('never runs out while paused, however long the pause', () => {
    startDraft('p', 'lf1', 'exam', 0);
    pauseDraft('p', 'lf1', 20 * MIN);
    expect(isPaused(draft())).toBe(true);
    expect(remainingMs(draft(), 20 * MIN)).toBe(5 * MIN);
    expect(remainingMs(draft(), 1000 * MIN)).toBe(5 * MIN);
    resumeDraft('p', 'lf1', 1000 * MIN);
    expect(remainingMs(draft(), 1000 * MIN)).toBe(5 * MIN);
  });

  it('leaves paused time out of the duration, still capped at the limit', () => {
    startDraft('p', 'lf1', 'exam', 0);
    pauseDraft('p', 'lf1', 5 * MIN);
    resumeDraft('p', 'lf1', 15 * MIN);
    expect(submitDraft(PAPER, 'lf1', 20 * MIN)!.durationMs).toBe(10 * MIN);

    startDraft('p', 'lf1', 'exam', 0);
    pauseDraft('p', 'lf1', 5 * MIN);
    resumeDraft('p', 'lf1', 15 * MIN);
    const late = submitDraft(PAPER, 'lf1', 120 * MIN)!;
    expect(late.durationMs).toBe(25 * MIN);
    expect(late.finishedAt).toBe(35 * MIN);
  });

  it('hands a paused paper in as it stood when the clock stopped', () => {
    startDraft('p', 'lf1', 'exam', 0);
    pauseDraft('p', 'lf1', 3 * MIN);
    resumeDraft('p', 'lf1', 4 * MIN);
    pauseDraft('p', 'lf1', 10 * MIN);
    const a = submitDraft(PAPER, 'lf1', 500 * MIN)!;
    expect(a.durationMs).toBe(9 * MIN);
    expect(a.finishedAt).toBe(10 * MIN);
  });

  it('treats a draft saved before pausing existed as never paused', () => {
    useAttempts.setState({
      drafts: { [draftKey('p', 'lf1')]: { paperId: 'p', part: 'lf1', mode: 'exam', startedAt: 0, answers: {}, checked: [] } },
    });
    expect(isPaused(draft())).toBe(false);
    expect(deadline(draft())).toBe(25 * MIN);
    expect(remainingMs(draft(), 10 * MIN)).toBe(15 * MIN);
    expect(submitDraft(PAPER, 'lf1', 60 * MIN)!.durationMs).toBe(25 * MIN);
  });

  it('does nothing in practice mode', () => {
    startDraft('p', 'lf1', 'practice', 0);
    pauseDraft('p', 'lf1', 5 * MIN);
    expect(isPaused(draft())).toBe(false);
    expect(remainingMs(draft(), 5 * MIN)).toBeNull();
  });

  it('ignores a second pause and a resume without a pause', () => {
    startDraft('p', 'lf1', 'exam', 0);
    resumeDraft('p', 'lf1', 2 * MIN);
    expect(draft().pausedMs ?? 0).toBe(0);
    pauseDraft('p', 'lf1', 5 * MIN);
    pauseDraft('p', 'lf1', 8 * MIN);
    expect(draft().pausedAt).toBe(5 * MIN);
    resumeDraft('p', 'lf1', 10 * MIN);
    resumeDraft('p', 'lf1', 12 * MIN);
    expect(draft().pausedMs).toBe(5 * MIN);
    expect(isPaused(draft())).toBe(false);
  });

  it('cannot be paused once time is up', () => {
    startDraft('p', 'lf1', 'exam', 0);
    pauseDraft('p', 'lf1', 30 * MIN);
    expect(isPaused(draft())).toBe(false);
  });
});

describe('starting over and discarding', () => {
  const MIN = 60_000;
  const drafts = () => useAttempts.getState().drafts;

  it('gives a new attempt a fresh clock, replacing a paused one with answers', () => {
    startDraft('p', 'lf1', 'exam', 0);
    setAnswer('p', 'lf1', 'q1', 'sten');
    pauseDraft('p', 'lf1', 5 * MIN);
    resumeDraft('p', 'lf1', 7 * MIN);
    pauseDraft('p', 'lf1', 10 * MIN);

    startDraft('p', 'lf1', 'exam', 60 * MIN);
    const d = drafts()[draftKey('p', 'lf1')];
    expect(d.startedAt).toBe(60 * MIN);
    expect(d.answers).toEqual({});
    expect(d.checked).toEqual([]);
    expect(d.pausedAt ?? null).toBeNull();
    expect(d.pausedMs ?? 0).toBe(0);
    expect(remainingMs(d, 60 * MIN)).toBe(25 * MIN);
  });

  it('discards only that part, keeping the other part and finished attempts', () => {
    startDraft('p', 'lf1', 'practice', 0);
    submitDraft(PAPER, 'lf1', 10);
    startDraft('p', 'lf1', 'exam', 20);
    startDraft('p', 'lf2', 'practice', 20);
    discardDraft('p', 'lf1');
    expect(drafts()[draftKey('p', 'lf1')]).toBeUndefined();
    expect(drafts()[draftKey('p', 'lf2')]).toBeDefined();
    expect(useAttempts.getState().attempts).toHaveLength(1);
  });

  it('starts from the full time after a discard, not where the old clock was', () => {
    startDraft('p', 'lf1', 'exam', 0);
    expect(remainingMs(drafts()[draftKey('p', 'lf1')], 20 * MIN)).toBe(5 * MIN);
    discardDraft('p', 'lf1');
    startDraft('p', 'lf1', 'exam', 20 * MIN);
    expect(remainingMs(drafts()[draftKey('p', 'lf1')], 20 * MIN)).toBe(25 * MIN);
  });

  it('keeps a discard when the saved copy is loaded again, as on a reload', async () => {
    const me = `u-${Math.random()}`;
    await switchAttemptUser(me);
    startDraft('p', 'lf1', 'exam', 0);
    discardDraft('p', 'lf1');
    await switchAttemptUser(`u-${Math.random()}`);
    await switchAttemptUser(me);
    expect(drafts()[draftKey('p', 'lf1')]).toBeUndefined();
  });

  it('keeps an open attempt, clock and all, when the saved copy is loaded again', async () => {
    const me = `u-${Math.random()}`;
    await switchAttemptUser(me);
    startDraft('p', 'lf1', 'exam', 0);
    await switchAttemptUser(`u-${Math.random()}`);
    await switchAttemptUser(me);
    expect(drafts()[draftKey('p', 'lf1')]?.startedAt).toBe(0);
  });
});
