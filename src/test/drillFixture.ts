/**
 * A small made-up drill domain for logic tests, so they never depend on the
 * real content bank (which is written separately and changes size).
 */

import type { Level } from '../content/levels';
import type { DrillDomain, DrillDomainKey, DrillItem, DrillRule } from '../drills/registry';

export function fixtureRule(id: string, level: Level = 1): DrillRule {
  return {
    id,
    da: `${id} (da)`,
    en: `${id} (en)`,
    statement: 'A rule.',
    explanation: 'Why the rule holds.',
    examples: [
      { wrong: 'Forkert.', right: 'Rigtigt.', note: 'Note.' },
      { right: 'Også rigtigt.', note: 'Note.' },
    ],
    level,
  };
}

export function fixtureItem(id: string, ruleId: string, level: Level, options = ['var', 'blev']): DrillItem {
  return {
    id,
    level,
    ruleId,
    prompt: 'Det ___ koldt i går.',
    options,
    answer: options[0],
    explanation: 'Because.',
    reviewed: false,
  };
}

/**
 * `topics` maps a topic id to the niveaus of its items, one item per entry:
 * { 'vt-a': [1, 1, 2] } is a topic with two niveau-1 items and one niveau-2.
 * Item ids are `<topic>-<n>`.
 */
export function fixtureDomain(
  topics: Record<string, Level[]>,
  key: DrillDomainKey = 'verb-tenses',
): DrillDomain {
  const rules = Object.keys(topics).map((id) => fixtureRule(id));
  const items = Object.entries(topics).flatMap(([ruleId, levels]) =>
    levels.map((level, n) => fixtureItem(`${ruleId}-${n + 1}`, ruleId, level)),
  );
  return { key, label: 'Fixture', group: 'Verbs', blurb: 'Test.', prefix: 'vt-', rules, items };
}
