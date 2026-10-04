#!/usr/bin/env node
/**
 * How hard is each simulated reading paper, next to the official ones?
 *
 *   npm run exam:difficulty
 *
 * Measures every paper on the things that make a PD3 reading paper hard —
 * how heavy the texts read (LIX), how much work an LF1 question makes you do
 * before you can look anything up, and the cues a test-wise reader can use
 * instead of reading (the longest option, an option that repeats the text's
 * words) — and compares each simulated paper with the official papers in
 * today's format. Simulated papers marked `level: 'exam'` must fall inside
 * the official range on every checked metric, or the script fails.
 *
 * The official papers are read from content-private/exams/ (kept out of git),
 * so the comparison only runs on a machine that has them. Only numbers are
 * printed, never any official text.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
        .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    : [];

const official = load(path.join(root, 'content-private/exams')).filter((p) => p.format === 'current');
const simulated = load(path.join(root, 'src/content/exams/simulated'));

// ── Text ────────────────────────────────────────────────────────────────────

const WORD = /[a-zæøåéüö]+/gi;
const words = (s) => s.match(WORD) ?? [];
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const runText = (runs) =>
  runs.map((r) => (typeof r === 'string' ? r : 'gap' in r ? ' ___ ' : (r.em ?? r.strong))).join('');

/** Running prose only: tables and lists would count every row as a short sentence. */
const prose = (blocks) =>
  blocks
    .filter((b) => b.t === 'p')
    .map((b) => runText(b.runs))
    .join('\n');

const blockText = (b) =>
  b.t === 'p' ? runText(b.runs) : b.t === 'list' ? b.items.join(' ') : b.t === 'table' ? b.rows.flat().join(' ') : (b.text ?? '');

/** LIX: words per sentence plus the percentage of words over six letters. */
function lix(text) {
  const w = words(text);
  if (!w.length) return 0;
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) ?? []).length);
  return w.length / sentences + (100 * w.filter((x) => x.length > 6).length) / w.length;
}

const STOP = new Set(
  ('og i at det en den til er som på de med han af for ikke der var mig sig men et har om vi min havde ham hun nu ' +
    'over da fra du ud sin dem os op man hans hvor eller hvad skal selv her alle vil blev kunne ind når være dog ' +
    'noget ville jo deres efter ned skulle denne end dette mit også under have dig anden hende mine alt meget sit ' +
    'sine mod disse hvis din nogle hos blive mange bliver hendes været sådan hvilken hvilke hvem hvorfor hvordan ' +
    'hvornår kan får')
    .split(' '),
);
const contentWords = (s) => new Set(words(s.toLowerCase()).filter((w) => w.length > 2 && !STOP.has(w)));
/** Share of an option's content words that also appear in the text. */
function overlap(option, text) {
  const a = contentWords(option);
  const b = contentWords(text);
  return a.size ? [...a].filter((w) => b.has(w)).length / a.size : 0;
}

// ── Metrics ─────────────────────────────────────────────────────────────────

/**
 * `check`: 'range' — must sit between the official minimum and maximum;
 * 'min' — at least the official minimum; 'max' — at most the official maximum;
 * absent — shown for information only.
 */
const METRICS = [
  { key: 'lf1Lix', label: 'LF1 text LIX', check: 'range' },
  { key: 'lf1Words', label: 'LF1 text words', check: 'range' },
  { key: 'promptLen', label: 'LF1 prompt words (mean)', check: 'range' },
  { key: 'premise', label: 'LF1 premise-first prompts', check: 'range' },
  { key: 'exclusion', label: 'LF1 "udover/ikke kun" prompts', check: 'range' },
  { key: 'listing', label: 'LF1 "Nævn begge" prompts' },
  { key: 'yesNo', label: 'LF1 ja/nej prompts' },
  { key: 'paraphrased', label: 'LF1 paraphrased keys' },
  { key: 'keyLen', label: 'LF1 key words (mean)', check: 'min' },
  { key: 'tableAnswers', label: 'LF1 answers in tables', check: 'max' },
  { key: 'mcLix', label: '2A text LIX', check: 'range' },
  { key: 'mcLongest', label: '2A correct = longest option', check: 'max' },
  { key: 'mcEcho', label: '2A text-echo, correct − wrong', check: 'max' },
  { key: 'insertLix', label: '2B text LIX', check: 'range' },
  { key: 'clozeLix', label: '3 text LIX', check: 'range' },
  { key: 'clozeMulti', label: '3 gaps with multi-word options', check: 'min' },
];

const stripKey = (key) =>
  key
    .replace(/\([^)]*\)/g, '')
    .split('/')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

