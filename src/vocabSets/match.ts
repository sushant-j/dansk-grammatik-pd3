/**
 * Finding a picked-out word in the deck, and the id its progress is kept under.
 *
 * A word the deck already has — in any of its forms, so "bilen" finds "en bil"
 * — is linked to that card: the learner gets its gloss, forms and sentences,
 * and practising it in a set counts toward the same word in the deck. Anything
 * else is the learner's own card, keyed by its text, so the same phrase in two
 * sets is one word to learn, and removing and re-adding it keeps its history.
 */

import { VOCABULARY, type VocabEntry } from '../content/vocabulary';
import type { SetItem } from './types';

/** Longest selection worth a card: past this it is a sentence, not a phrase. */
export const MAX_WORDS = 8;
export const MAX_CHARS = 80;

/** Letters and digits, Danish ones included. */
const EDGE = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/** Trim punctuation and spaces at both ends and collapse inner whitespace: what was meant, as typed. */
export function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').replace(EDGE, '');
}

/** The form two texts are compared in: tidied and lower-case. */
export function normalise(text: string): string {
  return tidy(text).toLocaleLowerCase('da');
}

/** Is this a selection worth a card: something, and short enough to be a word or phrase? */
export function isPickable(text: string): boolean {
  const t = tidy(text);
  return t.length > 0 && t.length <= MAX_CHARS && t.split(' ').length <= MAX_WORDS;
}

let index: Map<string, VocabEntry> | null = null;

/** Every way the deck spells each word, built on first use. The first entry to claim a spelling keeps it. */
function deckIndex(): Map<string, VocabEntry> {
  if (index) return index;
  index = new Map();
  const claim = (key: string, v: VocabEntry) => {
    const k = normalise(key);
    if (k && !index!.has(k)) index!.set(k, v);
  };
  for (const v of VOCABULARY) {
    claim(v.word, v);
    // "en bil", "at gå": the bare word too.
    claim(v.word.replace(/^(en|et|at) /i, ''), v);
    for (const f of v.formList ?? []) claim(f, v);
  }
  return index;
}

/** The deck card for this word or phrase, or null if the deck doesn't have it. */
export function matchDeck(text: string): VocabEntry | null {
  const k = normalise(text);
  if (!k) return null;
  const idx = deckIndex();
  // "at beslutte" or "en bil" typed with the article.
  return idx.get(k) ?? idx.get(k.replace(/^(en|et|at) /, '')) ?? null;
}

/** The id an item's progress is recorded under. */
export function cardIdFor(item: Pick<SetItem, 'refId' | 'text'>): string {
  return item.refId ?? `c:${normalise(item.text)}`;
}

/**
 * Split a sentence around a picked-out phrase, so it can be set in bold:
 * "Skolen har [besluttet at] indføre …". Matched without case and across any
 * run of whitespace; null when the phrase isn't there (e.g. it was edited to
 * a base form), and the sentence is then shown plain.
 */
export function splitAtPhrase(
  sentence: string,
  phrase: string,
): { before: string; match: string; after: string } | null {
  const words = tidy(phrase).split(' ').filter(Boolean);
  if (!words.length) return null;
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  let m: RegExpExecArray | null;
  try {
    m = new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, 'iu').exec(sentence);
  } catch {
    return null;
  }
  if (!m) return null;
  return { before: sentence.slice(0, m.index), match: m[0], after: sentence.slice(m.index + m[0].length) };
}

/** A sentence longer than this is cut down around the word, so the card back stays readable. */
export const MAX_CONTEXT = 280;

/**
 * The sentence of `text` that holds the stretch from `at` to `at + length`:
 * from just after the previous . ! or ? (and any closing quote) to the next
 * one. Null if that is only whitespace.
 */
export function sentenceAt(text: string, at: number, length: number): string | null {
  const end = at + length;
  const ends = [...text.slice(0, at).matchAll(/[.!?]["»”’)]?\s+/g)];
  const last = ends[ends.length - 1];
  const from = last ? last.index! + last[0].length : 0;
  const after = /[.!?]["»”’)]?(?=\s|$)/.exec(text.slice(end));
  const to = after ? end + after.index + after[0].length : text.length;
  let sentence = text.slice(from, to).replace(/\s+/g, ' ').trim();
  if (sentence.length > MAX_CONTEXT) {
    const i = Math.max(0, at - from - MAX_CONTEXT / 2);
    const cut = i + MAX_CONTEXT < sentence.length;
    sentence = `${i > 0 ? '… ' : ''}${sentence.slice(i, i + MAX_CONTEXT).trim()}${cut ? ' …' : ''}`;
  }
  return sentence || null;
}
