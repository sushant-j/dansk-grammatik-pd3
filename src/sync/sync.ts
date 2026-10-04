/**
 * Keeps this device's progress log and the server's in step.
 *
 * One sync is: pull new events (paged), pull baselines, import pre-account
 * progress once, then upload the outbox. Every step is safe to repeat — pulls
 * skip known event ids, uploads ignore ids the server already has — so a sync
 * that dies halfway (tab closed, network gone) just runs again later. Practice
 * never waits on it: answers are recorded locally first and uploaded after.
 *
 * Syncs are triggered on sign-in, shortly after an answer, when the app comes
 * back to the foreground or online, and once a minute while open.
 */

import { create } from 'zustand';
import { useSettings } from '../profile/settings';
import { baselinesToUpload, legacyImportedBy, markLegacyImported, readLegacy } from './legacy';
import { markUploaded, mergeRemote, setLocalChangeListener, useLog } from './log';
import type { ProfileRow, Remote } from './remote';

const PAGE = 500;
const UPLOAD_DELAY_MS = 1500;

export type SyncState = 'idle' | 'syncing' | 'offline';

interface SyncStatus {
  state: SyncState;
  lastSyncedAt: number | null;
  error: string | null;
  /** True once this session has loaded the account's profile (or given up offline). */
  profileReady: boolean;
}

export const useSyncStatus = create<SyncStatus>()(() => ({
  state: 'idle',
  lastSyncedAt: null,
  error: null,
  profileReady: false,
}));

let remote: Remote | null = null;
let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let profileDirty = false;

export async function pullAll(r: Remote): Promise<void> {
  for (;;) {
    const page = await r.pullEvents(useLog.getState().cursor, PAGE);
    if (page.length) mergeRemote(page.map((p) => p.event), null, page[page.length - 1].cursor);
    if (page.length < PAGE) break;
  }
  mergeRemote([], await r.pullBaselines(), null);
}

export async function pushOutbox(r: Remote): Promise<void> {
  for (;;) {
    const { outbox, events } = useLog.getState();
    if (!outbox.length) return;
    const ids = new Set(outbox.slice(0, PAGE));
    const batch = events.filter((e) => ids.has(e.id));
    await r.pushEvents(batch);
    markUploaded([...ids]);
  }
}

/** Import this device's pre-account progress into the signed-in account, once per device. */
export async function importLegacyOnce(r: Remote, userId: string): Promise<void> {
  if (await legacyImportedBy()) return;
  const local = await readLegacy();
  if (local.length) {
    const { baselines, events } = useLog.getState();
    const upload = baselinesToUpload(local, { baselines, events });
    if (upload.length) {
      await r.pushBaselines(upload);
      const replaced = new Set(upload.map((b) => `${b.domain}|${b.key}`));
      mergeRemote([], [...baselines.filter((b) => !replaced.has(`${b.domain}|${b.key}`)), ...upload], null);
    }
  }
  await markLegacyImported(userId);
}

async function runOnce(): Promise<void> {
  const r = remote;
  const userId = useLog.getState().userId;
  if (!r || !userId) return;
  useSyncStatus.setState({ state: 'syncing' });
  try {
    await pullAll(r);
    await importLegacyOnce(r, userId);
    await pushOutbox(r);
    if (profileDirty) await pushProfile(r);
    useSyncStatus.setState({ state: 'idle', lastSyncedAt: Date.now(), error: null });
  } catch (err) {
    // Offline or a server hiccup: everything stays queued locally and the next trigger retries.
    useSyncStatus.setState({ state: 'offline', error: err instanceof Error ? err.message : String(err) });
  }
}

/** Run a sync now, or right after the one in flight. */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await runOnce();
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}

export function scheduleSync(delay = UPLOAD_DELAY_MS): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void syncNow();
  }, delay);
}

// ── Profile (exam focus, exam date, onboarding) ────────────────────────────

function localProfile(): ProfileRow {
  const s = useSettings.getState();
  return { targetExam: s.targetExam, examDate: s.examDate, onboarded: s.onboarded };
}

async function pushProfile(r: Remote): Promise<void> {
  await r.pushProfile(localProfile());
  profileDirty = false;
}

/**
 * Load the account's profile into Settings. A brand-new account takes this
 * device's current settings instead, so nobody who was already onboarded has
 * to pick their exam again after creating an account.
 */
export async function loadProfile(r: Remote): Promise<void> {
  try {
    const row = await r.pullProfile();
    if (row) {
      useSettings.setState({ targetExam: row.targetExam, examDate: row.examDate, onboarded: row.onboarded });
    } else {
      await pushProfile(r);
    }
  } catch {
    // Offline: carry on with what this device has, and upload it next time.
    profileDirty = true;
  } finally {
    useSyncStatus.setState({ profileReady: true });
  }
}

let unsubscribeSettings: (() => void) | null = null;

// ── Lifecycle ──────────────────────────────────────────────────────────────

/** Start syncing for the signed-in user. Call after the log has switched to them. */
export async function startSync(r: Remote): Promise<void> {
  remote = r;
  setLocalChangeListener(() => scheduleSync());
  await loadProfile(r);
  // Subscribe after loading, so applying the account's own profile isn't echoed back as a change.
  unsubscribeSettings?.();
  unsubscribeSettings = useSettings.subscribe((s, prev) => {
    if (s.targetExam !== prev.targetExam || s.examDate !== prev.examDate || s.onboarded !== prev.onboarded) {
      profileDirty = true;
      scheduleSync(500);
    }
  });
  await syncNow();
}

export function stopSync(): void {
  remote = null;
  if (timer) clearTimeout(timer);
  timer = null;
  unsubscribeSettings?.();
  unsubscribeSettings = null;
  setLocalChangeListener(() => {});
  useSyncStatus.setState({ state: 'idle', lastSyncedAt: null, error: null, profileReady: false });
}
