/**
 * PD3 reading papers (Læseforståelse 1 and 2), as data.
 *
 * One schema covers every paper since 2015, because the papers have changed
 * shape only in Læseforståelse 2, and only by swapping which tasks it holds:
 *
 *   current (from nov/dec 2022)  2A mc ×3 (A–C, 2 p) · 2B insert ×5 (A–G, 2 p) · 3 cloze ×8 (A–D, 1 p) = 39 p
 *   older   (2016 – 2022 summer) 2A mc ×7 (A–C, 2 p) · 2B cloze ×8 (A–D, 1 p)                          = 37 p
 *   oldest  (2015 nov/dec)       as `older`, but 2A has four options (A–D)                              = 37 p
 *
 * Læseforståelse 1 (15 short answers, 1 p each, 25 min) is the same in all of
 * them. So Læseforståelse 2 is a list of tasks, each one of three kinds.
 *
 * Official papers are transcribed from the learner's own copies and are kept
 * out of the repo and the app bundle (they are served from Supabase to
 * signed-in users); simulated papers are written for the app and bundled.
 */

/** A run of text inside a paragraph. `{ gap }` is a numbered hole the learner fills. */
export type Inline = string | { gap: number } | { em: string } | { strong: string };

export type Block =
  /** A heading: 2 (default) is a text's title, 3 a subheading or run-in head inside it. */
  | { t: 'h'; text: string; level?: 2 | 3 }
  | { t: 'p'; runs: Inline[] }
  | { t: 'list'; items: string[] }
  | { t: 'table'; rows: string[][]; header?: boolean }
  /** Image captions, fact boxes, bylines — small print that may still hold an answer. */
  | { t: 'small'; text: string }
  /** A removed paragraph in an insert task (2B): the learner puts one back here. */
  | { t: 'gap'; n: number };

export interface Passage {
  title: string;
  blocks: Block[];
}

export type PaperFormat = 'current' | 'older' | 'oldest';

export type PaperSource =
  | { kind: 'official'; year: number; term: 'summer' | 'winter'; label: string }
  /**
   * `level: 'exam'` papers are written to the official papers' measured
   * difficulty (npm run exam:difficulty) and held to stricter item checks;
   * the first three simulated papers predate that and are easier warm-ups.
   */
  | { kind: 'simulated'; level?: 'warmup' | 'exam' };

/** Lowest points for each grade, highest grade first: [[38, '12'], [33, '10'], …, [0, '-3']]. */
export type GradeTable = [minPoints: number, grade: string][];

export interface Lf1Question {
  n: number;
  /** The booklet's "Søg informationer under …" heading this question sits under. */
  section: string;
  prompt: string;
  /**
   * The censor booklet's guide answer, verbatim in its notation:
   * `a/b` means a and/or b, `(words)` may be included or left out.
   */
  key: string;
  /** Further answers to accept that the notation cannot express. */
  also?: string[];
  /**
   * The key words the answer differently from the text (or the answer is in
   * a picture), so the check that every key can be found in the text skips it.
   */
  paraphrased?: true;
  /** A forcensur ruling voided the question: every candidate gets the point. */
  freePoint?: true;
}

export interface Lf1 {
  theme: string;
  /** The text collection, one entry per table-of-contents heading. */
  sections: Passage[];
  questions: Lf1Question[];
}

export interface McTask {
  kind: 'mc';
  /** "2A" */
  label: string;
  title: string;
  /** Usually one text; the oldest papers set two, with questions split between them. */
  passages: Passage[];
  questions: {
    prompt: string;
    /** Index into `passages`, when there is more than one. */
    passage?: number;
    options: string[];
    /** 'A', 'B', … */
    correct: string;
    /** Letters a forcensur ruling also accepts. */
    alsoCorrect?: string[];
  }[];
  points: number;
}

export interface InsertTask {
  kind: 'insert';
  label: string;
  title: string;
  /** Contains `{ t: 'gap', n }` blocks for 1…5. */
  passage: Passage;
  inserts: { letter: string; text: string }[];
  /** correct[i] is the letter for gap i + 1. */
  correct: string[];
  points: number;
}

export interface ClozeTask {
  kind: 'cloze';
  label: string;
  title: string;
  /** Paragraph runs contain `{ gap: n }` for 1…8 (and `{ gap: 0 }` for the worked example, if any). */
  passage: Passage;
  /** gaps[i] is gap i + 1. `alsoCorrect`: letters a forcensur ruling also accepts. */
  gaps: { options: string[]; correct: string; alsoCorrect?: string[] }[];
  /** The worked example shown as gap 0. */
  example?: { options: string[]; correct: string };
  points: number;
}

export type Lf2Task = McTask | InsertTask | ClozeTask;

export interface PaperMeta {
  /** 'pd3-2023-summer', 'sim-1' */
  id: string;
  title: string;
  format: PaperFormat;
  source: PaperSource;
  lf1Theme: string;
  /** One per Læseforståelse 2 task, in order. */
  lf2Titles: string[];
  gradeTable: GradeTable;
  /** Set when the grade table is borrowed from another session of the same format. */
  gradeTableFrom?: string;
}

export interface ReadingPaper extends PaperMeta {
  lf1: Lf1;
  lf2: { tasks: Lf2Task[] };
}

export type ExamPart = 'lf1' | 'lf2';

export const PART_MINUTES: Record<ExamPart, number> = { lf1: 25, lf2: 65 };

export const PART_NAMES: Record<ExamPart, string> = {
  lf1: 'Læseforståelse 1',
  lf2: 'Læseforståelse 2',
};
