/**
 * Structural checks on every practice bank.
 *
 * These can't prove the Danish is right — that is what the `reviewed` flag
 * and a dictionary check are for — but they catch the mistakes a large drafted
 * bank actually makes: a definite form that contradicts its gender, a
 * distractor identical to the answer, a sentence pair that differs in more
 * than its commas, a niveau with nothing in it.
 */

import { describe, expect, it } from 'vitest';
import { ALL_COMMA_RULE_IDS } from '../grammar/commaRules';
import { ALL_RULE_IDS } from '../grammar/rules';
import { ALL_SPELLING_RULE_IDS } from '../grammar/spellingRules';
import { DRILL_DOMAINS } from '../drills/registry';
import { ADJECTIVE_BANK } from './adjectives';
import { COMMA_EXAMPLES } from './commaExamples';
import IMPORTED_VERBS from './data/verbs.json';
import { EXERCISES } from './exercises';
import { ALL_LEVELS, isLevel, type Level } from './levels';
import { NOUN_BANK } from './nouns';
import { SPELLING_EXAMPLES } from './spellingExamples';
import { VERB_BANK } from './verbs';
import { VOCABULARY } from './vocabulary';

const BANKS: Record<string, { id: string; level: Level; reviewed?: boolean }[]> = {
  exercises: EXERCISES,
  nouns: NOUN_BANK,
  verbs: VERB_BANK,
  adjectives: ADJECTIVE_BANK,
  comma: COMMA_EXAMPLES,
  spelling: SPELLING_EXAMPLES,
  vocabulary: VOCABULARY,
  // Drill domains, from the registry; their own contract is in drills.test.ts.
  ...Object.fromEntries(DRILL_DOMAINS.map((d) => [`drill:${d.key}`, d.items])),
};

describe('every bank', () => {
  for (const [bank, items] of Object.entries(BANKS)) {
    it(`${bank}: every item has a niveau 1–5`, () => {
      expect(items.filter((i) => !isLevel(i.level)).map((i) => i.id)).toEqual([]);
    });
  }

  it('reports how much drafted content is still unreviewed', () => {
    const rows = Object.entries(BANKS).map(([bank, items]) => {
      const unreviewed = items.filter((i) => i.reviewed === false).length;
      const byLevel = ALL_LEVELS.map((l) => items.filter((i) => i.level === l).length).join('/');
      return `${bank.padEnd(24)} ${String(items.length).padStart(4)} items  niveau 1–5: ${byLevel.padEnd(20)} unreviewed: ${unreviewed}`;
    });
    console.info('\n' + rows.join('\n'));
  });
});

describe('nouns', () => {
  it('definite form matches gender: en-words end in -n, et-words in -t', () => {
    const bad = NOUN_BANK.filter((n) => !n.definite.endsWith(n.gender === 'en' ? 'n' : 't'));
    expect(bad.map((n) => `${n.word} (${n.gender}) → ${n.definite}`)).toEqual([]);
  });

  it('the distractor is the other gender’s suffix, never the answer', () => {
    const bad = NOUN_BANK.filter(
      (n) => n.wrongDefinite === n.definite || !n.wrongDefinite.endsWith(n.gender === 'en' ? 't' : 'n'),
    );
    expect(bad.map((n) => n.word)).toEqual([]);
  });

  it('no noun appears twice', () => {
    const words = NOUN_BANK.map((n) => n.word);
    expect(words.filter((w, i) => words.indexOf(w) !== i)).toEqual([]);
  });
});

describe('adjectives', () => {
  it('has three filled-in forms, and -t only when not marked irregular', () => {
    const bad = ADJECTIVE_BANK.filter(
      (a) => !a.base || !a.tForm || !a.eForm || (!a.irregularNote && !a.tForm.endsWith('t')),
    );
    expect(bad.map((a) => a.base)).toEqual([]);
  });

  it('no adjective appears twice', () => {
    const words = ADJECTIVE_BANK.map((a) => a.base);
    expect(words.filter((w, i) => words.indexOf(w) !== i)).toEqual([]);
  });
});

describe('verbs', () => {
  it('every verb from the imported list has a gloss and a niveau', () => {
    const served = new Set(VERB_BANK.map((v) => v.id));
    const missing = (IMPORTED_VERBS as { id: string }[]).filter((v) => !served.has(v.id));
    expect(missing.map((v) => v.id)).toEqual([]);
  });

  it('the distractor is never the real past tense', () => {
    expect(VERB_BANK.filter((v) => v.wrongPast === v.past).map((v) => v.id)).toEqual([]);
  });

  it('every gloss reads as an English infinitive', () => {
    expect(VERB_BANK.filter((v) => !/^to /.test(v.glossEn)).map((v) => `${v.id}: ${v.glossEn}`)).toEqual([]);
  });
});

describe('comma pairs', () => {
  const words = (s: string) => s.replace(/,/g, '');

  it('differ only in their commas', () => {
    const bad = COMMA_EXAMPLES.filter((e) => e.correct === e.incorrect || words(e.correct) !== words(e.incorrect));
    expect(bad.map((e) => e.id)).toEqual([]);
  });

  it('every comma rule has a pool at every niveau a learner can reach it from', () => {
    for (const rule of ALL_COMMA_RULE_IDS) {
      expect(COMMA_EXAMPLES.filter((e) => e.ruleId === rule).length, rule).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('spelling items', () => {
  it('have exactly one blank, and two different options', () => {
    const bad = SPELLING_EXAMPLES.filter(
      (e) => e.prompt.split('___').length !== 2 || e.correct === e.incorrect,
    );
    expect(bad.map((e) => e.id)).toEqual([]);
  });

  it('every spelling rule has at least two items', () => {
    for (const rule of ALL_SPELLING_RULE_IDS) {
      expect(SPELLING_EXAMPLES.filter((e) => e.ruleId === rule).length, rule).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('word-order exercises', () => {
  it('only target real rules', () => {
    const bad = EXERCISES.filter((e) => e.targets.length === 0 || e.targets.some((r) => !ALL_RULE_IDS.includes(r)));
    expect(bad.map((e) => e.id)).toEqual([]);
  });

  it('no sentence appears twice', () => {
    const key = (e: (typeof EXERCISES)[number]) => e.tokens.map((t) => t.text).join(' ');
    const keys = EXERCISES.map(key);
    expect(EXERCISES.filter((e, i) => keys.indexOf(key(e)) !== i).map((e) => e.id)).toEqual([]);
  });
});
