/**
 * Every reading paper has the real exam's shape and answerable keys.
 *
 * Simulated papers ship in the repo and are always checked. Official papers
 * live in content-private/ (kept out of git); they are checked whenever that
 * folder is present, i.e. on the machine that transcribes and uploads them.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ReadingPaper } from './types';
import { validatePaper } from './validate';

const ROOT = path.join(__dirname, '../../..');
const DIRS = [path.join(__dirname, 'simulated'), path.join(ROOT, 'content-private/exams')];

function load(dir: string): ReadingPaper[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as ReadingPaper);
}

const papers = DIRS.flatMap(load);
const only = process.env.PAPER;

describe('reading papers', () => {
  it('have unique ids matching their file names', () => {
    const ids = papers.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const dir of DIRS) {
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
        expect(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).id).toBe(f.replace(/\.json$/, ''));
      }
    }
  });

  for (const p of papers.filter((x) => !only || x.id === only)) {
    it(`${p.id} is well-formed`, () => {
      expect(validatePaper(p)).toEqual([]);
    });
  }
});
