/**
 * Grading for typed answers.
 *
 * Every grammar exercise is answered by typing: a word into a gap, a sentence
 * with its commas put back, or the words of a sentence into the fields of the
 * sætningsskema. The question builders and the schema evaluator still speak
 * in options and token ids, so this module turns what was typed back into
 * those — an option index, a Placement — and nothing downstream changes.
 *
 * Normalisation is deliberately narrow. Case and spacing are forgiven; æ, ø
 * and å are not folded, and nothing is spell-corrected, because the spelling
 * is usually the very thing being tested. This is not the exam's
 * `normalizeAnswer`, which strips punctuation and maps number words — right
 * for reading-comprehension answers, wrong for a comma exercise.
 */

import { fieldsFor, type FieldId } from './fields';
import type { Exercise, Placement, Token } from './types';

/** Case, Unicode composition and spacing forgiven; one trailing full stop, ! or ? dropped. */
export function normalizeTyped(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*[.!?]$/, '')
    .trim();
}

/**
 * Index of the option the learner typed, or -1 when it is none of them.
 *
 * Words every option ends with ("sig" in "glædede sig" / "glædte sig", "på"
 * in "stolede på" / "stolte på") can't be what the question tests, so the
 * learner may leave them off: "glædede" counts as "glædede sig".
 */
export function matchOption(typed: string, options: string[]): number {
  const n = normalizeTyped(typed);
  if (!n) return -1;
  const norm = options.map(normalizeTyped);
  const exact = norm.indexOf(n);
  if (exact >= 0) return exact;
  const tail = sharedTail(norm);
  return tail ? norm.indexOf(`${n} ${tail}`) : -1;
}

/** The trailing words all options share, provided none of them is only that. */
function sharedTail(options: string[]): string {
  if (options.length < 2) return '';
  const split = options.map((o) => o.split(' '));
  const tail: string[] = [];
  for (let k = 1; ; k++) {
    const w = split[0][split[0].length - k];
    if (w === undefined || split.some((ws) => ws.length <= k || ws[ws.length - k] !== w)) break;
    tail.unshift(w);
  }
  return tail.join(' ');
}

/**
 * A sentence typed with its commas put back, compared with the key. Commas
 * are the point, so they must match exactly; spacing around them is not.
 */
export function sameSentence(typed: string, key: string): boolean {
  const tidy = (s: string) => normalizeTyped(s.replace(/\s*,\s*/g, ', '));
  return tidy(typed) === tidy(key);
}

