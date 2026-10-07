/**
 * Where a learner stands on the path, derived from their results.
 *
 * Pure: it takes the best score per node (folded from the progress log by
 * replay) and a way to read a rule's mastery, and works out every node's
 * state. Nothing about the path is stored except those results — locks,
 * stars, "tested out" and cracks are all recomputed, so changing the unlock
 * rules later never strands anyone.
 */

import { progressFor, type ItemStat } from '../profile/mastery';
import type { PathResult } from '../sync/types';
import { ALL_LESSONS, WORLDS, lessonById, type PathLesson, type PathUnit } from './curriculum';
import { CHECKPOINT_PASS_SHARE, LESSON_PASS_SHARE, passMark, starsFor } from './session';

export type { PathResult };

export type PathResults = Record<string, PathResult>;

export type NodeStatus = 'locked' | 'available' | 'passed' | 'testedOut';

export interface LessonState {
  status: NodeStatus;
  /** 0–3. A tested-out lesson counts one star until it is played. */
  stars: number;
  /** Passed, but the rule's mastery has faded since: a quick repair is due. */
  cracked: boolean;
  /** The lessons still blocking this one, when locked by them. */
  waitingFor: string[];
  best: PathResult | null;
}

export interface CheckpointState {
  status: Exclude<NodeStatus, 'testedOut'>;
  /** Every lesson in the unit is done: this is the unit's final check, not a test-out. */
  ready: boolean;
  best: PathResult | null;
}

export interface UnitState {
  unit: PathUnit;
  open: boolean;
  /** Lessons passed or tested out. */
  done: number;
  complete: boolean;
  testedOut: boolean;
}

export interface WorldState {
  open: boolean;
  complete: boolean;
  lessonsDone: number;
  lessonsTotal: number;
  checkpointsDone: number;
  checkpointsTotal: number;
}

export interface PathState {
  lessons: Record<string, LessonState>;
  checkpoints: Record<string, CheckpointState>;
  units: Record<string, UnitState>;
  worlds: WorldState[];
  /** The world the learner is working in: the last open one. */
  currentWorld: number;
  lessonsDone: number;
  lessonsTotal: number;
  stars: number;
  maxStars: number;
  cracked: number;
  /** The first available lesson in path order, if any: "next up". */
  nextLessonId: string | null;
}

/** Reads a rule's mastery stat; undefined when the rule was never answered. */
export type MasteryLookup = (lesson: PathLesson) => ItemStat | undefined;

export function resultPassed(r: PathResult | undefined, share: number): boolean {
  return !!r && r.total > 0 && r.best >= passMark(r.total, share);
}

export function pathState(results: PathResults, mastery: MasteryLookup, now = Date.now()): PathState {
  const lessons: Record<string, LessonState> = {};
  const checkpoints: Record<string, CheckpointState> = {};
  const units: Record<string, UnitState> = {};
  const worlds: WorldState[] = [];

  const lessonDone = (id: string) => {
    const s = lessons[id];
    return !!s && (s.status === 'passed' || s.status === 'testedOut');
  };

  let worldOpen = true;
  for (const world of WORLDS) {
    const ws: WorldState = {
      open: worldOpen,
      complete: false,
      lessonsDone: 0,
      lessonsTotal: 0,
      checkpointsDone: 0,
      checkpointsTotal: world.units.length,
    };

    for (const unit of world.units) {
      const cpResult = results[unit.checkpointId];
      const cpPassed = resultPassed(cpResult, CHECKPOINT_PASS_SHARE);
      let done = 0;
      let prevDone = true;

      for (const lesson of unit.lessons) {
        const result = results[lesson.id];
        const passed = resultPassed(result, LESSON_PASS_SHARE);
        const waitingFor = [
          ...(prevDone ? [] : [unit.lessons[unit.lessons.indexOf(lesson) - 1].id]),
          ...lesson.requires.filter((id) => !lessonDone(id)),
        ];

        let status: NodeStatus;
        if (passed) status = 'passed';
        else if (cpPassed) status = 'testedOut';
        else if (worldOpen && waitingFor.length === 0) status = 'available';
        else status = 'locked';

        const isDone = status === 'passed' || status === 'testedOut';
        const stat = isDone ? mastery(lesson) : undefined;
        lessons[lesson.id] = {
          status,
          stars: status === 'passed' && result ? starsFor(result.best, result.total) : status === 'testedOut' ? 1 : 0,
          cracked: !!stat && progressFor(lesson.id, stat, now).needsRefresh,
          waitingFor: status === 'locked' ? waitingFor : [],
          best: result ?? null,
        };
        if (isDone) done += 1;
        prevDone = isDone;
      }

      checkpoints[unit.checkpointId] = {
        status: cpPassed ? 'passed' : worldOpen ? 'available' : 'locked',
        ready: done === unit.lessons.length,
        best: cpResult ?? null,
      };
      units[unit.id] = {
        unit,
        open: worldOpen,
        done,
        complete: cpPassed,
        testedOut: cpPassed && unit.lessons.some((l) => lessons[l.id].status === 'testedOut'),
      };
      ws.lessonsDone += done;
      ws.lessonsTotal += unit.lessons.length;
      if (cpPassed) ws.checkpointsDone += 1;
    }

    ws.complete = ws.checkpointsDone === ws.checkpointsTotal;
    worlds.push(ws);
    worldOpen = worldOpen && ws.complete;
  }

  const lessonStates = ALL_LESSONS.map((l) => lessons[l.id]);
  const lastOpen = worlds.reduce((last, w, i) => (w.open ? i : last), 0);
  return {
    lessons,
    checkpoints,
    units,
    worlds,
    currentWorld: lastOpen,
    lessonsDone: lessonStates.filter((s) => s.status === 'passed' || s.status === 'testedOut').length,
    lessonsTotal: ALL_LESSONS.length,
    stars: lessonStates.reduce((n, s) => n + s.stars, 0),
    maxStars: ALL_LESSONS.length * 3,
    cracked: lessonStates.filter((s) => s.cracked).length,
    nextLessonId: ALL_LESSONS.find((l) => lessons[l.id].status === 'available')?.id ?? null,
  };
}

/** Lesson names a locked lesson waits on, for "Needs: …" captions. */
export function waitingNames(state: LessonState): string[] {
  return state.waitingFor.map((id) => lessonById(id)?.rule.da ?? id);
}

