/**
 * The signed-in learner's progress log, on this device.
 *
 * Holds every event this device knows about (its own and other devices'),
 * the ids still waiting to be uploaded, and any baselines imported from
 * pre-account progress. It is saved per user (`skema-log-<user id>`), so two
 * people signing in on one browser never see each other's progress.
 *
 * Whenever the log changes, the whole of it is replayed and the result is
 * published into the practice stores — which is why those stores have no
 * persistence of their own: they are views of this log.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Level } from '../content/levels';
import { useActivity } from '../profile/activity';
import { emptyStats as adjectiveEmpty, useAdjectiveProfile } from '../profile/adjectiveStore';
import { emptyStats as commaEmpty, useCommaProfile } from '../profile/commaStore';
import { LEVEL_DOMAINS, resolveLevel, useLevels, type LevelDomain } from '../profile/levelStore';
import { emptyStats as nounEmpty, useNounProfile } from '../profile/nounStore';
import { persistOptions } from '../profile/persistOptions';
import { useSettings } from '../profile/settings';
import { emptyStats as spellingEmpty, useSpellingProfile } from '../profile/spellingStore';
import { emptyStats as grammarEmpty, useProfile, type SessionResult } from '../profile/store';
import { emptyStats as verbEmpty, useVerbProfile } from '../profile/verbStore';
import { useVocabProfile } from '../profile/vocabStore';
import { emptyDrillStats, useDrillProfile } from '../drills/drillStore';
import { DRILL_DOMAIN_KEYS } from '../drills/registry';
import { usePathResults } from '../path/store';
import { setEventSink, type AnswerInput } from './bus';
import { replay } from './replay';
import type { Baseline, Derived, Domain, ProgressEvent } from './types';

const isLevelDomain = (d: string): d is LevelDomain => (LEVEL_DOMAINS as string[]).includes(d);

interface LogState {
  userId: string | null;
  events: ProgressEvent[];
  /** Ids of events not yet confirmed uploaded. */
  outbox: string[];
  baselines: Baseline[];
  /** Server `created_at` of the newest event pulled: the next pull starts here. */
  cursor: string | null;
  hydrated: boolean;
}

const EMPTY: Omit<LogState, 'hydrated'> = { userId: null, events: [], outbox: [], baselines: [], cursor: null };

export const logKey = (userId: string | null) => (userId ? `skema-log-${userId}` : 'skema-log-signed-out');

export const useLog = create<LogState>()(
  persist(
    () => ({ ...EMPTY, hydrated: false }),
    persistOptions(logKey(null), (s: LogState) => ({
      userId: s.userId,
      events: s.events,
      outbox: s.outbox,
      baselines: s.baselines,
      cursor: s.cursor,
    })),
  ),
);

// ── Ids ─────────────────────────────────────────────────────────────────────

