/**
 * The progress log's vocabulary.
 *
 * A learner's progress is not stored as stats. It is stored as what happened —
 * every answer, every niveau they set by hand, every reset — and the stats are
 * derived from that by `replay.ts`. That is what lets two devices sync without
 * ever overwriting each other (they only add events), lets an upload be
 * retried safely (events carry a client-made uuid), and lets the mastery math
 * change later without anyone losing progress (replay the same log with the
 * new math).
 */

import type { Level } from '../content/levels';
import { DRILL_DOMAIN_KEYS } from '../drills/registry';
import type { DomainLevel, LevelDomain } from '../profile/levelStore';
import type { ItemStat } from '../profile/mastery';

/** Every practice area that keeps mastery stats. */
export type Domain = LevelDomain | 'vocab';

/**
 * Replay skips answers whose domain is not here (they come from a newer app
 * version), so every domain that records must be listed — drill domains come
 * from the registry, all of them, whether or not they have content yet.
 */
export const ALL_DOMAINS: Domain[] = ['grammar', 'nouns', 'verbs', 'adjectives', 'comma', 'spelling', 'vocab', ...DRILL_DOMAIN_KEYS];

/**
 * The grammar path's finished sessions. Logged as answers so they need no new
 * event kind (and no database change): `itemId` is the lesson or checkpoint,
 * `outcomes` the questions asked, `correct` whether it passed. It is not a
 * Domain — it keeps no mastery stats — so older app versions skip it.
 */
export const PATH_DOMAIN = 'path';

interface EventBase {
  /** Client-generated uuid: the upload is idempotent on it. */
  id: string;
  /** Epoch ms on the device where it happened. */
  at: number;
}

export interface AnswerEvent extends EventBase {
  kind: 'answer';
  domain: Domain | typeof PATH_DOMAIN;
  /** The exercise, noun, verb, sentence or word answered. */
  itemId: string;
  /** The item's niveau; null for vocabulary, which has no niveau climb. */
  level: Level | null;
  /** What the answer was evidence for: rule id (or word id) → right or wrong. */
  outcomes: Record<string, boolean>;
  correct: boolean;
  /** Grammar only: the rules the learner actually broke. */
  violated?: string[];
}

export interface SetLevelEvent extends EventBase {
  kind: 'set-level';
  domain: LevelDomain;
  level: Level;
}

export interface ResetEvent extends EventBase {
  kind: 'reset';
  domain: Domain | 'all';
}

export type ProgressEvent = AnswerEvent | SetLevelEvent | ResetEvent;

/**
 * Progress carried over from before accounts existed: a snapshot, not a log,
 * so it seeds replay instead of being replayed. Answers in the log at or
 * before `asOf` for the same key are already reflected in the snapshot.
 *
 *   domain = a Domain, key = rule or word id, value = ItemStat
 *   domain = 'grammar-seen', key = 'seen',      value = exercise ids
 *   domain = 'activity',     key = 'days',      value = ISO dates
 *   domain = 'levels',       key = LevelDomain, value = DomainLevel
 */
export interface Baseline {
  domain: string;
  key: string;
  value: unknown;
  asOf: number;
}

export interface SessionResult {
  exerciseId: string;
  correct: boolean;
  violated: string[];
  at: number;
}

/** Everything the app shows about progress, rebuilt from baselines + events. */
export interface Derived {
  stats: Record<Domain, Record<string, ItemStat>>;
  /** Grammar exercise ids answered correctly at least once. */
  seen: string[];
  /** The latest grammar answers, oldest first. */
  history: SessionResult[];
  /** ISO dates with at least one answer, ascending. */
  activeDays: string[];
  levels: Partial<Record<LevelDomain, DomainLevel>>;
  /** Grammar path: the best session per lesson or checkpoint id. */
  path: Record<string, PathResult>;
}

/** A path node's best result, folded from its path answers. */
export interface PathResult {
  /** Most questions right in one session. */
  best: number;
  /** Questions in that session. */
  total: number;
  /** Sessions that passed. */
  passes: number;
  attempts: number;
  lastAt: number;
}
