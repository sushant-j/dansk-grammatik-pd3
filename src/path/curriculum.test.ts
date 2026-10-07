import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, ALL_NODE_IDS, ALL_UNITS, WORLDS, worldTitle } from './curriculum';
import { nextPathQuestion, storedItemCount } from './questions';
import { ALL_INDEXED_RULES } from './ruleIndex';
import { LESSON_SIZE } from './session';

describe('rule index', () => {
  it('has unique rule ids across every family, since a lesson id is a rule id', () => {
    const ids = ALL_INDEXED_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('curriculum', () => {
  it('puts every rule in the app on the path exactly once', () => {
    const onPath = ALL_LESSONS.map((l) => l.id);
    expect(new Set(onPath).size).toBe(onPath.length);
    expect([...onPath].sort()).toEqual(ALL_INDEXED_RULES.map((r) => r.id).sort());
  });

  it('only builds on lessons that come earlier on the path', () => {
    const position = new Map(ALL_LESSONS.map((l, i) => [l.id, i]));
    for (const lesson of ALL_LESSONS) {
      for (const req of lesson.requires) {
        expect(position.has(req), `${lesson.id} requires unknown ${req}`).toBe(true);
        expect(position.get(req)!, `${lesson.id} requires later ${req}`).toBeLessThan(position.get(lesson.id)!);
      }
    }
  });

  it('never builds on a later world', () => {
    const world = new Map(ALL_LESSONS.map((l) => [l.id, l.worldIndex]));
    for (const lesson of ALL_LESSONS) {
      for (const req of lesson.requires) expect(world.get(req)!).toBeLessThanOrEqual(lesson.worldIndex);
    }
  });

  it('keeps units between 2 and 8 lessons, so every checkpoint mixes rules', () => {
    for (const unit of ALL_UNITS) {
      expect(unit.lessons.length, unit.id).toBeGreaterThanOrEqual(2);
      expect(unit.lessons.length, unit.id).toBeLessThanOrEqual(8);
    }
  });

  it('has unique node ids for lessons and checkpoints', () => {
    expect(new Set(ALL_NODE_IDS).size).toBe(ALL_NODE_IDS.length);
    expect(new Set(ALL_UNITS.map((u) => u.id)).size).toBe(ALL_UNITS.length);
  });

  it('climbs: world niveaus never go down', () => {
    for (let i = 1; i < WORLDS.length; i++) expect(WORLDS[i].level).toBeGreaterThanOrEqual(WORLDS[i - 1].level);
    expect(worldTitle(WORLDS[0])).toBe('Niveau 1 · Begynder');
    expect(worldTitle(WORLDS[WORLDS.length - 1])).toBe('Niveau 4–5 · Øvet / PD3');
  });

  it('can fill a lesson with different questions for every rule at its world niveau', () => {
    for (const lesson of ALL_LESSONS) {
      const level = WORLDS[lesson.worldIndex].level;
      const stored = storedItemCount(lesson.id, level);
      if (stored !== null) {
        expect(stored, `${lesson.id} at niveau ${level}`).toBeGreaterThanOrEqual(LESSON_SIZE);
      } else {
        expect(nextPathQuestion(lesson.id, level, new Set()), lesson.id).not.toBeNull();
      }
    }
  });
});
