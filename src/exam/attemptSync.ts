/**
 * Keeps reading-paper attempts and the account in step.
 *
 * Attempts are few (a learner sits a handful of papers), so a sync is simply:
 * pull all of this user's attempts, fold them in, upload what is queued.
 * Uploads are upserts keyed on the client-made uuid, so retrying is harmless.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExamPart } from '../content/exams/types';
import {
  markAttemptsUploaded,
  mergeAttempts,
  setAttemptChangeListener,
  useAttempts,
  type Attempt,
  type ExamMode,
} from './attemptStore';

export interface AttemptRemote {
  pull(): Promise<Attempt[]>;
  push(attempts: Attempt[]): Promise<void>;
}

interface AttemptRow {
  id: string;
  paper_id: string;
  part: ExamPart;
  mode: ExamMode;
  answers: Record<string, string>;
  self_marks: Record<string, boolean>;
  points: number;
  max_points: number;
  duration_ms: number;
  finished_at: string;
  updated_at: string;
}

const toRow = (a: Attempt): AttemptRow => ({
  id: a.id,
  paper_id: a.paperId,
  part: a.part,
  mode: a.mode,
  answers: a.answers,
  self_marks: a.selfMarks,
  points: a.points,
  max_points: a.max,
  duration_ms: a.durationMs,
  finished_at: new Date(a.finishedAt).toISOString(),
  updated_at: new Date(a.updatedAt).toISOString(),
});

const fromRow = (r: AttemptRow): Attempt => ({
  id: r.id,
  paperId: r.paper_id,
  part: r.part,
  mode: r.mode,
  answers: r.answers ?? {},
  selfMarks: r.self_marks ?? {},
  points: r.points,
  max: r.max_points,
  durationMs: r.duration_ms,
  finishedAt: Date.parse(r.finished_at),
  updatedAt: Date.parse(r.updated_at),
});

export function supabaseAttemptRemote(client: SupabaseClient): AttemptRemote {
  return {
    async pull() {
      const { data, error } = await client
        .from('exam_attempts')
        .select('id, paper_id, part, mode, answers, self_marks, points, max_points, duration_ms, finished_at, updated_at');
      if (error) throw new Error(error.message);
      return ((data ?? []) as AttemptRow[]).map(fromRow);
    },
    async push(attempts) {
      if (!attempts.length) return;
      const { error } = await client.from('exam_attempts').upsert(attempts.map(toRow), { onConflict: 'id' });
      if (error) throw new Error(error.message);
    },
  };
}

export async function syncAttempts(r: AttemptRemote): Promise<void> {
  mergeAttempts(await r.pull());
  const { outbox, attempts } = useAttempts.getState();
  if (!outbox.length) return;
  const batch = attempts.filter((a) => outbox.includes(a.id));
  await r.push(batch);
  markAttemptsUploaded(outbox, batch);
}

let remote: AttemptRemote | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let interval: ReturnType<typeof setInterval> | null = null;

function run(): void {
  // Offline or a server hiccup: the outbox stays queued and the next trigger retries.
  if (remote) syncAttempts(remote).catch(() => {});
}

export function startAttemptSync(r: AttemptRemote): void {
  remote = r;
  setAttemptChangeListener(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, 1000);
  });
  if (interval) clearInterval(interval);
  interval = setInterval(run, 60_000);
  run();
}

export function stopAttemptSync(): void {
  remote = null;
  if (timer) clearTimeout(timer);
  if (interval) clearInterval(interval);
  timer = interval = null;
  setAttemptChangeListener(() => {});
}
