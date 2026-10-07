import { describe, expect, it } from 'vitest';
import { lessonById, unitById } from './curriculum';
import { eligibleItems } from './questions';
import {
  CHECKPOINT_SIZE,
  LESSON_SIZE,
  REPAIR_SIZE,
  passMark,
  planSession,
  reviewSources,
  sessionPassed,
  starsFor,
} from './session';

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

describe('pass marks and stars', () => {
  it('passes a lesson at 6 of 8 and a checkpoint at 10 of 12', () => {
    expect(passMark(8, 0.75)).toBe(6);
    expect(passMark(12, 0.8)).toBe(10);
    expect(sessionPassed('lesson', 5, 8)).toBe(false);
    expect(sessionPassed('lesson', 6, 8)).toBe(true);
    expect(sessionPassed('checkpoint', 9, 12)).toBe(false);
    expect(sessionPassed('checkpoint', 10, 12)).toBe(true);
  });

  it('gives one star for a pass, two for 7, three for 8', () => {
    expect([5, 6, 7, 8].map((n) => starsFor(n, 8))).toEqual([0, 1, 2, 3]);
  });
});

describe('planSession', () => {
  it('asks a lesson 6 on its rule and 2 reviews of what it builds on, never first', () => {
    const slots = planSession('vt-past-vs-perfect', 'lesson', seeded(1));
    expect(slots).toHaveLength(LESSON_SIZE);
    expect(slots.filter((s) => !s.review).every((s) => s.ruleId === 'vt-past-vs-perfect')).toBe(true);
    const reviews = slots.filter((s) => s.review);
    expect(reviews).toHaveLength(2);
    expect(reviews.every((s) => s.ruleId === 'vt-verb-forms')).toBe(true);
    expect(slots[0].review).toBe(false);
  });

  it('reviews the previous lesson in the unit when a lesson requires nothing', () => {
    const lesson = lessonById('forfelt-single')!;
    expect(lesson.requires).toEqual([]);
    expect(reviewSources(lesson)).toEqual(['v2-inversion']);
  });

  it('asks only the lesson rule when there is nothing to review', () => {
    const first = lessonById('subject-required')!;
    expect(reviewSources(first)).toEqual([]);
    const slots = planSession(first.id, 'lesson', seeded(2));
    expect(slots).toHaveLength(LESSON_SIZE);
    expect(slots.every((s) => s.ruleId === first.id && !s.review)).toBe(true);
  });

  it('spreads a checkpoint over every rule in the unit', () => {
    const unit = unitById('w2-verbs')!;
    const slots = planSession(unit.checkpointId, 'checkpoint', seeded(3));
    expect(slots).toHaveLength(CHECKPOINT_SIZE);
    const asked = new Set(slots.map((s) => s.ruleId));
    expect([...asked].sort()).toEqual(unit.lessons.map((l) => l.id).sort());
    const counts = [...asked].map((id) => slots.filter((s) => s.ruleId === id).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it('asks a repair 5 questions on the cracked rule', () => {
    const slots = planSession('silent-d', 'repair');
    expect(slots).toHaveLength(REPAIR_SIZE);
    expect(slots.every((s) => s.ruleId === 'silent-d')).toBe(true);
  });

  it('plans nothing for an unknown node', () => {
    expect(planSession('nope', 'lesson')).toEqual([]);
    expect(planSession('cp-nope', 'checkpoint')).toEqual([]);
  });
});

describe('eligibleItems', () => {
  const items = [
    { id: 'a', level: 1 as const },
    { id: 'b', level: 1 as const },
    { id: 'c', level: 2 as const },
    { id: 'd', level: 3 as const },
  ];
  it('uses up the niveau before reaching higher', () => {
    expect(eligibleItems(items, 1, new Set()).map((i) => i.id)).toEqual(['a', 'b']);
    expect(eligibleItems(items, 1, new Set(['a', 'b'])).map((i) => i.id)).toEqual(['c']);
    expect(eligibleItems(items, 1, new Set(['a', 'b', 'c'])).map((i) => i.id)).toEqual(['d']);
  });
  it('repeats the niveau once everything has been asked', () => {
    expect(eligibleItems(items, 1, new Set(['a', 'b', 'c', 'd'])).map((i) => i.id)).toEqual(['a', 'b']);
  });
  it('starts at the easiest items when a rule has nothing that easy', () => {
    expect(eligibleItems(items.slice(2), 1, new Set()).map((i) => i.id)).toEqual(['c']);
  });
});
