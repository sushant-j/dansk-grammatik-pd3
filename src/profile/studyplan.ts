/**
 * The exam study plan — turns "what is still open" into "what to do, and
 * whether you are on track" against a real exam date.
 *
 * The app already knows, per trainer, what a learner owns and what is still
 * open (profile/overview.ts). What it could not do was make that time-bound:
 * a gap map is useful, but "you have four weeks and eleven things not yet
 * solid, so aim for three a week" is what actually gets someone ready.
 *
 * Two honesty constraints shape this:
 *   1. "Ready" here means "solid on everything this app teaches", not a
 *      guarantee of passing a real exam — the app covers a lot of PD3 grammar
 *      but not speaking performance, task fulfilment, or the examiner's
 *      judgement. The wording never claims otherwise.
 *   2. The pace is arithmetic the learner can check, not a black box: items
 *      left to make solid, divided by weeks left. No hidden model.
 */

import type { OverviewSummary } from './overview';
import { daysUntil } from './settings';

export type Readiness = 'no-date' | 'past' | 'behind' | 'tight' | 'on-track' | 'ready';

export interface StudyPlan {
  readiness: Readiness;
  /** Whole days from `now` to the exam; negative once the date has passed. */
  daysLeft: number;
  /** daysLeft / 7, rounded up while positive; 0 once past. */
  weeksLeft: number;
  /** Items not yet solid — the real workload: open gaps plus never-seen. */
  toMakeSolid: number;
  /** Suggested items to make solid per week to finish in time (0 when none). */
  perWeek: number;
  /** Short, honest, learner-facing line. */
  message: string;
}

/**
 * @param examDateIso  the exam day as 'YYYY-MM-DD', or null when unset.
 * @param overview     the app-wide mastery roll-up.
 * @param now          epoch ms (injectable for tests).
 */
export function buildStudyPlan(
  examDateIso: string | null,
  overview: OverviewSummary,
  now = Date.now(),
): StudyPlan {
  const toMakeSolid = overview.totalAttention + overview.totalUnseen;

  if (!examDateIso) {
    return {
      readiness: 'no-date',
      daysLeft: 0,
      weeksLeft: 0,
      toMakeSolid,
      perWeek: 0,
      message: 'Set your exam date to get a paced plan for what is still open.',
    };
  }

  // Day-granularity so "exam is today" reads as 0, not a few hours — shared
  // with the settings screen's own display via daysUntil.
  const daysLeft = daysUntil(examDateIso, now);
  const weeksLeft = daysLeft > 0 ? Math.ceil(daysLeft / 7) : 0;

  if (daysLeft < 0) {
    return {
      readiness: 'past',
      daysLeft,
      weeksLeft: 0,
      toMakeSolid,
      perWeek: 0,
      message: 'That exam date has passed. Set your next one to plan again.',
    };
  }

  if (toMakeSolid === 0) {
    return {
      readiness: 'ready',
      daysLeft,
      weeksLeft,
      toMakeSolid: 0,
      perWeek: 0,
      message:
        daysLeft === 0
          ? 'Everything this app tracks is solid. Rest well before the exam.'
          : `Everything this app tracks is solid, with ${daysLeft} ${
              daysLeft === 1 ? 'day' : 'days'
            } to spare. Keep the shaky ones warm.`,
    };
  }

  // Pace: how many items must go solid per week to finish in time. Guard the
  // last week so weeksLeft is at least 1 when the exam is still ahead.
  const perWeek = Math.ceil(toMakeSolid / Math.max(1, weeksLeft));

  // Readiness bands, from the pace the remaining time demands:
  //   past-tense/impossible pacing → behind; steep → tight; gentle → on-track.
  let readiness: Readiness;
  if (daysLeft <= 3 && toMakeSolid > 3) readiness = 'behind';
  else if (perWeek >= 6) readiness = 'behind';
  else if (perWeek >= 3) readiness = 'tight';
  else readiness = 'on-track';

  const workLabel = `${toMakeSolid} ${toMakeSolid === 1 ? 'thing' : 'things'} still to make solid`;
  const dayLabel = `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`;
  const message =
    readiness === 'behind'
      ? `${workLabel}, ${dayLabel} — that is a hard pace. Focus your widest gaps first; some ground may have to wait.`
      : readiness === 'tight'
        ? `${workLabel}, ${dayLabel}. About ${perWeek} a week gets you there — doable if you keep at it.`
        : `${workLabel}, ${dayLabel}. Roughly ${perWeek} a week and you arrive with room to spare.`;

  return { readiness, daysLeft, weeksLeft, toMakeSolid, perWeek, message };
}
