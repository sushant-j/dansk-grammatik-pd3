/**
 * The content contract for every grammar-drill domain (src/content/drills/).
 *
 * The drill JSON is drafted in bulk, separately from the engine that serves
 * it, so this is what holds the two together: anything that would crash the
 * trainer (an item pointing at a missing topic, an answer not among its
 * options, a prompt with no gap) or quietly teach badly (a topic too thin to
 * practise, a duplicate option) fails here. It can't judge the Danish — that
 * is what `reviewed: false` and proofreading are for.
 *
 * A domain with no topics yet is skipped: it is a stub awaiting content.
 */

import { describe, expect, it } from 'vitest';
import { DRILL_DOMAINS, isDrillDomainLive } from '../drills/registry';
import { GAP, NO_WORD } from '../drills/drillExercise';
import { isLevel } from './levels';

/** Each topic needs enough items to drill without repeating, spread over more than one niveau. */
const MIN_ITEMS_PER_TOPIC = 20;
const MIN_LEVELS_PER_TOPIC = 2;

const nonEmpty = (s: unknown) => typeof s === 'string' && s.trim().length > 0;

describe('drill registry', () => {
  it('every domain has a unique key and prefix', () => {
    const keys = DRILL_DOMAINS.map((d) => d.key);
    const prefixes = DRILL_DOMAINS.map((d) => d.prefix);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(prefixes).size).toBe(prefixes.length);
    for (const p of prefixes) expect(p).toMatch(/^[a-z]{2}-$/);
  });

  it('rule and item ids are unique across all domains', () => {
    const ids = DRILL_DOMAINS.flatMap((d) => [...d.rules.map((r) => r.id), ...d.items.map((i) => i.id)]);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('no domain has items without topics', () => {
    expect(DRILL_DOMAINS.filter((d) => d.rules.length === 0 && d.items.length > 0).map((d) => d.key)).toEqual([]);
  });
});

for (const domain of DRILL_DOMAINS.filter(isDrillDomainLive)) {
  describe(`drill domain ${domain.key}`, () => {
    const ruleIds = new Set(domain.rules.map((r) => r.id));

    it('topics have every rule-card field, in English, with at least two examples', () => {
      const bad = domain.rules.filter(
        (r) =>
          ![r.id, r.da, r.en, r.statement, r.explanation].every(nonEmpty) ||
          !isLevel(r.level) ||
          !Array.isArray(r.examples) ||
          r.examples.length < 2 ||
          r.examples.some((ex) => !nonEmpty(ex.right) || !nonEmpty(ex.note)),
      );
      expect(bad.map((r) => r.id)).toEqual([]);
    });

    it(`ids start with "${domain.prefix}" and are unique`, () => {
      const ids = [...domain.rules.map((r) => r.id), ...domain.items.map((i) => i.id)];
      expect(ids.filter((id) => !id.startsWith(domain.prefix))).toEqual([]);
      expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    });

    it('every item points at a topic in this domain', () => {
      expect(domain.items.filter((i) => !ruleIds.has(i.ruleId)).map((i) => i.id)).toEqual([]);
    });

    it('every prompt has exactly one gap', () => {
      expect(domain.items.filter((i) => i.prompt.split(GAP).length !== 2).map((i) => i.id)).toEqual([]);
    });

    it('2–6 distinct options, the answer among them', () => {
      const bad = domain.items.filter(
        (i) =>
          !Array.isArray(i.options) ||
          i.options.length < 2 ||
          i.options.length > 6 ||
          new Set(i.options).size !== i.options.length ||
          !i.options.includes(i.answer) ||
          i.options.some((o) => !nonEmpty(o)),
      );
      expect(bad.map((i) => i.id)).toEqual([]);
    });

    it('"no word" is written exactly as the engine expects', () => {
      // Near-misses of "(ingen)" would show on a button as the literal text.
      const bad = domain.items.filter((i) => i.options.some((o) => /ingen\)|\(ingen|^-$|^—$|^∅$/i.test(o) && o !== NO_WORD));
      expect(bad.map((i) => i.id)).toEqual([]);
    });

    it('niveau 1–5, an English explanation, and reviewed: false', () => {
      const bad = domain.items.filter((i) => !isLevel(i.level) || !nonEmpty(i.explanation) || i.reviewed !== false);
      expect(bad.map((i) => i.id)).toEqual([]);
    });

    it(`every topic has at least ${MIN_ITEMS_PER_TOPIC} items over at least ${MIN_LEVELS_PER_TOPIC} niveaus`, () => {
      const thin = domain.rules.flatMap((r) => {
        const items = domain.items.filter((i) => i.ruleId === r.id);
        const levels = new Set(items.map((i) => i.level)).size;
        return items.length >= MIN_ITEMS_PER_TOPIC && levels >= MIN_LEVELS_PER_TOPIC
          ? []
          : [`${r.id}: ${items.length} items, ${levels} niveaus`];
      });
      expect(thin).toEqual([]);
    });
  });
}
