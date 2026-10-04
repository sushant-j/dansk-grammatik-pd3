/**
 * In-memory stand-in for the Supabase-backed Remote, for sync tests.
 *
 * Mirrors the server's real behaviour where it matters: one push is one
 * transaction, so every event in it shares a `created_at`; duplicate ids are
 * ignored; pulls page by (created_at, id) exactly as remote.ts does.
 */

import type { ProfileRow, PulledEvent, Remote } from '../sync/remote';
import type { Baseline, ProgressEvent } from '../sync/types';

export interface FakeRemote extends Remote {
  rows: { event: ProgressEvent; createdAt: string }[];
  baselines: Baseline[];
  profile: ProfileRow | null;
  /** Make the next n calls throw, as if offline. */
  failNext: (n: number) => void;
}

export function fakeRemote(): FakeRemote {
  let clock = Date.parse('2026-01-01T00:00:00Z');
  let failures = 0;
  const maybeFail = () => {
    if (failures > 0) {
      failures--;
      throw new Error('Failed to fetch');
    }
  };
  const cursorOf = (r: { event: ProgressEvent; createdAt: string }) => `${r.createdAt}|${r.event.id}`;

  const remote: FakeRemote = {
    rows: [],
    baselines: [],
    profile: null,
    failNext: (n) => {
      failures = n;
    },

    async pushEvents(events) {
      maybeFail();
      const createdAt = new Date((clock += 1000)).toISOString();
      for (const event of events) {
        if (!remote.rows.some((r) => r.event.id === event.id)) remote.rows.push({ event, createdAt });
      }
    },

    async pullEvents(cursor, limit): Promise<PulledEvent[]> {
      maybeFail();
      const sorted = [...remote.rows].sort((a, b) =>
        a.createdAt === b.createdAt ? (a.event.id < b.event.id ? -1 : 1) : a.createdAt < b.createdAt ? -1 : 1,
      );
      const after = cursor ? sorted.filter((r) => cursorOf(r) > cursor) : sorted;
      return after.slice(0, limit).map((r) => ({ event: r.event, cursor: cursorOf(r) }));
    },

    async pullBaselines() {
      maybeFail();
      return [...remote.baselines];
    },

    async pushBaselines(baselines) {
      maybeFail();
      for (const b of baselines) {
        remote.baselines = remote.baselines.filter((x) => !(x.domain === b.domain && x.key === b.key));
        remote.baselines.push(b);
      }
    },

    async pullProfile() {
      maybeFail();
      return remote.profile;
    },

    async pushProfile(p) {
      maybeFail();
      remote.profile = { ...p };
    },
  };
  return remote;
}