function measure(p) {
  const m = {};
  const sections = p.lf1.sections;
  const lf1Prose = sections.map((s) => prose(s.blocks)).join('\n');
  m.lf1Lix = lix(lf1Prose);
  m.lf1Words = words(sections.map((s) => s.blocks.map(blockText).join('\n')).join('\n')).length;

  const qs = p.lf1.questions;
  m.promptLen = mean(qs.map((q) => q.prompt.split(/\s+/).length));
  // A sentence before the question: "X er … . Hvad …?"
  m.premise = qs.filter((q) => /[.!?]\s+\S/.test(q.prompt.trim().replace(/[?]$/, ''))).length;
  m.exclusion = qs.filter((q) => /\b(udover|ud over|bortset fra|ikke kun|foruden|både)\b/i.test(q.prompt)).length;
  m.listing = qs.filter((q) => /Nævn (begge|to|tre)|Hvilke (to|tre)/.test(q.prompt)).length;
  m.yesNo = qs.filter((q) => /’ja’|'ja'/.test(q.prompt)).length;
  m.paraphrased = qs.filter((q) => q.paraphrased).length;
  m.keyLen = mean(qs.map((q) => words(q.key).length));
  const tables = sections.flatMap((s) => s.blocks.filter((b) => b.t === 'table').map((b) => blockText(b).toLowerCase()));
  const elsewhere = sections.flatMap((s) => s.blocks.filter((b) => b.t !== 'table').map((b) => blockText(b).toLowerCase()));
  m.tableAnswers = qs.filter((q) => {
    const keys = stripKey(q.key);
    return keys.some((k) => tables.some((t) => t.includes(k))) && !keys.some((k) => elsewhere.some((t) => t.includes(k)));
  }).length;

  for (const task of p.lf2.tasks) {
    if (task.kind === 'mc') {
      const text = task.passages.map((x) => prose(x.blocks)).join('\n');
      m.mcLix = lix(text);
      let longest = 0;
      const right = [];
      const wrong = [];
      for (const q of task.questions) {
        const i = 'ABCD'.indexOf(q.correct);
        const lens = q.options.map((o) => words(o).length);
        if (lens.filter((l) => l >= lens[i]).length === 1) longest++;
        q.options.forEach((o, j) => (j === i ? right : wrong).push(overlap(o, text)));
      }
      m.mcLongest = longest;
      m.mcEcho = mean(right) - mean(wrong);
    } else if (task.kind === 'insert') {
      m.insertLix = lix(prose(task.passage.blocks));
    } else {
      m.clozeLix = lix(prose(task.passage.blocks));
      m.clozeMulti = task.gaps.filter((g) => g.options.some((o) => o.trim().includes(' '))).length;
    }
  }
  return m;
}

// ── Report ──────────────────────────────────────────────────────────────────

const fmt = (x) => (x === undefined ? '–' : Number.isInteger(x) ? String(x) : x.toFixed(2));
const pad = (s, n) => String(s).padEnd(n);

const offM = official.map(measure);
const simM = simulated.map((p) => ({ p, m: measure(p) }));
const bounds = Object.fromEntries(
  METRICS.map(({ key }) => {
    const xs = offM.map((m) => m[key]).filter((x) => x !== undefined);
    return [key, xs.length ? [Math.min(...xs), Math.max(...xs)] : null];
  }),
);

function outside(key, check, x) {
  const b = bounds[key];
  if (!b || !check || x === undefined) return false;
  const eps = 1e-9;
  if (check === 'range') return x < b[0] - eps || x > b[1] + eps;
  if (check === 'min') return x < b[0] - eps;
  return x > b[1] + eps;
}

const ids = simM.map(({ p }) => p.id);
console.log(
  official.length
    ? `Official range: ${official.length} papers in today's format. * = outside it.\n`
    : 'No official papers in content-private/exams/: showing simulated papers only, nothing is checked.\n',
);
console.log(pad('', 34) + pad('official', 20) + ids.map((id) => pad(id, 9)).join(''));
for (const { key, label, check } of METRICS) {
  const b = bounds[key];
  const range = b ? `${fmt(b[0])}–${fmt(b[1])}` : '–';
  const want = check === 'min' ? ' ≥' : check === 'max' ? ' ≤' : check === 'range' ? '' : ' (info)';
  const cells = simM.map(({ m }) => pad(fmt(m[key]) + (outside(key, check, m[key]) ? '*' : ''), 9));
  console.log(pad(label, 34) + pad(range + want, 20) + cells.join(''));
}

const failures = [];
for (const { p, m } of simM) {
  if (p.source.level !== 'exam' || !official.length) continue;
  for (const { key, label, check } of METRICS) {
    if (outside(key, check, m[key])) failures.push(`${p.id}: ${label} is ${fmt(m[key])}`);
  }
}
if (failures.length) {
  console.error(`\nExam-level papers outside the official range:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
if (official.length) console.log('\nEvery exam-level simulated paper is within the official range.');
