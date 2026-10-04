/**
 * How the practice stores report what happened, without knowing where it goes.
 *
 * Trainers call `record` on their store; the store turns that into an event
 * here; the progress log (log.ts) appends it, queues it for upload and
 * republishes the derived progress back into the stores. Keeping this as a
 * one-function seam means the stores never import the log, which imports them.
 */

import type { Level } from '../content/levels';
import type { LevelDomain } from '../profile/levelStore';
import type { AnswerEvent, Domain } from './types';

export type AnswerInput = Omit<AnswerEvent, 'id' | 'at' | 'kind'>;

export interface EventSink {
  answer: (input: AnswerInput) => void;
  setLevel: (domain: LevelDomain, level: Level) => void;
  reset: (domain: Domain | 'all') => void;
}

let sink: EventSink | null = null;

export function setEventSink(next: EventSink | null): void {
  sink = next;
}

export function recordAnswer(input: AnswerInput): void {
  sink?.answer(input);
}

export function recordSetLevel(domain: LevelDomain, level: Level): void {
  sink?.setLevel(domain, level);
}

export function recordReset(domain: Domain | 'all'): void {
  sink?.reset(domain);
}
