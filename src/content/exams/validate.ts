/**
 * Structural checks for a reading paper: does it have exactly the shape the
 * real exam has, and can every answer actually be found? Used by the content
 * tests for every paper, and by the transcription scripts while a paper is
 * being written, so a slip in a 14-page transcription shows up as a named
 * problem rather than as an unanswerable question in the app.
 */

import { keyAnswers, normalizeAnswer, paperMax } from '../../exam/grade';
import type { Block, ClozeTask, InsertTask, Inline, Lf2Task, McTask, PaperFormat, ReadingPaper } from './types';

const LETTERS = 'ABCDEFG';
const GRADES = ['12', '10', '7', '4', '02', '00', '-3'];

const LAYOUT: Record<PaperFormat, { kinds: Lf2Task['kind'][]; total: number; mcCount: number; mcOptions: number }> = {
  current: { kinds: ['mc', 'insert', 'cloze'], total: 39, mcCount: 3, mcOptions: 3 },
  older: { kinds: ['mc', 'cloze'], total: 37, mcCount: 7, mcOptions: 3 },
  oldest: { kinds: ['mc', 'cloze'], total: 37, mcCount: 7, mcOptions: 4 },
};

export function inlineText(runs: Inline[]): string {
  return runs
    .map((r) => (typeof r === 'string' ? r : 'gap' in r ? ' ' : 'em' in r ? r.em : r.strong))
    .join('');
}

export function blockText(b: Block): string {
  switch (b.t) {
    case 'h':
    case 'small':
      return b.text;
    case 'p':
      return inlineText(b.runs);
    case 'list':
      return b.items.join('\n');
    case 'table':
      return b.rows.map((r) => r.join(' ')).join('\n');
    case 'gap':
      return '';
  }
}

const inlineGaps = (blocks: Block[]) =>
  blocks.flatMap((b) => (b.t === 'p' ? b.runs.flatMap((r) => (typeof r === 'object' && 'gap' in r ? [r.gap] : [])) : []));

