/**
 * Reading-paper attempts: the one in progress, and the finished ones.
 *
 * An attempt in progress is saved on every keystroke, so closing the tab,
 * reloading, or switching to another app mid-exam loses nothing — and in
 * exam mode the clock keeps running from `startedAt`, as it would in the
 * exam hall. Finished attempts are kept per user and synced to the account
 * (attemptSync.ts); they are not part of the progress log, because a score
 * on a paper is not evidence about any one grammar rule or word.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExamPart, ReadingPaper } from '../content/exams/types';
import { PART_MINUTES } from '../content/exams/types';
import { persistOptions } from '../profile/persistOptions';
import { uuid } from '../sync/log';
import { scorePart, type Answers } from './grade';

export type ExamMode = 'exam' | 'practice';

export interface Draft {
  paperId: string;
  part: ExamPart;
  mode: ExamMode;
  startedAt: number;
  answers: Answers;
  /** Practice mode: items whose answer has been checked (and so is locked). */
  checked: string[];
}

export interface Attempt {
  id: string;
  paperId: string;
  part: ExamPart;
  mode: ExamMode;
  answers: Answers;
  /** LF1 questions the learner marked themselves, overriding the matcher. */
  selfMarks: Record<string, boolean>;
  points: number;
  max: number;
  durationMs: number;
  finishedAt: number;
  /** Bumped by self-marking after the fact; the newer copy wins in sync. */
  updatedAt: number;
}

interface AttemptState {
  userId: string | null;
  drafts: Record<string, Draft>;
  attempts: Attempt[];
  /** Ids of attempts not yet confirmed uploaded (new or changed). */
  outbox: string[];
  hydrated: boolean;
}

const EMPTY: Omit<AttemptState, 'hydrated'> = { userId: null, drafts: {}, attempts: [], outbox: [] };

export const attemptKey = (userId: string | null) => (userId ? `skema-exam-${userId}` : 'skema-exam-signed-out');

export const useAttempts = create<AttemptState>()(
  persist(
    () => ({ ...EMPTY, hydrated: false }),
    persistOptions(attemptKey(null), (s: AttemptState) => ({
      userId: s.userId,
      drafts: s.drafts,
      attempts: s.attempts,
      outbox: s.outbox,
    })),
  ),
);

export const draftKey = (paperId: string, part: ExamPart) => `${paperId}:${part}`;

let onChange: () => void = () => {};
/** attemptSync.ts schedules an upload here. */
export function setAttemptChangeListener(fn: () => void): void {
  onChange = fn;
}

// ── Drafts ──────────────────────────────────────────────────────────────────

export function startDraft(paperId: string, part: ExamPart, mode: ExamMode, now = Date.now()): Draft {
  const draft: Draft = { paperId, part, mode, startedAt: now, answers: {}, checked: [] };
  useAttempts.setState((s) => ({ drafts: { ...s.drafts, [draftKey(paperId, part)]: draft } }));
  return draft;
}

export function discardDraft(paperId: string, part: ExamPart): void {
  useAttempts.setState((s) => {
    const { [draftKey(paperId, part)]: _gone, ...rest } = s.drafts;
    return { drafts: rest };
  });
}

function patchDraft(paperId: string, part: ExamPart, patch: (d: Draft) => Partial<Draft>): void {
  const key = draftKey(paperId, part);
  useAttempts.setState((s) => {
    const d = s.drafts[key];
    return d ? { drafts: { ...s.drafts, [key]: { ...d, ...patch(d) } } } : {};
  });
}

export function setAnswer(paperId: string, part: ExamPart, itemId: string, value: string): void {
  patchDraft(paperId, part, (d) => (d.checked.includes(itemId) ? {} : { answers: { ...d.answers, [itemId]: value } }));
}

export function markChecked(paperId: string, part: ExamPart, itemId: string): void {
  patchDraft(paperId, part, (d) => (d.checked.includes(itemId) ? {} : { checked: [...d.checked, itemId] }));
}

/** When an exam-mode draft runs out of time; null for practice. */
export function deadline(d: Draft): number | null {
  return d.mode === 'exam' ? d.startedAt + PART_MINUTES[d.part] * 60_000 : null;
}

// ── Finishing ───────────────────────────────────────────────────────────────

