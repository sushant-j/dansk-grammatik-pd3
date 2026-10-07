import { describe, expect, it } from 'vitest';
import { applyOutcome, EMPTY_STAT, type ItemStat } from '../profile/mastery';
import { ALL_LESSONS, WORLDS, unitById } from './curriculum';
import { pathState, type MasteryLookup, type PathResult, type PathResults } from './progress';

const NOW = Date.parse('2026-10-07T10:00:00Z');
const DAY = 86_400_000;

const result = (best: number, total = 8): PathResult => ({ best, total, passes: 1, attempts: 1, lastAt: NOW });
const noMastery: MasteryLookup = () => undefined;

/** Pass every lesson and checkpoint in a world. */
function passWorld(results: PathResults, worldIndex: number): void {
  for (const unit of WORLDS[worldIndex].units) {
    for (const l of unit.lessons) results[l.id] = result(8);
    results[unit.checkpointId] = result(12, 12);
  }
}

describe('pathState', () => {
  it('opens only the first lesson of each unit in world 1 for a new learner', () => {
    const s = pathState({}, noMastery, NOW);
    for (const unit of WORLDS[0].units) {
      expect(s.lessons[unit.lessons[0].id].status).toBe('available');
      for (const l of unit.lessons.slice(1)) expect(s.lessons[l.id].status).toBe('locked');
      expect(s.checkpoints[unit.checkpointId].status).toBe('available');
      expect(s.checkpoints[unit.checkpointId].ready).toBe(false);
    }
    for (const l of ALL_LESSONS.filter((x) => x.worldIndex > 0)) expect(s.lessons[l.id].status).toBe('locked');
    expect(s.currentWorld).toBe(0);
    expect(s.nextLessonId).toBe(ALL_LESSONS[0].id);
    expect(s.lessonsDone).toBe(0);
    expect(s.maxStars).toBe(ALL_LESSONS.length * 3);
  });

  it('opens the next lesson in a unit once the previous one passes', () => {
    const s = pathState({ 'subject-required': result(6) }, noMastery, NOW);
    expect(s.lessons['subject-required']).toMatchObject({ status: 'passed', stars: 1 });
    expect(s.lessons['present-tense-r'].status).toBe('available');
  });

  it('does not count a failed lesson', () => {
    const s = pathState({ 'subject-required': result(5) }, noMastery, NOW);
    expect(s.lessons['subject-required'].status).toBe('available');
    expect(s.lessons['present-tense-r'].status).toBe('locked');
  });

  it('keeps the next world locked until every checkpoint in this one passes', () => {
    const results: PathResults = {};
    passWorld(results, 0);
    const lastCp = WORLDS[0].units[WORLDS[0].units.length - 1].checkpointId;
    delete results[lastCp];
    let s = pathState(results, noMastery, NOW);
    expect(s.worlds[1].open).toBe(false);
    expect(s.checkpoints[lastCp].ready).toBe(true);

    results[lastCp] = result(10, 12);
    s = pathState(results, noMastery, NOW);
    expect(s.worlds[0].complete).toBe(true);
    expect(s.worlds[1].open).toBe(true);
    expect(s.currentWorld).toBe(1);
    expect(s.lessons['v2-inversion'].status).toBe('available');
  });

  it('tests a whole unit out with its checkpoint, worth one star a lesson', () => {
    const unit = unitById('w1-nouns')!;
    const s = pathState({ [unit.checkpointId]: result(11, 12) }, noMastery, NOW);
    for (const l of unit.lessons) expect(s.lessons[l.id]).toMatchObject({ status: 'testedOut', stars: 1 });
    expect(s.units[unit.id]).toMatchObject({ complete: true, testedOut: true, done: unit.lessons.length });
  });

  it('holds a lesson back until what it builds on is done, even across units', () => {
    const results: PathResults = {};
    passWorld(results, 0);
    // In world 2, adjective-neuter-form needs en-et-gender (done in world 1): open.
    let s = pathState(results, noMastery, NOW);
    expect(s.lessons['adjective-neuter-form'].status).toBe('available');

    // In world 3, cj-der-som builds on relative-clause from another unit.
    passWorld(results, 1);
    for (const id of ['pr-man-en-sig', 'pr-hans-sin', 'cj-for-fordi']) results[id] = result(8);
    s = pathState(results, noMastery, NOW);
    expect(s.lessons['cj-der-som']).toMatchObject({ status: 'locked', waitingFor: ['relative-clause'] });
    for (const id of ['ikke-regel', 'verb-cluster-order', 'relative-clause']) results[id] = result(8);
    s = pathState(results, noMastery, NOW);
    expect(s.lessons['cj-der-som'].status).toBe('available');
  });

  it('counts stars from the best score', () => {
    const s = pathState({ 'subject-required': result(8), 'present-tense-r': result(7) }, noMastery, NOW);
    expect(s.lessons['subject-required'].stars).toBe(3);
    expect(s.lessons['present-tense-r'].stars).toBe(2);
    expect(s.stars).toBe(5);
  });

  it('cracks a passed lesson whose mastery has faded, and only that', () => {
    let strong: ItemStat = { ...EMPTY_STAT };
    for (let i = 0; i < 6; i++) strong = applyOutcome(strong, true, NOW - 40 * DAY);
    const mastery: MasteryLookup = (l) => (l.id === 'subject-required' || l.id === 'en-et-gender' ? strong : undefined);
    const s = pathState({ 'subject-required': result(8) }, mastery, NOW);
    expect(s.lessons['subject-required'].cracked).toBe(true);
    // Faded too, but never passed on the path: nothing to repair.
    expect(s.lessons['en-et-gender'].cracked).toBe(false);
    expect(s.cracked).toBe(1);

    const fresh = pathState({ 'subject-required': result(8) }, () => strong, NOW - 40 * DAY);
    expect(fresh.lessons['subject-required'].cracked).toBe(false);
  });
});
