/**
 * Where reading papers come from.
 *
 * Simulated papers ship with the app. Official papers are fetched from
 * Supabase, where only signed-in users can read them (they are transcribed
 * official texts, so they stay out of the public repo and the static bundle).
 * A fetched paper is cached on the device and only fetched again when the
 * server copy changes, so a paper you have opened once also works offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../auth/supabase';
import { SIMULATED_PAPERS } from '../content/exams/simulated';
import type { PaperMeta, ReadingPaper } from '../content/exams/types';

export interface IndexedPaper extends PaperMeta {
  /** Server version; absent for bundled papers. */
  updatedAt?: string;
}

const INDEX_KEY = 'skema-exam-index-v1';
const paperKey = (id: string) => `skema-exam-paper-v1-${id}`;

function metaOf(p: ReadingPaper): PaperMeta {
  const { lf1: _lf1, lf2: _lf2, ...meta } = p;
  return meta;
}

const SIMULATED_INDEX: IndexedPaper[] = SIMULATED_PAPERS.map(metaOf);

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A full or unavailable cache only costs a refetch next time.
  }
}

async function fetchOfficialIndex(): Promise<IndexedPaper[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('exam_papers').select('id, meta, updated_at');
  if (error) throw new Error(error.message);
  const list = ((data ?? []) as { id: string; meta: PaperMeta; updated_at: string }[]).map((r) => ({
    ...r.meta,
    id: r.id,
    updatedAt: r.updated_at,
  }));
  await writeJson(INDEX_KEY, list);
  return list;
}

export type LoadState = 'loading' | 'ready' | 'offline';

/** Simulated papers plus every official paper the account can read (cached copy when offline). */
export function usePaperIndex(): { papers: IndexedPaper[]; state: LoadState; retry: () => void } {
  const [official, setOfficial] = useState<IndexedPaper[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    void (async () => {
      setState('loading');
      const cached = await readJson<IndexedPaper[]>(INDEX_KEY);
      if (cached && live) setOfficial(cached);
      try {
        const fresh = await fetchOfficialIndex();
        if (live) {
          setOfficial(fresh);
          setState('ready');
        }
      } catch {
        if (live) setState(cached ? 'ready' : 'offline');
      }
    })();
    return () => {
      live = false;
    };
  }, [attempt]);

  return { papers: [...SIMULATED_INDEX, ...official], state, retry: useCallback(() => setAttempt((n) => n + 1), []) };
}

export async function loadPaper(id: string): Promise<ReadingPaper> {
  const bundled = SIMULATED_PAPERS.find((p) => p.id === id);
  if (bundled) return bundled;

  const cached = await readJson<{ updatedAt: string; paper: ReadingPaper }>(paperKey(id));
  const index = await readJson<IndexedPaper[]>(INDEX_KEY);
  const current = index?.find((p) => p.id === id)?.updatedAt;
  if (cached && (!current || cached.updatedAt === current)) return cached.paper;

  if (!supabase) throw new Error('Accounts aren’t set up for this copy of the app.');
  try {
    const { data, error } = await supabase.from('exam_papers').select('content, updated_at').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('This paper isn’t available.');
    const row = data as { content: ReadingPaper; updated_at: string };
    await writeJson(paperKey(id), { updatedAt: row.updated_at, paper: row.content });
    return row.content;
  } catch (err) {
    // An older cached copy beats nothing when the network is down.
    if (cached) return cached.paper;
    throw err;
  }
}

export function usePaper(id: string | undefined): { paper: ReadingPaper | null; error: string | null; retry: () => void } {
  const [paper, setPaper] = useState<ReadingPaper | null>(() => SIMULATED_PAPERS.find((p) => p.id === id) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    let live = true;
    setError(null);
    loadPaper(id)
      .then((p) => live && setPaper(p))
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [id, attempt]);

  return { paper: paper?.id === id ? paper : null, error, retry: useCallback(() => setAttempt((n) => n + 1), []) };
}