/** Score the draft, store it as a finished attempt, and clear the draft. */
export function submitDraft(paper: ReadingPaper, part: ExamPart, now = Date.now()): Attempt | null {
  const d = useAttempts.getState().drafts[draftKey(paper.id, part)];
  if (!d) return null;
  const end = Math.min(now, deadline(d) ?? now);
  const score = scorePart(paper, part, d.answers);
  const attempt: Attempt = {
    id: uuid(),
    paperId: paper.id,
    part,
    mode: d.mode,
    answers: d.answers,
    selfMarks: {},
    points: score.points,
    max: score.max,
    durationMs: Math.max(0, end - d.startedAt),
    finishedAt: end,
    updatedAt: end,
  };
  useAttempts.setState((s) => {
    const { [draftKey(paper.id, part)]: _done, ...drafts } = s.drafts;
    return { drafts, attempts: [...s.attempts, attempt], outbox: [...s.outbox, attempt.id] };
  });
  onChange();
  return attempt;
}

/** Overrule the matcher on one LF1 answer (or clear the override with null). */
export function setSelfMark(paper: ReadingPaper, attemptId: string, itemId: string, mark: boolean | null, now = Date.now()): void {
  useAttempts.setState((s) => ({
    attempts: s.attempts.map((a) => {
      if (a.id !== attemptId) return a;
      const selfMarks = { ...a.selfMarks };
      if (mark === null) delete selfMarks[itemId];
      else selfMarks[itemId] = mark;
      const points = scorePart(paper, a.part, a.answers, selfMarks).points;
      return { ...a, selfMarks, points, updatedAt: now };
    }),
    outbox: s.outbox.includes(attemptId) ? s.outbox : [...s.outbox, attemptId],
  }));
  onChange();
}

// ── Reading ─────────────────────────────────────────────────────────────────

export const attemptsFor = (attempts: Attempt[], paperId: string) =>
  attempts.filter((a) => a.paperId === paperId).sort((a, b) => b.finishedAt - a.finishedAt);

/**
 * The paper's best full result: the best LF1 plus the best LF2, if both parts
 * have been done — the way a candidate's two booklets add up to one grade.
 */
export function bestTotal(attempts: Attempt[], paperId: string): { points: number; max: number } | null {
  const mine = attempts.filter((a) => a.paperId === paperId);
  const best = (part: ExamPart) =>
    mine.filter((a) => a.part === part).reduce<Attempt | null>((b, a) => (!b || a.points > b.points ? a : b), null);
  const l1 = best('lf1');
  const l2 = best('lf2');
  return l1 && l2 ? { points: l1.points + l2.points, max: l1.max + l2.max } : null;
}

// ── Sync support ────────────────────────────────────────────────────────────

/** Fold attempts from the server in; on a clash the more recently changed copy wins. */
export function mergeAttempts(remote: Attempt[]): void {
  useAttempts.setState((s) => {
    const byId = new Map(s.attempts.map((a) => [a.id, a]));
    let changed = false;
    for (const r of remote) {
      const mine = byId.get(r.id);
      if (!mine || (r.updatedAt > mine.updatedAt && !s.outbox.includes(r.id))) {
        byId.set(r.id, r);
        changed = true;
      }
    }
    return changed ? { attempts: [...byId.values()] } : {};
  });
}

export function markAttemptsUploaded(ids: string[], uploaded: Attempt[]): void {
  // Only clear an id if the copy uploaded is still the current one: a
  // self-mark made while the upload was in flight must go up again.
  const sent = new Map(uploaded.map((a) => [a.id, a.updatedAt]));
  useAttempts.setState((s) => ({
    outbox: s.outbox.filter((id) => {
      if (!ids.includes(id)) return true;
      const now = s.attempts.find((a) => a.id === id);
      return !!now && now.updatedAt !== sent.get(id);
    }),
  }));
}

/** Point the store at a user's own saved copy, as the progress log does. */
export async function switchAttemptUser(userId: string | null): Promise<void> {
  if (useAttempts.getState().userId === userId && useAttempts.getState().hydrated) return;
  const key = attemptKey(userId);
  useAttempts.persist.setOptions({ name: key });
  if (await AsyncStorage.getItem(key)) {
    await useAttempts.persist.rehydrate();
    useAttempts.setState({ userId, hydrated: true });
  } else {
    useAttempts.setState({ ...EMPTY, userId, hydrated: true });
  }
}
