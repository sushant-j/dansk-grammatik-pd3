/**
 * The writing-feedback contract.
 *
 * Slice 2 of this app is the writing studio: the learner writes a letter or a
 * topic essay of the kind PD3 sets, and gets back corrections that are *keyed
 * to grammar rules* rather than free-floating prose. Defining the interface now
 * means the offline checker and the eventual Claude-backed coach are
 * interchangeable, and the UI never has to know which one answered.
 */

import type { RuleId } from '../grammar/rules';

export type WritingTask =
  | { kind: 'letter'; prompt: string; register: 'formel' | 'uformel' }
  | { kind: 'essay'; prompt: string; minWords: number };

export interface Correction {
  /** Character range in the submitted text. */
  start: number;
  end: number;
  /** The learner's original span. */
  original: string;
  /** What it should be. */
  suggestion: string;
  /** The rule this violates, when it maps to one we teach. */
  ruleId?: RuleId;
  /** Learner-facing explanation — always the "why", never just the "what". */
  explanation: string;
  severity: 'error' | 'style' | 'register';
}

export interface WritingFeedback {
  corrections: Correction[];
  /** Holistic notes: structure, register, task fulfilment. */
  notes: string[];
  /** Rough PD3-style band, when the provider can judge it. */
  estimatedBand?: 'under B1' | 'B1' | 'B1+' | 'B2' | 'B2+';
  /** Which provider produced this, so the UI can be honest about it. */
  provider: 'offline-rules' | 'claude';
}

export interface FeedbackProvider {
  readonly id: 'offline-rules' | 'claude';
  readonly label: string;
  /** False when the provider is not configured (e.g. no API key yet). */
  isAvailable(): boolean;
  review(text: string, task: WritingTask): Promise<WritingFeedback>;
}
