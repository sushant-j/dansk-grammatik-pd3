/**
 * The learner's vocabulary sets, kept per user and synced to the account
 * (sync.ts) the way reading-paper attempts are: every change bumps
 * `updatedAt` and queues the row, and on a clash the newer copy wins.
 *
 * Nothing is ever really deleted. Removing a set or a word marks it
 * `deletedAt`, so the removal travels to the learner's other devices instead
 * of the row coming back from whichever of them still has it.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistOptions } from '../profile/persistOptions';
import { uuid } from '../sync/log';
import { normalise, tidy } from './match';
import type { SetItem, SetSource, VocabSet } from './types';

interface SetsState {
  userId: string | null;
  sets: VocabSet[];
  items: SetItem[];
  /** Ids of sets and items not yet confirmed uploaded (new or changed). */
  setOutbox: string[];
  itemOutbox: string[];
  /** The set the learner last added to, offered first next time. Not synced. */
  lastSetId: string | null;
  hydrated: boolean;
}

const EMPTY: Omit<SetsState, 'hydrated'> = {
  userId: null,
  sets: [],
  items: [],
  setOutbox: [],
  itemOutbox: [],
  lastSetId: null,
};

export const setsKey = (userId: string | null) => (userId ? `skema-sets-${userId}` : 'skema-sets-signed-out');

export const useVocabSets = create<SetsState>()(
  persist(
    () => ({ ...EMPTY, hydrated: false }),
    persistOptions(setsKey(null), (s: SetsState) => ({
      userId: s.userId,
      sets: s.sets,
      items: s.items,
      setOutbox: s.setOutbox,
      itemOutbox: s.itemOutbox,
      lastSetId: s.lastSetId,
    })),
  ),
);

let onChange: () => void = () => {};
/** sync.ts schedules an upload here. */
export function setSetsChangeListener(fn: () => void): void {
  onChange = fn;
}

const queue = (outbox: string[], ids: string[]) => [...new Set([...outbox, ...ids])];

// ── Reading ─────────────────────────────────────────────────────────────────

/** Sets still in use, newest first. */
export function liveSets(sets: VocabSet[]): VocabSet[] {
  return sets.filter((x) => x.deletedAt === null).sort((a, b) => b.createdAt - a.createdAt);
}

/** The words in a set, oldest first: the order they were added. */
export function itemsInSet(items: SetItem[], setId: string): SetItem[] {
  return items.filter((i) => i.setId === setId && i.deletedAt === null).sort((a, b) => a.createdAt - b.createdAt);
}

/** The set already holding this word or phrase, compared without case or edge punctuation. */
export function findInSet(items: SetItem[], setId: string, text: string, exceptId?: string): SetItem | null {
  const k = normalise(text);
  return itemsInSet(items, setId).find((i) => i.id !== exceptId && normalise(i.text) === k) ?? null;
}

// ── Sets ────────────────────────────────────────────────────────────────────

export function createSet(name: string, now = Date.now()): VocabSet {
  const set: VocabSet = { id: uuid(), name: name.trim() || 'My words', createdAt: now, updatedAt: now, deletedAt: null };
  useVocabSets.setState((s) => ({ sets: [...s.sets, set], setOutbox: queue(s.setOutbox, [set.id]) }));
  onChange();
  return set;
}

export function renameSet(id: string, name: string, now = Date.now()): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  useVocabSets.setState((s) => ({
    sets: s.sets.map((x) => (x.id === id ? { ...x, name: trimmed, updatedAt: now } : x)),
    setOutbox: queue(s.setOutbox, [id]),
  }));
  onChange();
}

/** Remove a set and every word in it. */
export function deleteSet(id: string, now = Date.now()): void {
  useVocabSets.setState((s) => {
    const gone = s.items.filter((i) => i.setId === id && i.deletedAt === null).map((i) => i.id);
    return {
      sets: s.sets.map((x) => (x.id === id ? { ...x, deletedAt: now, updatedAt: now } : x)),
      items: s.items.map((i) => (gone.includes(i.id) ? { ...i, deletedAt: now, updatedAt: now } : i)),
      setOutbox: queue(s.setOutbox, [id]),
      itemOutbox: queue(s.itemOutbox, gone),
      lastSetId: s.lastSetId === id ? null : s.lastSetId,
    };
  });
  onChange();
}

// ── Items ───────────────────────────────────────────────────────────────────

export interface NewItem {
  setId: string;
  text: string;
  refId?: string | null;
  meaning?: string | null;
  context?: string | null;
  source?: SetSource | null;
}

const blankToNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