function sameSet(found: number[], want: number[]): boolean {
  const a = [...found].sort((x, y) => x - y);
  return a.length === want.length && a.every((x, i) => x === want[i]);
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

function checkMc(task: McTask, fmt: PaperFormat, err: (m: string) => void) {
  const { mcCount, mcOptions } = LAYOUT[fmt];
  if (task.points !== 2) err(`${task.label}: points should be 2`);
  if (task.questions.length !== mcCount) err(`${task.label}: ${task.questions.length} questions, expected ${mcCount}`);
  if (!task.passages.length) err(`${task.label}: no passage`);
  task.questions.forEach((q, i) => {
    if (q.options.length !== mcOptions) err(`${task.label} q${i + 1}: ${q.options.length} options, expected ${mcOptions}`);
    if (!LETTERS.slice(0, q.options.length).includes(q.correct) || q.correct.length !== 1)
      err(`${task.label} q${i + 1}: correct "${q.correct}" is not an option letter`);
    if (task.passages.length > 1 && (q.passage === undefined || !task.passages[q.passage]))
      err(`${task.label} q${i + 1}: says which passage it is about`);
  });
}

function checkInsert(task: InsertTask, err: (m: string) => void) {
  if (task.points !== 2) err(`${task.label}: points should be 2`);
  const letters = task.inserts.map((i) => i.letter).join('');
  if (letters !== 'ABCDEFG') err(`${task.label}: inserts should be lettered A–G, got ${letters}`);
  if (task.correct.length !== 5) err(`${task.label}: ${task.correct.length} answers, expected 5`);
  if (new Set(task.correct).size !== task.correct.length) err(`${task.label}: a letter is used twice in the key`);
  for (const c of task.correct) if (!letters.includes(c)) err(`${task.label}: key letter ${c} is not an insert`);
  const gaps = task.passage.blocks.flatMap((b) => (b.t === 'gap' ? [b.n] : []));
  if (!sameSet(gaps, range(1, 5))) err(`${task.label}: passage gaps are [${gaps}], expected 1–5 once each`);
}

function checkCloze(task: ClozeTask, err: (m: string) => void) {
  if (task.points !== 1) err(`${task.label}: points should be 1`);
  if (task.gaps.length !== 8) err(`${task.label}: ${task.gaps.length} gaps, expected 8`);
  task.gaps.forEach((g, i) => {
    if (g.options.length !== 4) err(`${task.label} gap ${i + 1}: ${g.options.length} options, expected 4`);
    if (!'ABCD'.includes(g.correct) || g.correct.length !== 1) err(`${task.label} gap ${i + 1}: correct "${g.correct}"`);
  });
  const want = task.example ? range(0, 8) : range(1, 8);
  const gaps = inlineGaps(task.passage.blocks);
  if (!sameSet(gaps, want)) err(`${task.label}: passage gaps are [${gaps}], expected ${want[0]}–8 once each`);
}

function hasEmpty(blocks: Block[]): boolean {
  return blocks.some((b) => b.t !== 'gap' && blockText(b).trim() === '' && !(b.t === 'p' && inlineGaps([b]).length));
}

/**
 * Item-writing checks for exam-level simulated papers: the cues a test-wise
 * reader uses to answer without reading, which the official papers avoid.
 */
function checkExamLevel(p: ReadingPaper, err: (m: string) => void) {
  const letters: string[] = [];
  const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
  for (const task of p.lf2.tasks) {
    if (task.kind === 'mc') {
      task.questions.forEach((q, i) => {
        letters.push(q.correct);
        const lens = q.options.map(words);
        const mine = lens[LETTERS.indexOf(q.correct)];
        if (lens.filter((l) => l >= mine).length === 1)
          err(`${task.label} q${i + 1}: the correct option is the longest one`);
      });
    } else if (task.kind === 'insert') {
      letters.push(...task.correct);
    } else {
      task.gaps.forEach((g, i) => {
        if (new Set(g.options.map(normalizeAnswer)).size !== g.options.length)
          err(`${task.label} gap ${i + 1}: options repeat`);
      });
      const multi = task.gaps.filter((g) => g.options.some((o) => o.trim().includes(' '))).length;
      if (multi < 3) err(`${task.label}: only ${multi} gaps have multi-word options, expected at least 3`);
    }
  }
  for (const l of 'ABC') if (!letters.includes(l)) err(`LF2: ${l} is never a correct answer`);
}

/** Words of a normalised string, padded so `includes` matches whole words only. */
const padded = (s: string) => ` ${normalizeAnswer(s)} `;

/** Every problem with the paper, as readable sentences; empty when it is sound. */
export function validatePaper(p: ReadingPaper): string[] {
  const problems: string[] = [];
  const err = (m: string) => problems.push(`${p.id}: ${m}`);
  const layout = LAYOUT[p.format];
  if (!layout) return [`${p.id}: unknown format ${p.format}`];

  // LF1
  const qs = p.lf1.questions;
  if (qs.length !== 15) err(`LF1 has ${qs.length} questions, expected 15`);
  qs.forEach((q, i) => {
    if (q.n !== i + 1) err(`LF1 question ${i + 1} is numbered ${q.n}`);
    if (!q.prompt.trim() || !q.key.trim()) err(`LF1 q${q.n}: empty prompt or key`);
  });
  if (p.lf1.theme !== p.lf1Theme) err(`lf1Theme "${p.lf1Theme}" differs from lf1.theme "${p.lf1.theme}"`);
  if (!p.lf1.sections.length) err('LF1 has no text sections');
  const sectionTitles = new Set(p.lf1.sections.map((s) => normalizeAnswer(s.title)));
  for (const q of qs) {
    if (!sectionTitles.has(normalizeAnswer(q.section))) err(`LF1 q${q.n}: section "${q.section}" is not a section title`);
  }
  for (const s of p.lf1.sections) if (hasEmpty(s.blocks)) err(`LF1 section "${s.title}" has an empty block`);

  // Every key should be findable in the collection: if it is not, the answer
  // was probably in a picture or a box that did not get transcribed.
  const lf1Text = padded(p.lf1.sections.map((s) => [s.title, ...s.blocks.map(blockText)].join('\n')).join('\n'));
  for (const q of qs) {
    if (q.paraphrased) continue;
    const found = keyAnswers(q.key, q.also).some((k) => lf1Text.includes(` ${k} `));
    if (!found) err(`LF1 q${q.n}: no form of the key "${q.key}" appears in the texts (mark paraphrased if intended)`);
  }

  // LF2
  const kinds = p.lf2.tasks.map((t) => t.kind);
  if (kinds.join() !== layout.kinds.join()) err(`LF2 tasks are [${kinds}], expected [${layout.kinds}] for ${p.format}`);
  if (p.lf2Titles.join('|') !== p.lf2.tasks.map((t) => t.title).join('|')) err('lf2Titles differ from the task titles');
  for (const task of p.lf2.tasks) {
    const blocks = task.kind === 'mc' ? task.passages.flatMap((x) => x.blocks) : task.passage.blocks;
    if (!blocks.length) err(`${task.label}: empty passage`);
    if (hasEmpty(blocks)) err(`${task.label}: has an empty block`);
    if (task.kind === 'mc') checkMc(task, p.format, err);
    else if (task.kind === 'insert') checkInsert(task, err);
    else checkCloze(task, err);
  }

  if (p.source.kind === 'simulated' && p.source.level === 'exam') checkExamLevel(p, err);

  // Totals and grades
  const max = paperMax(p);
  if (max !== layout.total) err(`max points ${max}, expected ${layout.total}`);
  const table = p.gradeTable;
  if (table.map(([, g]) => g).join() !== GRADES.join()) err(`grade table grades are [${table.map(([, g]) => g)}]`);
  if (table[table.length - 1]?.[0] !== 0) err('grade table does not reach 0 points');
  if (table.some(([min], i) => i > 0 && min >= table[i - 1][0])) err('grade table minimums are not descending');
  if (table[0]?.[0] > max) err('top grade needs more points than the paper has');

  return problems;
}
