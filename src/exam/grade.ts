/**
 * Marking a reading paper.
 *
 * Læseforståelse 2 is objectively scored: a letter is right or wrong. Læse-
 * forståelse 1 is marked against a *guide* key ("vejledende rettenøgle"),
 * written in a small notation the censor booklets explain on every page:
 *
 *   a/b      a and/or b
 *   (words)  may be included in the answer or left out
 *
 * `keyAnswers` turns that notation into the set of answers it describes, and
 * `matchesKey` accepts a learner's answer if it says one of them. The guide
 * also says other answers can be right (the censor decides), so an answer the
 * matcher rejects can be marked right by the learner on the result screen.
 */

import type { ExamPart, GradeTable, Lf2Task, ReadingPaper } from '../content/exams/types';

// ── Key notation ───────────────────────────────────────────────────────────

/** Split on `sep` where it is not inside parentheses. */
function splitTop(s: string, sep: RegExp): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0) {
      const m = sep.exec(s.slice(i));
      if (m && m.index === 0) {
        out.push(cur);
        cur = '';
        i += m[0].length - 1;
        continue;
      }
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

const LIMIT = 4000;

function cross(a: string[], b: string[], joiner: string): string[] {
  const out: string[] = [];
  for (const x of a) {
    for (const y of b) {
      out.push(x && y ? x + joiner + y : x || y);
      if (out.length >= LIMIT) return out;
    }
  }
  return out;
}

/** A single word-level chunk: literal text and `(optional)` groups, no spaces outside groups. */
function expandWord(w: string): string[] {
  let acc = [''];
  let i = 0;
  while (i < w.length) {
    if (w[i] === '(') {
      let depth = 1;
      let j = i + 1;
      while (j < w.length && depth > 0) {
        if (w[j] === '(') depth++;
        else if (w[j] === ')') depth--;
        j++;
      }
      const inner = w.slice(i + 1, j - 1);
      acc = cross(acc, ['', ...expand(inner)], '');
      i = j;
    } else {
      let j = i;
      while (j < w.length && w[j] !== '(') j++;
      const lit = w.slice(i, j);
      acc = acc.map((x) => x + lit);
      i = j;
    }
  }
  return acc;
}

/** Slash binds the words either side of it: "du/man ikke får" → du ikke får | man ikke får. */
function expandWords(s: string): string[] {
  const words = splitTop(s.trim(), /^\s+/).filter(Boolean);
  let acc = [''];
  for (const word of words) {
    const alts = splitTop(word, /^\//).flatMap(expandWord);
    acc = cross(acc, alts, ' ');
  }
  return acc;
}

function expand(s: string): string[] {
  // Read the slashes both ways — as whole-phrase alternatives
  // ("Græs/høj bevoksning/trampesti") and as word alternatives
  // ("du/man ikke får elevløn") — and accept anything either reading allows.
  // A key that spaces its phrase slashes (" / ") marks the phrase reading
  // explicitly, so only those split phrases there.
  const phraseSep = /\s\/\s/.test(s) ? /^\s+\/\s+/ : /^\s*\/\s*/;
  const phrases = splitTop(s, phraseSep);
  const out = new Set<string>(expandWords(s));
  if (phrases.length > 1) for (const p of phrases) for (const x of expandWords(p)) out.add(x);
  return [...out];
}

const NUMBER_WORDS: Record<string, string> = {
  nul: '0', én: '1', ét: '1', to: '2', tre: '3', fire: '4', fem: '5', seks: '6',
  syv: '7', otte: '8', ni: '9', ti: '10', elleve: '11', tolv: '12', tretten: '13', fjorten: '14',
  femten: '15', seksten: '16', sytten: '17', atten: '18', nitten: '19', tyve: '20',
};

const JOINERS = new Set(['og', 'samt']);

/** Lower-case, unify dashes and quotes, drop punctuation, number words → digits. */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[–—]/g, '-')
    .replace(/(\d)\.(\d)/g, '$1$2') // 4.793 → 4793
    .replace(/[.,;:!?'"’‘”“«»()[\]/]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => NUMBER_WORDS[w] ?? w)
    // "x og y" and "x, y" say the same as a key's "x … y": a two-part answer
    // shouldn't fail on the word that joins its parts.
    .filter((w) => !JOINERS.has(w))
    .join(' ');
}

/** Every answer a key in censor notation describes (plus `also`, in the same notation), normalised. */
export function keyAnswers(key: string, also: string[] = []): string[] {
  const out = new Set<string>();
  for (const raw of [key, ...also].flatMap(expand)) {
    const n = normalizeAnswer(raw);
    if (n) out.add(n);
  }
  return [...out];
}

function containsWords(hay: string[], needle: string[]): boolean {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

/**
 * True when the answer says one of the key's answers. A short answer may wrap
 * the key in a few words of its own ("de er krydrede og grove"), but a long
 * one that merely contains it somewhere is not accepted — the booklet asks
 * for precise answers with nothing extra.
 */
export function matchesKey(answer: string, key: string, also: string[] = []): boolean {
  const a = normalizeAnswer(answer);
  if (!a) return false;
  const aw = a.split(' ');
  for (const k of keyAnswers(key, also)) {
    if (a === k) return true;
    const kw = k.split(' ');
    if (aw.length <= kw.length + Math.max(3, kw.length) && containsWords(aw, kw)) return true;
  }
  return false;
}

// ── Items and scores ──────────────────────────────────────────────────────

/** The learner's answers in one part, by item id: 'q7' in LF1, '0:2' (task 0, item 2) in LF2. */
export type Answers = Record<string, string>;

export interface ItemResult {
  id: string;
  /** "7", "2A · 2" */
  label: string;
  given: string;
  /** What the key accepts, for display: the censor notation, or the right letter. */
  key: string;
  correct: boolean;
  /** LF1 only: the learner overrode the matcher. */
  selfMarked?: boolean;
  points: number;
  max: number;
}

export interface PartScore {
  items: ItemResult[];
  byTask: { label: string; title: string; points: number; max: number }[];
  points: number;
  max: number;
}

export const lf2ItemId = (task: number, item: number) => `${task}:${item}`;

function taskItems(task: Lf2Task): { n: number; key: string; also?: string[] }[] {
  switch (task.kind) {
    case 'mc':
      return task.questions.map((q, i) => ({ n: i + 1, key: q.correct, also: q.alsoCorrect }));
    case 'insert':
      return task.correct.map((c, i) => ({ n: i + 1, key: c }));
    case 'cloze':
      return task.gaps.map((g, i) => ({ n: i + 1, key: g.correct, also: g.alsoCorrect }));
  }
}

export function partItemIds(paper: ReadingPaper, part: ExamPart): string[] {
  if (part === 'lf1') return paper.lf1.questions.map((q) => `q${q.n}`);
  return paper.lf2.tasks.flatMap((t, ti) => taskItems(t).map((it) => lf2ItemId(ti, it.n)));
}

export function partMax(paper: ReadingPaper, part: ExamPart): number {
  if (part === 'lf1') return paper.lf1.questions.length;
  return paper.lf2.tasks.reduce((sum, t) => sum + taskItems(t).length * t.points, 0);
}

export function paperMax(paper: ReadingPaper): number {
  return partMax(paper, 'lf1') + partMax(paper, 'lf2');
}

/**
 * Score one part. `selfMarks` (LF1 only) overrides the matcher per question,
 * in either direction: the learner is acting as their own censor.
 */
export function scorePart(
  paper: ReadingPaper,
  part: ExamPart,
  answers: Answers,
  selfMarks: Record<string, boolean> = {},
): PartScore {
  const items: ItemResult[] = [];
  const byTask: PartScore['byTask'] = [];

  if (part === 'lf1') {
    for (const q of paper.lf1.questions) {
      const id = `q${q.n}`;
      const given = answers[id] ?? '';
      const auto = q.freePoint || matchesKey(given, q.key, q.also);
      const self = selfMarks[id];
      const correct = self ?? auto;
      items.push({
        id,
        label: String(q.n),
        given,
        key: q.key,
        correct,
        selfMarked: self !== undefined && self !== auto ? true : undefined,
        points: correct ? 1 : 0,
        max: 1,
      });
    }
    const points = items.reduce((s, i) => s + i.points, 0);
    byTask.push({ label: '1', title: paper.lf1.theme, points, max: items.length });
  } else {
    paper.lf2.tasks.forEach((task, ti) => {
      let points = 0;
      const list = taskItems(task);
      for (const it of list) {
        const id = lf2ItemId(ti, it.n);
        const given = answers[id] ?? '';
        const correct = given === it.key || (!!given && !!it.also?.includes(given));
        if (correct) points += task.points;
        items.push({
          id,
          label: `${task.label} · ${it.n}`,
          given,
          key: it.also?.length ? [it.key, ...it.also].join(' / ') : it.key,
          correct,
          points: correct ? task.points : 0,
          max: task.points,
        });
      }
      byTask.push({ label: task.label, title: task.title, points, max: list.length * task.points });
    });
  }

  return {
    items,
    byTask,
    points: items.reduce((s, i) => s + i.points, 0),
    max: items.reduce((s, i) => s + i.max, 0),
  };
}

/** The grade for a points total, from the session's conversion table. */
export function gradeFor(table: GradeTable, points: number): string {
  for (const [min, grade] of table) if (points >= min) return grade;
  return table[table.length - 1]?.[1] ?? '-3';
}

/** Numeric value of a 7-point-scale grade, for averaging ('02' → 2, '-3' → -3). */
export const gradeValue = (g: string) => Number(g);

/** PD3 passes on an average of 2.0 across skills; on its own, 02 is the lowest pass. */
export const isPassingGrade = (g: string) => gradeValue(g) >= 2;
