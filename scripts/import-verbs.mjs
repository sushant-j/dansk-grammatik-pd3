/**
 * Import the verb bank from "500 Most Common Verbs in Danish" (basby.dk).
 *
 *   node scripts/import-verbs.mjs        → writes src/content/data/verbs.json
 *
 * The PDF is a 13-page table: navneform, nutid, datid, førnutid, førdatid,
 * bydeform and bøjningsgruppe (b1 = weak -ede, b2 = weak -te, uv = irregular).
 * Its text is MacRoman-encoded and laid out cell by cell, so this reads the
 * raw page streams, places each text run in a column by its x position, and
 * stitches cells that wrap over several lines (reflexive verbs) back together.
 *
 * Forms come from the list as-is. Two things are derived here, not invented:
 * the verb class (from the group code, or from the past tense where the list
 * leaves the code blank), and `wrongPast`, the form a learner produces by
 * reaching for the other weak suffix (or any suffix, for an irregular verb).
 * English glosses and niveaus are not in the PDF; they live in verbs.meta.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_URL = 'http://basby.dk/verbliste/verblist.pdf';
const PDF = path.join(ROOT, 'scripts/sources/verblist.pdf');
const OUT = path.join(ROOT, 'src/content/data/verbs.json');

if (!fs.existsSync(PDF)) {
  fs.mkdirSync(path.dirname(PDF), { recursive: true });
  // Plain http: the site's TLS certificate has expired.
  const res = await fetch(SOURCE_URL);
  fs.writeFileSync(PDF, Buffer.from(await res.arrayBuffer()));
}

const macRoman = new TextDecoder('macintosh');

/** Decode a PDF literal string body: backslash escapes, then MacRoman bytes. */
function pdfString(raw) {
  const bytes = [];
  for (let i = 0; i < raw.length; i++) {
    const b = raw[i];
    if (b !== 0x5c) { bytes.push(b); continue; }
    const n = raw[++i];
    if (n >= 0x30 && n <= 0x37) {
      let oct = String.fromCharCode(n);
      while (oct.length < 3 && raw[i + 1] >= 0x30 && raw[i + 1] <= 0x37) oct += String.fromCharCode(raw[++i]);
      bytes.push(parseInt(oct, 8));
    } else bytes.push({ 0x6e: 10, 0x72: 13, 0x74: 9 }[n] ?? n);
  }
  return macRoman.decode(Uint8Array.from(bytes));
}

const pdf = fs.readFileSync(PDF);
const pages = [];
const pdfText = pdf.latin1Slice(0, pdf.length);
const streamRe = /stream\r?\n/g;
for (let m; (m = streamRe.exec(pdfText)); ) {
  const start = m.index + m[0].length;
  const end = pdf.indexOf('endstream', start);
  try {
    const s = zlib.inflateSync(pdf.subarray(start, end));
    if (s.includes('Tj') || s.includes('TJ')) pages.push(s);
  } catch {}
}

/** Text runs on a page: { x, y, text } with the raw spacing kept. */
function runs(page) {
  const out = [];
  const src = page.latin1Slice(0, page.length);
  const re = /0\.24 0 0 0\.24 ([\d.]+) ([\d.]+)\s*cm\s*BT([\s\S]*?)ET/g;
  for (let m; (m = re.exec(src)); ) {
    const body = Buffer.from(m[3], 'latin1');
    const parts = [];
    // Literal strings inside Tj / TJ, honouring escaped parentheses.
    for (let i = 0; i < body.length; i++) {
      if (body[i] !== 0x28) continue;
      let depth = 1, j = i + 1;
      const raw = [];
      for (; j < body.length && depth; j++) {
        if (body[j] === 0x5c) { raw.push(body[j], body[j + 1]); j++; continue; }
        if (body[j] === 0x28) depth++;
        if (body[j] === 0x29 && --depth === 0) break;
        raw.push(body[j]);
      }
      parts.push(pdfString(Buffer.from(raw)));
      i = j;
    }
    out.push({ x: Number(m[1]), y: Number(m[2]), text: parts.join('') });
  }
  return out;
}

const COLS = ['infinitive', 'present', 'past', 'perfect', 'pluperfect', 'imperative', 'group'];

