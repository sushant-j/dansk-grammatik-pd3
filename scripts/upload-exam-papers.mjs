#!/usr/bin/env node
/**
 * Upload the transcribed official reading papers to Supabase.
 *
 *   npm run exam:upload
 *
 * Reads content-private/exams/*.json (kept out of git: the repo is public)
 * and upserts each into `exam_papers`, where only signed-in users can read
 * them. Only papers whose content changed are written, so `updated_at` — which
 * the app uses to refresh its cached copy — moves only when a paper really
 * changes.
 *
 * Needs, in .env.local:
 *   EXPO_PUBLIC_SUPABASE_URL   (already there for the app)
 *   SUPABASE_SECRET_KEY        the project's secret (service-role) key — it
 *                              bypasses row-level security, so it must never
 *                              get an EXPO_PUBLIC_ prefix or leave this machine.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'content-private/exams');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv(path.join(root, '.env.local'));

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.');
  process.exit(1);
}
if (!fs.existsSync(dir)) {
  console.error(`No papers to upload: ${path.relative(root, dir)} does not exist.`);
  process.exit(1);
}

const client = createClient(url, secret, { auth: { persistSession: false } });

const papers = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

const { data: existing, error: readError } = await client.from('exam_papers').select('id, content');
if (readError) {
  console.error(`Could not read exam_papers: ${readError.message}. Has migration 0002 been run?`);
  process.exit(1);
}
const before = new Map((existing ?? []).map((r) => [r.id, JSON.stringify(r.content)]));

const changed = papers.filter((p) => before.get(p.id) !== JSON.stringify(p));
const now = new Date().toISOString();
const rows = changed.map((p) => {
  const { lf1: _lf1, lf2: _lf2, ...meta } = p;
  return { id: p.id, meta, content: p, updated_at: now };
});

if (rows.length) {
  const { error } = await client.from('exam_papers').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error(`Upload failed: ${error.message}`);
    process.exit(1);
  }
}
console.log(`${papers.length} papers: ${rows.length} uploaded, ${papers.length - rows.length} unchanged.`);
for (const r of rows) console.log(`  ↑ ${r.id}`);
