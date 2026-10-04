import type { ClauseType, FieldId } from './fields';
import type { Level } from '../content/levels';
import type { Exam, RuleId } from './rules';

/** One draggable word (or fixed multi-word constituent) in an exercise. */
export interface Token {
  id: string;
  text: string;
  /**
   * True when several words form one indivisible constituent ("i går",
   * "den nye lærer"). Rendered as a single chip so the learner practises
   * thinking in constituents rather than words.
   */
  multiword?: boolean;
}

/** Where the learner has placed tokens: field id -> ordered token ids. */
export type Placement = Partial<Record<FieldId, string[]>>;

export interface Exercise {
  id: string;
  clause: ClauseType;
  /** English gloss of the target sentence. */
  gloss: string;
  tokens: Token[];
  /** The canonical correct placement. */
  solution: Placement;
  /**
   * Alternative accepted placements. Danish word order genuinely allows more
   * than one arrangement for many sentences (any constituent can be fronted),
   * and marking a valid alternative "wrong" is how apps destroy trust.
   */
  alternatives?: Placement[];
  /** Rules this exercise is designed to exercise. */
  targets: RuleId[];
  /** Niveau 1–5 (see content/levels.ts); gates when the trainer serves it. */
  level: Level;
  exams: Exam[];
  /** Shown after a correct answer — the "why", in one line. */
  takeaway: string;
}

export type DiagnosisSeverity = 'error' | 'nuance';

export interface Diagnosis {
  ruleId: RuleId;
  severity: DiagnosisSeverity;
  /** Learner-facing message, specific to what they actually did. */
  message: string;
  /** Fields to highlight on the board when showing this diagnosis. */
  fields: FieldId[];
  /** Tokens implicated, for chip-level highlighting. */
  tokenIds: string[];
}

export interface Evaluation {
  correct: boolean;
  /** True when the answer matched an alternative rather than the canonical one. */
  viaAlternative: boolean;
  diagnoses: Diagnosis[];
  /** Fraction of tokens in the right field, 0..1 — drives partial credit. */
  accuracy: number;
}