/** RFC 4122 v4 uuid. Hermes has no crypto.randomUUID, so it is built from random bytes. */
export function uuid(): string {
  const bytes = new Uint8Array(16);
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ── Publishing the derived state into the practice stores ──────────────────

export function derive(): Derived {
  const { baselines, events } = useLog.getState();
  return replay(baselines, events, useSettings.getState().targetExam);
}

export function publish(): Derived {
  const d = derive();
  useProfile.setState({ stats: { ...grammarEmpty(), ...d.stats.grammar }, seen: d.seen, history: d.history as SessionResult[] });
  useNounProfile.setState({ stats: { ...nounEmpty(), ...d.stats.nouns } });
  useVerbProfile.setState({ stats: { ...verbEmpty(), ...d.stats.verbs } });
  useAdjectiveProfile.setState({ stats: { ...adjectiveEmpty(), ...d.stats.adjectives } });
  useCommaProfile.setState({ stats: { ...commaEmpty(), ...d.stats.comma } });
  useSpellingProfile.setState({ stats: { ...spellingEmpty(), ...d.stats.spelling } });
  useVocabProfile.setState({ stats: d.stats.vocab });
  useDrillProfile.setState({
    stats: { ...emptyDrillStats(), ...Object.fromEntries(DRILL_DOMAIN_KEYS.map((k) => [k, d.stats[k]])) },
  });
  useActivity.setState({ activeDays: d.activeDays });
  useLevels.setState({ domains: d.levels });
  usePathResults.setState({ results: d.path });
  return d;
}

// ── Writing ────────────────────────────────────────────────────────────────

let onLocalChange: () => void = () => {};

/** Called after every local event: sync.ts uses it to schedule an upload. */
export function setLocalChangeListener(fn: () => void): void {
  onLocalChange = fn;
}

function append(event: ProgressEvent): void {
  // Nothing is recorded while signed out: the app is behind the sign-in gate,
  // and an event without an owner could end up in the wrong account.
  if (!useLog.getState().userId) return;
  const before = useLevels.getState().domains;
  const toAdd: ProgressEvent[] = [event];

  // A trainer's starting niveau comes from the exam focus. Write it into the
  // log before the first answer there, so the climb no longer depends on the
  // focus: changing focus later must not move anyone's niveau.
  if (event.kind === 'answer' && event.level !== null && isLevelDomain(event.domain) && !before[event.domain]) {
    const start = resolveLevel(undefined, useSettings.getState().targetExam);
    toAdd.unshift({ kind: 'set-level', domain: event.domain, level: start, id: uuid(), at: event.at - 1 });
  }

  useLog.setState((s) => ({ events: [...s.events, ...toAdd], outbox: [...s.outbox, ...toAdd.map((e) => e.id)] }));
  const after = publish().levels;

  if (event.kind === 'answer') {
    const exam = useSettings.getState().targetExam;
    for (const domain of LEVEL_DOMAINS) {
      const was = resolveLevel(before[domain], exam);
      const now = resolveLevel(after[domain], exam);
      if (domain === event.domain && now > was) useLevels.setState({ justUnlocked: { domain, level: now } });
    }
  }
  onLocalChange();
}

export function recordAnswerEvent(input: AnswerInput, at = Date.now()): void {
  append({ ...input, kind: 'answer', id: uuid(), at });
}

export function recordSetLevelEvent(domain: LevelDomain, level: Level, at = Date.now()): void {
  append({ kind: 'set-level', domain, level, id: uuid(), at });
}

export function recordResetEvent(domain: Domain | 'all', at = Date.now()): void {
  append({ kind: 'reset', domain, id: uuid(), at });
}

setEventSink({ answer: recordAnswerEvent, setLevel: recordSetLevelEvent, reset: recordResetEvent });

/** Fold events and baselines from the server into the log. Known ids are skipped, so this is idempotent. */
export function mergeRemote(events: ProgressEvent[], baselines: Baseline[] | null, cursor: string | null): void {
  useLog.setState((s) => {
    const known = new Set(s.events.map((e) => e.id));
    const fresh = events.filter((e) => !known.has(e.id));
    return {
      events: fresh.length ? [...s.events, ...fresh] : s.events,
      baselines: baselines ?? s.baselines,
      cursor: cursor ?? s.cursor,
    };
  });
  publish();
}

/** Mark events as uploaded. */
export function markUploaded(ids: string[]): void {
  const done = new Set(ids);
  useLog.setState((s) => ({ outbox: s.outbox.filter((id) => !done.has(id)) }));
}

// ── Switching user ─────────────────────────────────────────────────────────

/**
 * Point the log at a user's own saved copy (or at nothing, when signed out)
 * and republish. Each user's log is saved under its own key, so switching
 * never mixes two people's progress, and an unsent outbox survives sign-out.
 */
export async function switchUser(userId: string | null): Promise<void> {
  if (useLog.getState().userId === userId && useLog.getState().hydrated) return;
  const key = logKey(userId);
  useLog.persist.setOptions({ name: key });
  // Every setState is saved under the current name, so the state must not be
  // reset before the new user's saved copy is read — that reset would be
  // written over their log. Load what is saved; start empty only if nothing is.
  if (await AsyncStorage.getItem(key)) {
    await useLog.persist.rehydrate();
    useLog.setState({ userId, hydrated: true });
  } else {
    useLog.setState({ ...EMPTY, userId, hydrated: true });
  }
  useLevels.setState({ justUnlocked: null });
  publish();
}

// The start niveau depends on the target exam, so a change there re-derives.
useSettings.subscribe((s, prev) => {
  if (s.targetExam !== prev.targetExam) publish();
});
