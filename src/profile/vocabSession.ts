/**
 * The vocabulary screen's session setup — which word types to drill and how
 * many cards a round lasts. A preference, not progress: it only saves the
 * learner re-picking the same setup every time they open the deck.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VocabCategory } from '../content/vocabulary';
import { persistOptions } from './persistOptions';
import { SESSION_CATEGORIES } from './vocabStore';

/** Cards per round; 'endless' is the open-ended deck the screen used to be. */
export type SessionLength = 10 | 20 | 30 | 'endless';

interface VocabSessionState {
  categories: VocabCategory[];
  length: SessionLength;
  hydrated: boolean;
  setCategories: (categories: VocabCategory[]) => void;
  setLength: (length: SessionLength) => void;
}

export const useVocabSession = create<VocabSessionState>()(
  persist(
    (set) => ({
      categories: SESSION_CATEGORIES,
      length: 20,
      hydrated: false,
      setCategories: (categories) => set({ categories }),
      setLength: (length) => set({ length }),
    }),
    persistOptions('skema-vocab-session-v1', (s: VocabSessionState) => ({
      categories: s.categories,
      length: s.length,
    })),
  ),
);
