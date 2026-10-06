import { describe, expect, it } from 'vitest';
import { applyOutcome, EMPTY_STAT, type ItemStat } from '../profile/mastery';
import { fixtureDomain, fixtureItem } from '../test/drillFixture';
import {
  buildDrillQuestion,
  drillRuleProgress,
  nextDrillQuestion,
  NO_WORD,
  optionLabel,
  splitPrompt,
  summarizeDrill,
} from './drillExercise';

const NOW = 1_700_000_000_000;

function strong(): ItemStat {
  let s = { ...EMPTY_STAT };
  for (let i = 0; i < 8; i++) s = applyOutcome(s, true, NOW);
  return s;
}

/** A deterministic rng, so picks are reproducible. */
function seeded(seed = 1): () => number {
  let x = seed;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

describe('buildDrillQuestion', () => {
  it('keeps every option and points correctIndex at the answer', () => {
    const item = fixtureItem('vt-x-1', 'vt-x', 1, ['har', 'havde', 'har haft', 'havde haft']);
    for (let seed = 1; seed < 20; seed++) {
      const q = buildDrillQuestion(item, seeded(seed));
      expect([...q.options].sort()).toEqual([...item.options].sort());
      expect(q.options[q.correctIndex]).toBe(item.answer);
      expect(q.ruleId).toBe('vt-x');
    }
  });
});

describe('the "no word" option', () => {
  it('reads as "no word" on its button, and other options as themselves', () => {
    expect(optionLabel(NO_WORD)).toBe('— (no word)');
    expect(optionLabel('at')).toBe('at');
  });

  it('splits around the gap with the spaces kept, before an answer', () => {
    expect(splitPrompt('Hun er ___ lærer.')).toEqual({ before: 'Hun er ', after: ' lærer.' });
  });

  it('closes the gap to a single space when filled with no word', () => {
    const { before, after } = splitPrompt('Hun er ___ lærer.', NO_WORD);
    expect(before + after).toBe('Hun er lærer.');
  });

  it('leaves no space before punctuation, and recapitalises a sentence that began with the gap', () => {
    const end = splitPrompt('Vi skal ud ___.', NO_WORD);
    expect(end.before + end.after).toBe('Vi skal ud.');
    const start = splitPrompt('___ børn leger i haven.', NO_WORD);
    expect(start.before + start.after).toBe('Børn leger i haven.');
  });
});

describe('drillRuleProgress / summarizeDrill', () => {
  it('has one row per topic and counts solid topics', () => {
    const d = fixtureDomain({ 'vt-a': [1, 1], 'vt-b': [1, 1], 'vt-c': [1, 1] });
    expect(drillRuleProgress(d, {}, NOW)).toHaveLength(3);
    const s = summarizeDrill(d, { 'vt-b': strong() }, NOW);
    expect(s.solid).toBe(1);
    expect(s.total).toBe(3);
    expect(s.weakest?.id).not.toBe('vt-b');
  });
});

describe('nextDrillQuestion', () => {
  it('with a topic, serves only that topic', () => {
    const d = fixtureDomain({ 'vt-a': [1, 1, 1], 'vt-b': [1, 1, 1] });
    const rng = seeded(3);
    for (let i = 0; i < 30; i++) {
      expect(nextDrillQuestion(d, {}, undefined, NOW, 5, { topicId: 'vt-b', rng })?.ruleId).toBe('vt-b');
    }
  });

  it('never serves above the learner’s niveau', () => {
    const d = fixtureDomain({ 'vt-a': [1, 2, 3, 4, 5] });
    const rng = seeded(5);
    for (let i = 0; i < 50; i++) {
      expect(nextDrillQuestion(d, {}, undefined, NOW, 2, { rng })!.item.level).toBeLessThanOrEqual(2);
    }
  });

  it('falls back to the easiest items when a topic has nothing at the niveau', () => {
    const d = fixtureDomain({ 'vt-a': [3, 3, 4] });
    expect(nextDrillQuestion(d, {}, undefined, NOW, 1, { rng: seeded(2) })!.item.level).toBe(3);
  });

  it('never repeats the item just answered', () => {
    // Niveau 2 has a single item, so the 70% "at niveau" slice is only the
    // last item: the pick must widen rather than repeat it.
    const d = fixtureDomain({ 'vt-a': [1, 1, 2] });
    const rng = seeded(7);
    for (let i = 0; i < 60; i++) {
      for (const last of ['vt-a-1', 'vt-a-2', 'vt-a-3']) {
        expect(nextDrillQuestion(d, {}, last, NOW, 2, { rng })!.item.id).not.toBe(last);
      }
    }
  });

  it('mixed practice serves the weakest topic first', () => {
    const d = fixtureDomain({ 'vt-a': [1, 1], 'vt-b': [1, 1], 'vt-c': [1, 1] });
    const stats = { 'vt-a': strong(), 'vt-c': strong() };
    const rng = seeded(11);
    for (let i = 0; i < 30; i++) {
      expect(nextDrillQuestion(d, stats, undefined, NOW, 5, { rng })!.ruleId).toBe('vt-b');
    }
  });

  it('skips topics that have no items, and returns null when nothing is servable', () => {
    const d = fixtureDomain({ 'vt-a': [1, 1], 'vt-empty': [] });
    const rng = seeded(13);
    for (let i = 0; i < 20; i++) expect(nextDrillQuestion(d, {}, undefined, NOW, 5, { rng })!.ruleId).toBe('vt-a');
    expect(nextDrillQuestion(d, {}, undefined, NOW, 5, { topicId: 'vt-empty' })).toBeNull();
    expect(nextDrillQuestion(fixtureDomain({}), {}, undefined, NOW, 5)).toBeNull();
  });
});
