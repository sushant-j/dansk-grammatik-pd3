/**
 * Set words as flashcards: the same `VocabEntry` shape the deck uses, so the
 * trainer, its scheduling and its card back need no second version.
 */

import { vocabById, type VocabEntry } from '../content/vocabulary';
import { EMPTY_STAT, progressFor, type ItemStat } from '../profile/mastery';
import { cardIdFor } from './match';
import type { SetItem, SetSource } from './types';

/** A flashcard made from a set word: the deck card it links to, or the learner's own. */
export interface SetCard extends VocabEntry {
  /** The sentence it was picked out of, and where — shown on the back as "From your text". */
  fromText?: { sentence: string; form: string; source: SetSource | null };
  /** True for the learner's own card (not in the deck). */
  own?: boolean;
}

export function toCard(item: SetItem): SetCard {
  const fromText = item.context ? { sentence: item.context, form: item.text, source: item.source } : undefined;
  const deck = item.refId ? vocabById(item.refId) : undefined;
  if (deck) return { ...deck, fromText };
  return {
    id: cardIdFor({ refId: null, text: item.text }),
    word: item.text,
    category: 'phrase',
    glossEn: item.meaning ?? '',
    // Not on any niveau: practising your own words never moves the vocab level.
    level: 1,
    fromText,
    own: true,
  };
}

/**
 * The cards for these items, one per word: the same word in two sets (or a
 * deck word added twice) is one card. The first item with a sentence wins.
 */
export function cardsFor(items: SetItem[]): SetCard[] {
  const byId = new Map<string, SetCard>();
  for (const item of items) {
    const card = toCard(item);
    const had = byId.get(card.id);
    if (!had) byId.set(card.id, card);
    else if (!had.fromText && card.fromText) byId.set(card.id, { ...had, fromText: card.fromText });
    else if (had.own && !had.glossEn && card.glossEn) byId.set(card.id, { ...had, glossEn: card.glossEn });
  }
  return [...byId.values()];
}

/** How far along a set is: its words, and how many of them are solid or better. */
export function setProgress(items: SetItem[], stats: Record<string, ItemStat>, now = Date.now()): { words: number; solid: number } {
  const cards = cardsFor(items);
  const solid = cards.filter((c) => {
    const lvl = progressFor(c.id, stats[c.id] ?? EMPTY_STAT, now).level;
    return lvl === 'solid' || lvl === 'mastered';
  }).length;
  return { words: cards.length, solid };
}
