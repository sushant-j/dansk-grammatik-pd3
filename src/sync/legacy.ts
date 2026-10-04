/**
 * Carry progress from before accounts existed into the first account that
 * signs in on this device.
 *
 * Before accounts, each trainer saved its stats on the device under
 * `skema-*-v1`. Those saves are snapshots, not logs — the 300-answer grammar
 * history is the only record of individual answers, and it is already counted
 * in the stats — so they become *baselines* that replay starts from, not
 * events to replay.
 *
 * The old saves are read, never deleted. A device-wide marker records that
 * they were imported (and into which account), so a second account on the
 * same device doesn't claim the same progress again.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLevel } from '../content/levels';
import { LEVEL_DOMAINS, type DomainLevel, type LevelDomain } from '../profile/levelStore';
import type { ItemStat } from '../profile/mastery';
import type { Baseline, Domain, ProgressEvent } from './types';

export const MIGRATED_KEY = 'skema-legacy-imported';

export const LEGACY_STAT_KEYS: [Domain, string][] = [
  ['grammar', 'skema-profile-v1'],
  ['nouns', 'skema-nouns-v1'],
  ['verbs', 'skema-verbs-v1'],
  ['adjectives', 'skema-adjectives-v1'],
  ['comma', 'skema-comma-v1'],
  ['spelling', 'skema-spelling-v1'],
  ['vocab', 'skema-vocab-v1'],
];

type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;

async function readState(storage: Storage, key: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await storage.getItem(key);
    if (!raw) return null;
    // zustand's envelope: { state, version } — version 0 (pre-versioning) and 1 share a shape.
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

const isStat = (v: unknown): v is ItemStat =>
  !!v && typeof v === 'object' && typeof (v as ItemStat).attempts === 'number' && (v as ItemStat).attempts > 0;

/** Everything the pre-account saves on this device hold, as baselines. */
export async function readLegacy(storage: Storage = AsyncStorage, now = Date.now()): Promise<Baseline[]> {
  const out: Baseline[] = [];

  for (const [domain, storageKey] of LEGACY_STAT_KEYS) {
    const state = await readState(storage, storageKey);
    const stats = state?.stats;
    if (stats && typeof stats === 'object') {
      for (const [key, stat] of Object.entries(stats)) {
        if (isStat(stat)) out.push({ domain, key, value: stat, asOf: stat.lastSeen || now });
      }
    }
    if (domain === 'grammar' && Array.isArray(state?.seen) && state.seen.length) {
      out.push({ domain: 'grammar-seen', key: 'seen', value: state.seen, asOf: now });
    }
  }

  const activity = await readState(storage, 'skema-activity-v1');
  if (Array.isArray(activity?.activeDays) && activity.activeDays.length) {
    out.push({ domain: 'activity', key: 'days', value: activity.activeDays, asOf: now });
  }

  const levels = await readState(storage, 'skema-levels-v1');
  const domains = (levels?.domains ?? {}) as Partial<Record<LevelDomain, DomainLevel>>;
  for (const d of LEVEL_DOMAINS) {
    if (domains[d] && isLevel(domains[d]!.current)) out.push({ domain: 'levels', key: d, value: domains[d], asOf: now });
  }

  return out;
}

/**
 * Decide which local baselines to upload, given what the account already has.
 *
 * The rule is "the more recent practice wins", per item:
 * - a stat is uploaded only if this device practised that rule or word *after*
 *   the account last did (its latest answer or baseline for that key);
 * - "seen" exercises and active days are unions, so they are merged;
 * - a niveau is uploaded only if the account has no niveau of its own there.
 */
export function baselinesToUpload(local: Baseline[], account: { baselines: Baseline[]; events: ProgressEvent[] }): Baseline[] {
  const latest = new Map<string, number>();
  const bump = (k: string, at: number) => latest.set(k, Math.max(latest.get(k) ?? -Infinity, at));
  for (const b of account.baselines) bump(`${b.domain}|${b.key}`, b.asOf);
  for (const e of account.events) {
    if (e.kind === 'answer') for (const key of Object.keys(e.outcomes)) bump(`${e.domain}|${key}`, e.at);
  }
  const accountLevelDomains = new Set<string>([
    ...account.baselines.filter((b) => b.domain === 'levels').map((b) => b.key),
    ...account.events.filter((e) => e.kind === 'set-level' || (e.kind === 'answer' && e.level !== null)).map((e) => e.domain),
  ]);
  const accountBaseline = (domain: string, key: string) => account.baselines.find((b) => b.domain === domain && b.key === key);

  const upload: Baseline[] = [];
  for (const b of local) {
    if (b.domain === 'grammar-seen' || b.domain === 'activity') {
      const existing = accountBaseline(b.domain, b.key);
      const before = new Set((existing?.value as string[] | undefined) ?? []);
      const merged = [...new Set([...before, ...(b.value as string[])])].sort();
      if (merged.length > before.size) upload.push({ ...b, value: merged });
    } else if (b.domain === 'levels') {
      if (!accountLevelDomains.has(b.key)) upload.push(b);
    } else if (b.asOf > (latest.get(`${b.domain}|${b.key}`) ?? -Infinity)) {
      upload.push(b);
    }
  }
  return upload;
}

export interface LegacyMarker {
  userId: string;
  at: number;
}

export async function legacyImportedBy(storage: Storage = AsyncStorage): Promise<LegacyMarker | null> {
  try {
    const raw = await storage.getItem(MIGRATED_KEY);
    return raw ? (JSON.parse(raw) as LegacyMarker) : null;
  } catch {
    return null;
  }
}

export async function markLegacyImported(userId: string, storage: Storage = AsyncStorage, now = Date.now()): Promise<void> {
  await storage.setItem(MIGRATED_KEY, JSON.stringify({ userId, at: now } satisfies LegacyMarker));
}
