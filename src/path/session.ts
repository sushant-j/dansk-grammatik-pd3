/**
 * What a path session asks, and what counts as passing it.
 *
 *   - Lesson: 8 questions, 6 on the lesson's rule and 2 reviewing what it
 *     builds on (its `requires`, else the lesson before it in the unit). The
 *     review questions are where "builds on" is something you do, not a line
 *     on a map. Pass with 6; 7 and 8 earn the second and third star.
 *   - Checkpoint: 12 questions spread over the unit's rules. Pass with 10.
 *     Taken before the lessons it is a test-out: passing skips the unit.
 *   - Repair: 5 questions on a cracked lesson's rule. It writes no path result;
 *     the answers rebuild mastery, and the crack clears when mastery has.
 */

import { lessonById, unitById, unitForCheckpoint, type PathLesson } from './curriculum';

export type SessionMode = 'lesson' | 'checkpoint' | 'repair';

export const LESSON_SIZE = 8;
export const LESSON_REVIEW = 2;
export const CHECKPOINT_SIZE = 12;
export const REPAIR_SIZE = 5;

/** Share right needed: 6 of 8, 10 of 12. */
export const LESSON_PASS_SHARE = 0.75;
export const CHECKPOINT_PASS_SHARE = 0.8;

export function passMark(total: number, share: number): number {
  return Math.ceil(total * share - 1e-9);
}

/** Lesson stars: a pass is one, each miss fewer than the pass allows is another, up to three. */
export function starsFor(best: number, total: number): number {
  const mark = passMark(total, LESSON_PASS_SHARE);
  if (best < mark) return 0;
  return Math.min(3, 1 + (best - mark));
}

export interface SessionSlot {
  ruleId: string;
  /** A question on an earlier rule, not the one being learnt. */
  review: boolean;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** The rules a lesson reviews: what it requires, else the lesson before it in its unit. */
export function reviewSources(lesson: PathLesson): string[] {
  if (lesson.requires.length) return lesson.requires;
  const unit = unitById(lesson.unitId);
  const i = unit ? unit.lessons.findIndex((l) => l.id === lesson.id) : -1;
  return i > 0 && unit ? [unit.lessons[i - 1].id] : [];
}

/** The questions a session asks, by rule, in order. Empty for an unknown node. */
export function planSession(nodeId: string, mode: SessionMode, rng: () => number = Math.random): SessionSlot[] {
  if (mode === 'checkpoint') {
    const unit = unitForCheckpoint(nodeId);
    if (!unit) return [];
    // Round-robin over the unit's rules in a shuffled order, so every rule is
    // asked at least once and none more than once over its share.
    const order = shuffle(unit.lessons.map((l) => l.id), rng);
    const slots = Array.from({ length: CHECKPOINT_SIZE }, (_, i) => ({ ruleId: order[i % order.length], review: false }));
    return shuffle(slots, rng);
  }

  const lesson = lessonById(nodeId);
  if (!lesson) return [];
  if (mode === 'repair') return Array.from({ length: REPAIR_SIZE }, () => ({ ruleId: lesson.id, review: false }));

  const sources = reviewSources(lesson);
  const reviews = sources.length ? LESSON_REVIEW : 0;
  const slots: SessionSlot[] = Array.from({ length: LESSON_SIZE - reviews }, () => ({ ruleId: lesson.id, review: false }));
  // Reviews go in at fixed points — never first, so the lesson opens on its
  // own rule, and spread out so they read as reminders, not a second topic.
  const at = [3, 6];
  for (let k = 0; k < reviews; k++) {
    slots.splice(at[k], 0, { ruleId: sources[Math.floor(rng() * sources.length)], review: true });
  }
  return slots;
}

/** Whether a finished session passed: lessons and checkpoints have their own marks. */
export function sessionPassed(mode: SessionMode, right: number, total: number): boolean {
  if (mode === 'repair') return right >= passMark(total, LESSON_PASS_SHARE);
  return right >= passMark(total, mode === 'checkpoint' ? CHECKPOINT_PASS_SHARE : LESSON_PASS_SHARE);
}