/** The starting text for a comma question: the sentence with every comma taken out. */
export function commaSentenceSeed(sentence: string): string {
  return sentence.replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

// --- Schema board -----------------------------------------------------------

/** What the learner has typed into each field of the schema. */
export type TypedFields = Partial<Record<FieldId, string>>;

export interface TypedPlacement {
  /** The typed text resolved to tokens, ready for `evaluate()`. */
  placement: Placement;
  /** Typed words that are not (or no longer) one of the exercise's words. */
  unknown: string[];
  /** Exercise tokens not typed anywhere yet, in presentation order. */
  missing: Token[];
}

/** One typed or token word, compared without case or stray punctuation. */
function wordKey(w: string): string {
  return w.normalize('NFC').toLowerCase().replace(/^[.,;:!?"'«»()]+|[.,;:!?"'«»()]+$/g, '');
}

function words(s: string): string[] {
  return s.split(/\s+/).map(wordKey).filter(Boolean);
}

function fieldOf(p: Placement, tokenId: string): FieldId | undefined {
  for (const [f, ids] of Object.entries(p)) {
    if (ids?.includes(tokenId)) return f as FieldId;
  }
  return undefined;
}

interface FieldParse {
  ids: string[];
  unknown: string[];
  /** Tokens put where the preferred answer has them — the tiebreak between parses. */
  agree: number;
}

/**
 * Split one field's words into tokens. Several splits can fit ("en bog" is
 * one chip or two words; two chips can both read "det"), so this searches
 * them all and keeps the best: fewest unknown words, then most tokens where
 * the preferred answer puts them. A word that fits no token is skipped and
 * reported as unknown.
 */
function parseField(
  typed: string[],
  field: FieldId,
  available: Token[],
  prefer: Placement,
): FieldParse {
  const tokenWords = new Map(available.map((t) => [t.id, words(t.text)]));
  let best: FieldParse | null = null;

  const better = (a: FieldParse, b: FieldParse | null) =>
    !b ||
    a.unknown.length < b.unknown.length ||
    (a.unknown.length === b.unknown.length && a.agree > b.agree);

  const walk = (i: number, used: Set<string>, acc: FieldParse) => {
    if (i === typed.length) {
      if (better(acc, best)) best = { ids: [...acc.ids], unknown: [...acc.unknown], agree: acc.agree };
      return;
    }
    // Prune: this branch already has more unknowns than the best full parse.
    if (best && acc.unknown.length > best.unknown.length) return;

    let matched = false;
    const seenText = new Set<string>();
    for (const tok of available) {
      if (used.has(tok.id)) continue;
      const tw = tokenWords.get(tok.id)!;
      if (!tw.length || tw.some((w, k) => typed[i + k] !== w)) continue;
      // Two unused tokens with the same text are interchangeable except for
      // where the answer wants them; try each such text once per placement.
      const agrees = fieldOf(prefer, tok.id) === field;
      const key = `${tw.join(' ')}|${agrees}`;
      if (seenText.has(key)) continue;
      seenText.add(key);
      matched = true;
      used.add(tok.id);
      acc.ids.push(tok.id);
      walk(i + tw.length, used, { ...acc, agree: acc.agree + (agrees ? 1 : 0) });
      acc.ids.pop();
      used.delete(tok.id);
    }
    if (!matched) {
      acc.unknown.push(typed[i]);
      walk(i + 1, used, acc);
      acc.unknown.pop();
    }
  };

  walk(0, new Set(), { ids: [], unknown: [], agree: 0 });
  return best ?? { ids: [], unknown: [...typed], agree: 0 };
}

function resolve(ex: Exercise, typed: TypedFields, prefer: Placement): TypedPlacement {
  const placement: Placement = {};
  const unknown: string[] = [];
  const used = new Set<string>();

  for (const f of fieldsFor(ex.clause)) {
    const w = words(typed[f.id] ?? '');
    if (!w.length) continue;
    const available = ex.tokens.filter((t) => !used.has(t.id));
    const parse = parseField(w, f.id, available, prefer);
    if (parse.ids.length) placement[f.id] = parse.ids;
    parse.ids.forEach((id) => used.add(id));
    unknown.push(...parse.unknown);
  }

  return { placement, unknown, missing: ex.tokens.filter((t) => !used.has(t.id)) };
}

function samePlacement(a: Placement, b: Placement): boolean {
  const keys = (p: Placement) =>
    Object.keys(p)
      .filter((k) => p[k as FieldId]?.length)
      .sort();
  const ka = keys(a);
  const kb = keys(b);
  return (
    ka.length === kb.length &&
    ka.every((k, i) => k === kb[i] && a[k as FieldId]!.join(',') === b[k as FieldId]!.join(','))
  );
}

/**
 * Resolve the text typed into each schema field to the exercise's tokens.
 *
 * Words match tokens without regard to case, and a multi-word chip ("i
 * mødet") matches when its words are typed together in one field. When the
 * same word occurs twice in the sentence, the copy is chosen that makes the
 * learner's arrangement line up with an accepted answer — two identical
 * "det"s must never turn a right answer wrong.
 */
export function placementFromTyped(ex: Exercise, typed: TypedFields): TypedPlacement {
  const candidates = [ex.solution, ...(ex.alternatives ?? [])];
  for (const cand of candidates) {
    const r = resolve(ex, typed, cand);
    if (!r.unknown.length && !r.missing.length && samePlacement(r.placement, cand)) return r;
  }
  return resolve(ex, typed, ex.solution);
}

/** The words of a placement written back into field boxes — the answer key as typed text. */
export function typedFromPlacement(ex: Exercise, p: Placement): TypedFields {
  const out: TypedFields = {};
  for (const [f, ids] of Object.entries(p)) {
    if (!ids?.length) continue;
    out[f as FieldId] = ids.map((id) => ex.tokens.find((t) => t.id === id)?.text ?? '').join(' ');
  }
  return out;
}
