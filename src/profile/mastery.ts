/**
 * Shared mastery math.
 *
 * Grammar rules and vocabulary words are different domains but the same
 * product idea applies to both: track a decaying strength per item instead of
 * a streak, so the app can tell you what's actually solid versus what merely
 * happened once. Factored out so both `profile/store.ts` (grammar) and
 * `profile/vocabStore.ts` (vocabulary) apply identical decay, levelling, and
 * recency-weighting — the two mastery maps should feel like one system, not
 * two apps bolted together.
 */

export type MasteryLevel = 'unseen' | 'shaky' | 'developing' | 'solid' | 'mastered';

export interface ItemStat {
  attempts: number;
  correct: number;
  /** Rolling window of recent outcomes, newest last. */
  recent: boolean[];
  /** Epoch ms of last practice, or 0. */
  lastSeen: number;
  /** 0..1 mastery before time decay is applied. */
  raw: number;
}

export const EMPTY_STAT: ItemStat = {
  attempts: 0,
  correct: 0,
  recent: [],
  lastSeen: 0,
  raw: 0,
};

/** Days after which an untouched item has decayed to roughly half strength. */
export const HALF_LIFE_DAYS = 12;
export const RECENT_WINDOW = 6;

export function decayedStrength(s: ItemStat, now = Date.now()): number {
  if (!s.attempts || !s.lastSeen) return 0;
  const days = (now - s.lastSeen) / 86_400_000;
  const factor = Math.pow(0.5, days / HALF_LIFE_DAYS);
  return s.raw * factor;
}

export function levelOf(strength: number, attempts: number): MasteryLevel {
  if (!attempts) return 'unseen';
  if (strength >= 0.9) return 'mastered';
  if (strength >= 0.7) return 'solid';
  if (strength >= 0.4) return 'developing';
  return 'shaky';
}

/**
 * Fold one new outcome into an item's stat. Pure function: callers decide how
 * to store the result.
 */
export function applyOutcome(prev: ItemStat, ok: boolean, now = Date.now()): ItemStat {
  const recent = [...prev.recent, ok].slice(-RECENT_WINDOW);
  const base = decayedStrength(prev, now);
  const windowScore =
    recent.reduce((acc, r, i) => acc + (r ? i + 1 : 0), 0) /
    recent.reduce((acc, _, i) => acc + i + 1, 0);
  const raw = prev.attempts === 0 ? (ok ? 0.45 : 0.1) : base * 0.35 + windowScore * 0.65;

  return {
    attempts: prev.attempts + 1,
    correct: prev.correct + (ok ? 1 : 0),
    recent,
    lastSeen: now,
    raw: Math.max(0, Math.min(1, raw)),
  };
}

export interface ItemProgress<K extends string> {
  id: K;
  strength: number;
  level: MasteryLevel;
  attempts: number;
  lastSeen: number;
  /** True when this item was solid but has decayed and wants a refresh. */
  needsRefresh: boolean;
}

export function progressFor<K extends string>(
  id: K,
  s: ItemStat,
  now = Date.now(),
): ItemProgress<K> {
  const strength = decayedStrength(s, now);
  return {
    id,
    strength,
    level: levelOf(strength, s.attempts),
    attempts: s.attempts,
    lastSeen: s.lastSeen,
    needsRefresh: s.raw >= 0.7 && strength < 0.7,
  };
}