const rows = [];
// Only the first page prints the column header; the others share its layout.
let edges = null;
let headerY = 0;
for (const page of pages) {
  const rs = runs(page);
  const header = rs.filter((r) => /^(navnem\.|nutid|datid|førnutid|førdatid|bydem\.|bøj\.)$/.test(r.text.trim()));
  if (header.length === 7) {
    headerY = header[0].y;
    // Column edges sit halfway between neighbouring header labels.
    const centers = header.sort((a, b) => a.x - b.x).map((h) => h.x + h.text.trim().length * 2.5);
    edges = centers.slice(0, -1).map((c, i) => (c + centers[i + 1]) / 2);
  }
  if (!edges || !rs.some((r) => /MOST COMMON VERBS/.test(r.text))) continue; // not a table page
  const colOf = (x) => edges.filter((e) => x >= e).length;

  const lines = new Map();
  for (const r of rs) {
    if (r.y >= headerY - 2 || r.y < 60 || !r.text.trim() || r.x < 100) continue; // header, footer, translation col
    const y = Math.round(r.y);
    if (!lines.has(y)) lines.set(y, []);
    lines.get(y).push(r);
  }
  const ys = [...lines.keys()].sort((a, b) => b - a);
  const cellsOf = (y) => {
    const cells = Array(7).fill('');
    for (const r of lines.get(y).sort((a, b) => a.x - b.x)) cells[colOf(r.x)] += r.text;
    return cells;
  };
  // A line with an infinitive anchors an entry; wrapped lines without one
  // belong to the nearest anchor (cells of reflexive verbs wrap above/below).
  // A lone "sig" is the wrapped second line of a reflexive infinitive, not a verb.
  const anchors = ys.filter((y) => cellsOf(y)[0].trim() && cellsOf(y)[0].trim() !== 'sig');
  const entries = new Map(anchors.map((y) => [y, []]));
  for (const y of ys) {
    const nearest = anchors.reduce((best, a) => (Math.abs(a - y) < Math.abs(best - y) ? a : best));
    entries.get(nearest).push(y);
  }
  for (const a of anchors) {
    const cells = Array(7).fill('');
    for (const y of entries.get(a).sort((p, q) => q - p)) {
      cellsOf(y).forEach((c, i) => { if (c.trim()) cells[i] += ' ' + c; });
    }
    // A word broken across lines in the PDF ("repræsen- terer") is joined back up.
    rows.push(Object.fromEntries(COLS.map((c, i) => [c, cells[i].replace(/(\p{L})-\s*(\p{L})/gu, '$1$2').replace(/\s+/g, ' ').trim()])));
  }
}

// ── Derivations ─────────────────────────────────────────────────────────────

const REFLEXIVE = / sig$/;
/** The verb word itself: "bevæge sig" → "bevæge", "lade som om" → "lade". */
const head = (s) => s.split(' ')[0];
/** Whatever follows the verb word, kept on every derived form: " sig", " som om". */
const tail = (s) => s.slice(head(s).length);

/**
 * The class is read off the forms themselves: a past tense that is the stem
 * plus -ede or -te is weak, anything else is irregular. The list's own group
 * code disagrees with its forms in a few rows (smide is coded weak but has
 * "smed"); the forms are what the learner is tested on, so they win, and the
 * disagreements are reported.
 */
function verbClass(row) {
  if (IRREGULAR.has(head(row.infinitive))) return 'strong';
  const past = head(row.past);
  const stems = [head(row.infinitive).replace(/e$/, ''), row.imperative ? head(row.imperative) : null].filter(Boolean);
  if (stems.some((st) => past === st + 'ede')) return 'weak-ede';
  if (stems.some((st) => past === st + 'te' || past === st.replace(/(.)\1$/, '$1') + 'te')) return 'weak-te';
  return 'strong';
}

const GROUP_CLASS = { b1: 'weak-ede', b2: 'weak-te', uv: 'strong' };

/** The bare stem a suffix attaches to: the imperative, or the infinitive minus its final -e. */
function stemOf(row, cls) {
  const inf = head(row.infinitive);
  const fromInfinitive = inf.length > 2 && inf.endsWith('e') ? inf.slice(0, -1) : inf;
  // Weak verbs attach the suffix to the imperative (snak → snakte); a learner
  // over-regularising an irregular verb works from the infinitive (ligg → liggede).
  if (cls === 'strong' || !row.imperative) return fromInfinitive;
  return head(row.imperative);
}

