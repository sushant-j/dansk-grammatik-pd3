/**
 * Keeps the learner's vocabulary sets and the account in step.
 *
 * Sets are few and small, so a sync is the same as for reading-paper attempts:
 * pull all of this user's rows, fold them in, upload what is queued. Uploads
 * are upserts keyed on the client-made uuid, so retrying is harmless. Sets go
 * up before their words, because a word's row points at its set's row.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { markSetsUploaded, mergeSets, setSetsChangeListener, useVocabSets } from './store';
import type { SetItem, SetSource, VocabSet } from './types';

export interface SetsRemote {
  pull(): Promise<{ sets: VocabSet[]; items: SetItem[] }>;
  push(sets: VocabSet[], items: SetItem[]): Promise<void>;
}

interface SetRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ItemRow {
  id: string;
  set_id: string;
  text: string;
  ref_id: string | null;
  meaning: string | null;
  context: string | null;
  source: SetSource | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const iso = (ms: number) => new Date(ms).toISOString();
const ms = (s: string | null) => (s ? Date.parse(s) : null);

const setToRow = (x: VocabSet): SetRow => ({
  id: x.id,
  name: x.name,
  created_at: iso(x.createdAt),
  updated_at: iso(x.updatedAt),
  deleted_at: x.deletedAt === null ? null : iso(x.deletedAt),
});

const setFromRow = (r: SetRow): VocabSet => ({
  id: r.id,
  name: r.name,
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
  deletedAt: ms(r.deleted_at),
});

const itemToRow = (i: SetItem): ItemRow => ({
  id: i.id,
  set_id: i.setId,
  text: i.text,
  ref_id: i.refId,
  meaning: i.meaning,
  context: i.context,
  source: i.source,
  created_at: iso(i.createdAt),
  updated_at: iso(i.updatedAt),
  deleted_at: i.deletedAt === null ? null : iso(i.deletedAt),
});

const itemFromRow = (r: ItemRow): SetItem => ({
  id: r.id,
  setId: r.set_id,
  text: r.text,
  refId: r.ref_id,
  meaning: r.meaning,
  context: r.context,
  source: r.source,
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
  deletedAt: ms(r.deleted_at),
});

export function supabaseSetsRemote(client: SupabaseClient): SetsRemote {
  return {
    async pull() {
      const [sets, items] = await Promise.all([
        client.from('vocab_sets').select('id, name, created_at, updated_at, deleted_at'),
        client
          .from('vocab_set_items')
          .select('id, set_id, text, ref_id, meaning, context, source, created_at, updated_at, deleted_at'),
      ]);
      if (sets.error) throw new Error(sets.error.message);
      if (items.error) throw new Error(items.error.message);
      return {
        sets: ((sets.data ?? []) as SetRow[]).map(setFromRow),
        items: ((items.data ?? []) as ItemRow[]).map(itemFromRow),
      };
    },
    async push(sets, items) {
      if (sets.length) {
        const { error } = await client.from('vocab_sets').upsert(sets.map(setToRow), { onConflict: 'id' });
        if (error) throw new Error(error.message);
      }
      if (items.length) {
        const { error } = await client.from('vocab_set_items').upsert(items.map(itemToRow), { onConflict: 'id' });
        if (error) throw new Error(error.message);
      }
    },
  };
}

export async function syncSets(r: SetsRemote): Promise<void> {
  const remote = await r.pull();
  mergeSets(remote.sets, remote.items);
  const { setOutbox, itemOutbox, sets, items } = useVocabSets.getState();
  if (!setOutbox.length && !itemOutbox.length) return;
  const batch = { sets: sets.filter((x) => setOutbox.includes(x.id)), items: items.filter((i) => itemOutbox.includes(i.id)) };
  await r.push(batch.sets, batch.items);
  markSetsUploaded(batch);
}

let remote: SetsRemote | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let interval: ReturnType<typeof setInterval> | null = null;

function run(): void {
  // Offline or a server hiccup: the outbox stays queued and the next trigger retries.
  if (remote) syncSets(remote).catch(() => {});
}

export function startSetsSync(r: SetsRemote): void {
  remote = r;
  setSetsChangeListener(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, 1000);
  });
  if (interval) clearInterval(interval);
  interval = setInterval(run, 60_000);
  run();
}

export function stopSetsSync(): void {
  remote = null;
  if (timer) clearTimeout(timer);
  if (interval) clearInterval(interval);
  timer = interval = null;
  setSetsChangeListener(() => {});
}