/** Add a word to a set. Null if the text is empty or the set already has it. */
export function addItem(input: NewItem, now = Date.now()): SetItem | null {
  const text = tidy(input.text);
  const state = useVocabSets.getState();
  if (!text || findInSet(state.items, input.setId, text)) return null;
  const item: SetItem = {
    id: uuid(),
    setId: input.setId,
    text,
    refId: input.refId ?? null,
    meaning: blankToNull(input.meaning),
    context: blankToNull(input.context),
    source: input.source ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  useVocabSets.setState((s) => ({
    items: [...s.items, item],
    itemOutbox: queue(s.itemOutbox, [item.id]),
    // Adding to a set bumps it, so the set list shows recent activity on every device.
    sets: s.sets.map((x) => (x.id === item.setId ? { ...x, updatedAt: now } : x)),
    setOutbox: queue(s.setOutbox, [item.setId]),
    lastSetId: item.setId,
  }));
  onChange();
  return item;
}

export function updateItem(
  id: string,
  patch: Partial<Pick<SetItem, 'text' | 'refId' | 'meaning'>>,
  now = Date.now(),
): void {
  useVocabSets.setState((s) => ({
    items: s.items.map((i) =>
      i.id === id
        ? {
            ...i,
            ...(patch.text !== undefined && tidy(patch.text) ? { text: tidy(patch.text) } : {}),
            ...(patch.refId !== undefined ? { refId: patch.refId } : {}),
            ...(patch.meaning !== undefined ? { meaning: blankToNull(patch.meaning) } : {}),
            updatedAt: now,
          }
        : i,
    ),
    itemOutbox: queue(s.itemOutbox, [id]),
  }));
  onChange();
}

export function removeItem(id: string, now = Date.now()): void {
  useVocabSets.setState((s) => ({
    items: s.items.map((i) => (i.id === id ? { ...i, deletedAt: now, updatedAt: now } : i)),
    itemOutbox: queue(s.itemOutbox, [id]),
  }));
  onChange();
}

/** Undo a removal. */
export function restoreItem(id: string, now = Date.now()): void {
  useVocabSets.setState((s) => ({
    items: s.items.map((i) => (i.id === id ? { ...i, deletedAt: null, updatedAt: now } : i)),
    itemOutbox: queue(s.itemOutbox, [id]),
  }));
  onChange();
}

// ── Sync support ────────────────────────────────────────────────────────────

function mergeRows<T extends { id: string; updatedAt: number }>(mine: T[], remote: T[], outbox: string[]): T[] | null {
  const byId = new Map(mine.map((x) => [x.id, x]));
  let changed = false;
  for (const r of remote) {
    const m = byId.get(r.id);
    // A row changed here and not yet uploaded stays as it is: it is the newer copy.
    if (!m || (r.updatedAt > m.updatedAt && !outbox.includes(r.id))) {
      byId.set(r.id, r);
      changed = true;
    }
  }
  return changed ? [...byId.values()] : null;
}

/** Fold sets and words from the server in; on a clash the more recently changed copy wins. */
export function mergeSets(remoteSets: VocabSet[], remoteItems: SetItem[]): void {
  useVocabSets.setState((s) => {
    const sets = mergeRows(s.sets, remoteSets, s.setOutbox);
    const items = mergeRows(s.items, remoteItems, s.itemOutbox);
    return { ...(sets ? { sets } : {}), ...(items ? { items } : {}) };
  });
}

/** Clear uploaded rows from the outboxes, unless they changed again while the upload was in flight. */
export function markSetsUploaded(sent: { sets: VocabSet[]; items: SetItem[] }): void {
  const at = new Map<string, number>([...sent.sets, ...sent.items].map((x) => [x.id, x.updatedAt]));
  useVocabSets.setState((s) => {
    const stillDirty = (rows: { id: string; updatedAt: number }[]) => (id: string) => {
      if (!at.has(id)) return true;
      return rows.find((x) => x.id === id)?.updatedAt !== at.get(id);
    };
    return {
      setOutbox: s.setOutbox.filter(stillDirty(s.sets)),
      itemOutbox: s.itemOutbox.filter(stillDirty(s.items)),
    };
  });
}

/** Point the store at a user's own saved copy, as the progress log does. */
export async function switchSetsUser(userId: string | null): Promise<void> {
  if (useVocabSets.getState().userId === userId && useVocabSets.getState().hydrated) return;
  const key = setsKey(userId);
  useVocabSets.persist.setOptions({ name: key });
  if (await AsyncStorage.getItem(key)) {
    await useVocabSets.persist.rehydrate();
    useVocabSets.setState({ userId, hydrated: true });
  } else {
    useVocabSets.setState({ ...EMPTY, userId, hydrated: true });
  }
}