function wrongPast(row, cls) {
  // Deponent -s verbs (nøjes, synes) keep the -s after the suffix: nøjedes → *nøjtes.
  const inf = head(row.infinitive);
  if (inf.endsWith('s') && head(row.past).endsWith('s')) {
    const stem = inf.replace(/e?s$/, '');
    // An irregular deponent's real past can itself end in -edes (lykkedes), so offer -tes instead.
    const suffix = cls === 'weak-ede' || stem + 'edes' === head(row.past) ? 'tes' : 'edes';
    return stem + suffix + tail(row.infinitive);
  }
  const stem = stemOf(row, cls);
  // Weak verbs: the other suffix. Irregular verbs: the over-regularised -ede.
  return (cls === 'weak-ede' ? stem + 'te' : stem + 'ede') + tail(row.infinitive);
}

const idOf = (infinitive, note) => 'v-' + infinitive.replace(/\s+/g, '-') + (note ? '-' + note : '');

/**
 * Typos in the source, corrected against Retskrivningsordbogen. Keyed by
 * infinitive, then column.
 */
const CORRECTIONS = {
  'koncentrere sig': { past: 'koncentrerede sig' },
  udvide: { past: 'udvidede' },
};

/** Modal verbs look like weak verbs on paper (må → måtte) but are irregular. */
const IRREGULAR = new Set(['måtte', 'kunne', 'skulle', 'ville', 'burde', 'turde', 'gide']);

/** "hænge, (tr)." → { word: "hænge", note: "tr" }: the list separates homographs this way. */
function splitNote(cell) {
  const m = cell.match(/^(.*?),?\s*\((tr|intr)\.?\)\.?$/);
  return m ? { word: m[1].trim(), note: m[2] } : { word: cell, note: null };
}

for (const row of rows) {
  // The list capitalises the odd form ("Hævdede", "Har kommenteret"); none of these words is a proper noun.
  for (const c of COLS) row[c] = row[c].toLowerCase();
  const { word, note } = splitNote(row.infinitive);
  row.infinitive = word;
  row.note = note;
  Object.assign(row, CORRECTIONS[word] ?? {});
}

const problems = [];
const notes = [];
const verbs = rows.map((row) => {
  const cls = verbClass(row);
  if (row.group && GROUP_CLASS[row.group] !== cls) notes.push(`${row.infinitive}: list says ${row.group}, forms say ${cls}`);
  // "har / er gået": the list marks verbs that take either auxiliary.
  const auxMatch = row.perfect.match(/^(har|er)(?:\s*\/\s*(?:har|er))?\s*(.+)$/);
  const both = /^(har|er)\s*\/\s*(har|er)/i.test(row.perfect);
  if (!auxMatch) problems.push(`${row.infinitive}: perfect "${row.perfect}" has no har/er`);
  if (!/^(havde|var)\s/i.test(row.pluperfect)) problems.push(`${row.infinitive}: pluperfect "${row.pluperfect}"`);
  for (const c of ['present', 'past']) if (!row[c]) problems.push(`${row.infinitive}: missing ${c}`);
  const wp = wrongPast(row, cls);
  if (wp === row.past) problems.push(`${row.infinitive}: wrongPast equals past`);
  return {
    id: idOf(row.infinitive, row.note),
    infinitive: row.infinitive,
    present: row.present,
    past: row.past,
    wrongPast: wp,
    participle: auxMatch ? auxMatch[2] : '',
    verbClass: cls,
    perfectAux: both ? 'both' : auxMatch ? auxMatch[1].toLowerCase() : 'har',
    pluperfect: row.pluperfect.replace(/\s*\/\s*/, ' / ').replace(/\/ (var|er)(?=\S)/, '/ $1 '),
    imperative: row.imperative || null,
    reflexive: REFLEXIVE.test(row.infinitive),
    /** "tr"/"intr" for the list's transitive/intransitive homograph pairs (hænge). */
    transitivity: row.note,
    sourceGroup: row.group || null,
  };
});

const ids = verbs.map((v) => v.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) problems.push('duplicate ids: ' + dupes.join(', '));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(verbs, null, 1) + '\n');
console.log(`${verbs.length} verbs → ${path.relative(ROOT, OUT)}`);
if (notes.length) console.log(`${notes.length} group codes overridden by the forms:\n  ` + notes.join('\n  '));
if (problems.length) {
  console.log(`${problems.length} rows need a look:\n  ` + problems.join('\n  '));
  process.exitCode = 1;
}
