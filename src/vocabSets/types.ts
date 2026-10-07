/**
 * The learner's own vocabulary sets: named lists of words and phrases they
 * picked out of a reading text (or typed in) to practise as flashcards.
 */

import type { ExamPart } from '../content/exams/types';

/** Where a word was picked out: which paper and part, and how to name it. */
export interface SetSource {
  paperId: string;
  part: ExamPart;
  /** e.g. "Simuleret prøve 4 · LF2" */
  label: string;
}

export interface VocabSet {
  id: string;
  name: string;
  createdAt: number;
  /** Bumped by every change; the newer copy wins in sync. */
  updatedAt: number;
  /** Set when the set is removed; kept so the removal reaches every device. */
  deletedAt: number | null;
}

export interface SetItem {
  id: string;
  setId: string;
  /** The word or phrase as the learner confirmed it. */
  text: string;
  /** The deck entry it is linked to (`v-…`, `w-…`): the card and its progress are shared. */
  refId: string | null;
  /** The learner's own meaning, for a word that isn't in the deck. */
  meaning: string | null;
  /** The sentence it was picked out of. */
  context: string | null;
  source: SetSource | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}
