/**
 * The server, as the sync engine sees it.
 *
 * A narrow interface so sync can be tested against an in-memory fake, and
 * so the Supabase specifics (table names, row shapes, paging syntax) stay in
 * one place. Row-level security on the server means every call here only
 * ever sees or writes the signed-in user's own rows.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Exam } from '../grammar/rules';
import type { Baseline, ProgressEvent } from './types';

export interface ProfileRow {
  targetExam: Exam | null;
  examDate: string | null;
  onboarded: boolean;
}

/** An event plus the server's `created_at`, which pulls page by. */
export interface PulledEvent {
  event: ProgressEvent;
  cursor: string;
}

export interface Remote {
  /** Insert events; ids already on the server are ignored, so retries are safe. */
  pushEvents(events: ProgressEvent[]): Promise<void>;
  /** Events created after `cursor`, oldest first. */
  pullEvents(cursor: string | null, limit: number): Promise<PulledEvent[]>;
  pullBaselines(): Promise<Baseline[]>;
  pushBaselines(baselines: Baseline[]): Promise<void>;
  pullProfile(): Promise<ProfileRow | null>;
  pushProfile(profile: ProfileRow): Promise<void>;
}

// ── Supabase ───────────────────────────────────────────────────────────────

interface EventRow {
  id: string;
  kind: ProgressEvent['kind'];
  domain: string;
  item_id: string | null;
  level: number | null;
  outcomes: Record<string, boolean> | null;
  correct: boolean | null;
  violated: string[] | null;
  at: string;
  created_at?: string;
}

function toRow(e: ProgressEvent): EventRow {
  const base = { id: e.id, kind: e.kind, domain: e.domain, at: new Date(e.at).toISOString() };
  if (e.kind === 'answer') {
    return {
      ...base,
      item_id: e.itemId,
      level: e.level,
      outcomes: e.outcomes,
      correct: e.correct,
      violated: e.violated ?? null,
    };
  }
  if (e.kind === 'set-level') {
    return { ...base, item_id: null, level: e.level, outcomes: null, correct: null, violated: null };
  }
  return { ...base, item_id: null, level: null, outcomes: null, correct: null, violated: null };
}

export function fromRow(r: EventRow): ProgressEvent {
  const at = Date.parse(r.at);
  if (r.kind === 'answer') {
    return {
      kind: 'answer',
      id: r.id,
      at,
      domain: r.domain as never,
      itemId: r.item_id ?? '',
      level: (r.level ?? null) as never,
      outcomes: r.outcomes ?? {},
      correct: !!r.correct,
      ...(r.violated ? { violated: r.violated } : {}),
    };
  }
  if (r.kind === 'set-level') return { kind: 'set-level', id: r.id, at, domain: r.domain as never, level: r.level as never };
  return { kind: 'reset', id: r.id, at, domain: r.domain as never };
}

/**
 * The cursor is "<created_at>|<id>". One upload is one transaction, so a whole
 * batch shares a `created_at`; paging by (created_at, id) rather than time
 * alone means a page boundary inside a batch never skips a row.
 */
export function supabaseRemote(client: SupabaseClient): Remote {
  const check = <T extends { error: { message: string } | null }>(res: T): T => {
    if (res.error) throw new Error(res.error.message);
    return res;
  };

  return {
    async pushEvents(events) {
      if (!events.length) return;
      check(await client.from('events').upsert(events.map(toRow), { onConflict: 'id', ignoreDuplicates: true }));
    },

    async pullEvents(cursor, limit) {
      let q = client
        .from('events')
        .select('id, kind, domain, item_id, level, outcomes, correct, violated, at, created_at')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(limit);
      if (cursor) {
        const [createdAt, id] = cursor.split('|');
        q = q.or(`created_at.gt."${createdAt}",and(created_at.eq."${createdAt}",id.gt.${id})`);
      }
      const { data } = check(await q);
      return ((data ?? []) as EventRow[]).map((r) => ({ event: fromRow(r), cursor: `${r.created_at}|${r.id}` }));
    },

    async pullBaselines() {
      const { data } = check(await client.from('baselines').select('domain, key, stat, as_of'));
      return ((data ?? []) as { domain: string; key: string; stat: unknown; as_of: string }[]).map((b) => ({
        domain: b.domain,
        key: b.key,
        value: b.stat,
        asOf: Date.parse(b.as_of),
      }));
    },

    async pushBaselines(baselines) {
      if (!baselines.length) return;
      check(
        await client.from('baselines').upsert(
          baselines.map((b) => ({ domain: b.domain, key: b.key, stat: b.value, as_of: new Date(b.asOf).toISOString() })),
          { onConflict: 'user_id,domain,key' },
        ),
      );
    },

    async pullProfile() {
      const { data } = check(await client.from('profiles').select('target_exam, exam_date, onboarded').maybeSingle());
      if (!data) return null;
      const row = data as { target_exam: Exam | null; exam_date: string | null; onboarded: boolean };
      return { targetExam: row.target_exam, examDate: row.exam_date, onboarded: row.onboarded };
    },

    async pushProfile(p) {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) throw new Error('not signed in');
      check(
        await client.from('profiles').upsert(
          {
            user_id: auth.user.id,
            target_exam: p.targetExam,
            exam_date: p.examDate,
            onboarded: p.onboarded,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        ),
      );
    },
  };
}
