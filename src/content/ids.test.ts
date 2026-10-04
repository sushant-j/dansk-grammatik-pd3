/**
 * Guards the ids that learner progress points at.
 *
 * `content-ids.lock.json` is every id that has ever shipped. An id may leave
 * the content only by moving to RETIRED_IDS (see retired.ts), and a retired id
 * may never come back as a different item. New ids are added to the lock with
 * `npm run content:lock`, which makes accepting them a deliberate step.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_ADJECTIVE_RULE_IDS } from '../grammar/adjectiveRules';
import { ALL_COMMA_RULE_IDS } from '../grammar/commaRules';
import { ALL_NOUN_RULE_IDS } from '../grammar/nounRules';
import { ALL_RULE_IDS } from '../grammar/rules';
import { ALL_SPELLING_RULE_IDS } from '../grammar/spellingRules';
import { ALL_VERB_RULE_IDS } from '../grammar/verbRules';
import { ADJECTIVE_BANK } from './adjectives';
import { COMMA_EXAMPLES } from './commaExamples';
import { EXERCISES } from './exercises';
import { NOUN_BANK } from './nouns';
import { RETIRED_IDS, RULE_ALIASES } from './retired';
import { SPELLING_EXAMPLES } from './spellingExamples';
import { VERB_BANK } from './verbs';
import { VOCABULARY } from './vocabulary';

const LOCK_PATH = path.join(__dirname, 'content-ids.lock.json');

const ids = (items: { id: string }[]) => items.map((i) => i.id);

const current: Record<string, string[]> = {
  grammarRules: ALL_RULE_IDS,
  nounRules: ALL_NOUN_RULE_IDS,
  verbRules: ALL_VERB_RULE_IDS,
  adjectiveRules: ALL_ADJECTIVE_RULE_IDS,
  commaRules: ALL_COMMA_RULE_IDS,
  spellingRules: ALL_SPELLING_RULE_IDS,
  exercises: ids(EXERCISES),
  vocabulary: ids(VOCABULARY),
  nouns: ids(NOUN_BANK),
  verbs: ids(VERB_BANK),
  adjectives: ids(ADJECTIVE_BANK),
  comma: ids(COMMA_EXAMPLES),
  spelling: ids(SPELLING_EXAMPLES),
};

function readLock(): Record<string, string[]> {
  return fs.existsSync(LOCK_PATH) ? JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8')) : {};
}

if (process.env.UPDATE_CONTENT_LOCK) {
  // Union with the existing lock: an id once shipped stays locked forever.
  const lock = readLock();
  const next: Record<string, string[]> = {};
  for (const bank of Object.keys(current)) {
    next[bank] = [...new Set([...(lock[bank] ?? []), ...current[bank]])].sort();
  }
  fs.writeFileSync(LOCK_PATH, JSON.stringify(next, null, 2) + '\n');
}

const lock = readLock();

describe('content ids', () => {
  for (const [bank, list] of Object.entries(current)) {
    it(`${bank}: ids are unique`, () => {
      const dupes = list.filter((id, i) => list.indexOf(id) !== i);
      expect(dupes).toEqual([]);
    });

    it(`${bank}: every shipped id still exists or is retired`, () => {
      const missing = (lock[bank] ?? []).filter((id) => !list.includes(id) && !(id in RETIRED_IDS));
      expect(missing, 'removed ids must be added to RETIRED_IDS in retired.ts').toEqual([]);
    });

    it(`${bank}: every id is in the lockfile`, () => {
      const unlocked = list.filter((id) => !(lock[bank] ?? []).includes(id));
      expect(unlocked, 'run `npm run content:lock` to accept new ids').toEqual([]);
    });
  }

  it('a retired id is never reused', () => {
    const all = Object.values(current).flat();
    expect(all.filter((id) => id in RETIRED_IDS)).toEqual([]);
  });

  it('every rule alias points from a retired id to a live rule', () => {
    const liveRules = [
      ...current.grammarRules,
      ...current.nounRules,
      ...current.verbRules,
      ...current.adjectiveRules,
      ...current.commaRules,
      ...current.spellingRules,
    ];
    for (const [from, to] of Object.entries(RULE_ALIASES)) {
      expect(from in RETIRED_IDS, `${from} must be in RETIRED_IDS`).toBe(true);
      expect(liveRules).toContain(to);
    }
  });
});
