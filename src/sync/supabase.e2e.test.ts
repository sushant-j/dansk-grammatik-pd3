/**
 * End-to-end checks against the real Supabase project.
 *
 * Skipped unless E2E=1 (`npm run test:e2e`): it needs network access, the
 * project in .env.local, and two throwaway accounts in .e2e-accounts.local.
 * It exercises exactly what the unit tests fake — the table shapes, the
 * paging filter syntax, and above all row-level security.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { supabaseRemote, type Remote } from './remote';
import { rewind } from './sync';
import type { AnswerEvent, ProgressEvent } from './types';

function readEnv(file: string): Record<string, string> {
  const p = path.join(__dirname, '../..', file);
  if (!fs.existsSync(p)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(p, 'utf8')
      .split('\n')
      .filter((l) => l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
  );
}

const env = { ...readEnv('.env.local'), ...readEnv('.e2e-accounts.local') };
const run = !!process.env.E2E && !!env.EXPO_PUBLIC_SUPABASE_URL && !!env.E2E_A_EMAIL;

/** A fresh client is a fresh "device": its own session, nothing shared. */
async function device(who: 'A' | 'B'): Promise<{ client: SupabaseClient; remote: Remote; userId: string }> {
  const client = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = env[`E2E_${who}_EMAIL`];
  const password = env[`E2E_${who}_PASSWORD`];
  const signedIn = await client.auth.signInWithPassword({ email, password });
  let userId = signedIn.data.user?.id;
  if (!userId) {
    const signedUp = await client.auth.signUp({ email, password });
    if (signedUp.error) throw signedUp.error;
    userId = signedUp.data.user?.id;
  }
  if (!userId) throw new Error(`could not sign in ${who}`);
  return { client, remote: supabaseRemote(client), userId };
}

const runId = Date.now().toString(36);
let n = 0;
function answer(over: Partial<AnswerEvent> = {}): AnswerEvent {
  n++;
  const hex = n.toString(16).padStart(12, '0');
  return {
    kind: 'answer',
    id: `${crypto.randomUUID().slice(0, 24)}${hex}`,
    at: Date.now() + n,
    domain: 'nouns',
    itemId: `n-e2e-${runId}`,
    level: 2,
    outcomes: { 'en-et-gender': n % 2 === 0 },
    correct: n % 2 === 0,
    ...over,
  };
}

async function pullEverything(remote: Remote, from: string | null = null): Promise<ProgressEvent[]> {
  const out: ProgressEvent[] = [];
  let cursor = from;
  for (;;) {
    const page = await remote.pullEvents(cursor, 500);
    out.push(...page.map((p) => p.event));
    if (page.length < 500) return out;
    cursor = page[page.length - 1].cursor;
  }
}

describe.skipIf(!run)('against the real Supabase project', () => {
  it('round-trips events exactly, and a repeated upload adds nothing', async () => {
    const a = await device('A');
    const mine = [answer(), answer(), answer({ domain: 'grammar', itemId: 'ex-igaar', violated: ['v2-inversion'] })];
    await a.remote.pushEvents(mine);
    await a.remote.pushEvents(mine); // a retry after a lost response

    const pulled = (await pullEverything(a.remote)).filter((e) => mine.some((m) => m.id === e.id));
    expect(pulled).toHaveLength(3);
    for (const m of mine) expect(pulled.find((e) => e.id === m.id)).toEqual(m);
  });

  it('a second device sees the first one’s events, and the other way round', async () => {
    const a1 = await device('A');
    const a2 = await device('A');
    const fromA1 = answer();
    await a1.remote.pushEvents([fromA1]);
    expect((await pullEverything(a2.remote)).some((e) => e.id === fromA1.id)).toBe(true);

    const fromA2 = answer();
    await a2.remote.pushEvents([fromA2]);
    expect((await pullEverything(a1.remote)).some((e) => e.id === fromA2.id)).toBe(true);
  });

  it('pages through a batch bigger than a page without losing a row', async () => {
    const a = await device('A');
    const batch = Array.from({ length: 620 }, () => answer());
    await a.remote.pushEvents(batch); // one transaction: all 620 share a created_at
    const all = await pullEverything(a.remote);
    const ids = new Set(all.map((e) => e.id));
    expect(batch.every((e) => ids.has(e.id))).toBe(true);
    expect(ids.size).toBe(all.length); // no duplicates across page boundaries
  });

  it('a rewound cursor (the pull overlap) is accepted by the server', async () => {
    const a = await device('A');
    const page = await a.remote.pullEvents(null, 1);
    expect(page.length).toBe(1);
    const again = await a.remote.pullEvents(rewind(page[0].cursor), 5);
    expect(again.length).toBeGreaterThan(0);
  });

  it('saves and loads the profile and baselines', async () => {
    const a = await device('A');
    await a.remote.pushProfile({ targetExam: 'PD3', examDate: '2026-11-20', onboarded: true });
    expect(await a.remote.pullProfile()).toEqual({ targetExam: 'PD3', examDate: '2026-11-20', onboarded: true });

    const stat = { attempts: 4, correct: 3, recent: [true, false, true, true], lastSeen: Date.now(), raw: 0.6 };
    await a.remote.pushBaselines([{ domain: 'nouns', key: 'en-et-gender', value: stat, asOf: stat.lastSeen }]);
    const b = (await a.remote.pullBaselines()).find((x) => x.domain === 'nouns' && x.key === 'en-et-gender');
    expect(b?.value).toEqual(stat);
  });

  it('row-level security: another user sees none of it and can write none of it', async () => {
    const a = await device('A');
    const b = await device('B');
    expect(a.userId).not.toBe(b.userId);

    const aEvents = await pullEverything(a.remote);
    expect(aEvents.length).toBeGreaterThan(0);
    const bEvents = await pullEverything(b.remote);
    expect(bEvents.some((e) => aEvents.some((x) => x.id === e.id))).toBe(false);
    expect((await b.remote.pullBaselines()).length).toBe(0);
    expect(await b.remote.pullProfile()).toBeNull();

    // Writing a row into A's account from B's session is refused.
    const forged = await b.client.from('events').insert({
      id: crypto.randomUUID(),
      user_id: a.userId,
      kind: 'answer',
      domain: 'nouns',
      at: new Date().toISOString(),
    });
    expect(forged.error).not.toBeNull();

    // And events can't be edited or deleted, even by their owner.
    const target = aEvents[0].id;
    await a.client.from('events').update({ correct: false }).eq('id', target);
    await a.client.from('events').delete().eq('id', target);
    expect((await pullEverything(a.remote)).find((e) => e.id === target)).toEqual(aEvents[0]);

    // Signed out, nothing is visible at all.
    const anon = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false },
    });
    const { data } = await anon.from('events').select('id').limit(1);
    expect(data ?? []).toEqual([]);
  });
});
