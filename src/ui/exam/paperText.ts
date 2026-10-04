import type { PaperMeta } from '../../content/exams/types';

/** One line on what kind of paper this is, for the list and the paper screen. */
export function formatNote(paper: Pick<PaperMeta, 'format' | 'source'>): string {
  if (paper.source.kind === 'simulated') return 'Simulated paper — written for practice in today’s format, not an official paper.';
  if (paper.format === 'current') return 'Official paper in today’s format (39 points).';
  return 'Official paper in the format used before November 2022 (37 points). Læseforståelse 1 is the same as today; Læseforståelse 2 had a longer 2A and its 2B was the gap text that is now Delprøve 3.';
}
