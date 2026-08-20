/**
 * Claude-backed writing coach — interface complete, transport stubbed.
 *
 * IMPORTANT: the API key must never ship inside the app bundle. A mobile binary
 * is a public artifact; anything compiled into it is extractable. So this
 * provider talks to a backend proxy we control, which holds the key and adds
 * per-user rate limiting. `EXPO_PUBLIC_COACH_URL` is the proxy, not Anthropic.
 *
 * Until that proxy exists, `isAvailable()` returns false and the writing studio
 * falls back to the offline checker, telling the learner plainly which one
 * reviewed their text.
 */

import type { FeedbackProvider, WritingFeedback, WritingTask } from './types';

const COACH_URL = process.env.EXPO_PUBLIC_COACH_URL ?? '';

/**
 * The contract we expect from the proxy. Kept here so the backend can be
 * written against it directly, and so the shape is testable without a network.
 */
export interface CoachRequest {
  text: string;
  task: WritingTask;
  /** Rules the learner is currently weak on — lets the coach prioritise. */
  focusRules: string[];
  targetExam: 'PD2' | 'PD3' | 'FVU';
}

/**
 * System prompt for the proxy to use. Lives in the client repo because it is
 * product behaviour, not a secret — the proxy should treat it as the default
 * and refuse client-supplied overrides.
 */
export const COACH_SYSTEM_PROMPT = `You are a Danish writing examiner and teacher preparing adult learners for Prøve i Dansk 3.

For every correction you make you MUST:
1. Quote the learner's exact span.
2. Give the corrected form.
3. Name the underlying rule and explain WHY, in English, in at most two sentences. Never say only "this is wrong".
4. Where the error is one of word order, refer to the sætningsskema field involved (Forfelt, finit verbum, subjekt, centraladverbial, infinit verbum, objekt, indholdsadverbial).

Do not rewrite the learner's text wholesale. Do not correct choices that are merely stylistic unless the register is wrong for the task. If a construction is acceptable Danish but unusual, mark it as style, not error.

Return JSON matching the WritingFeedback schema. Be exact about character offsets.`;

export const claudeProvider: FeedbackProvider = {
  id: 'claude',
  label: 'AI writing coach',

  isAvailable: () => COACH_URL.length > 0,

  async review(text: string, task: WritingTask): Promise<WritingFeedback> {
    if (!COACH_URL) {
      throw new Error(
        'AI coach is not configured. Set EXPO_PUBLIC_COACH_URL to your backend proxy.',
      );
    }

    const body: CoachRequest = { text, task, focusRules: [], targetExam: 'PD3' };

    const res = await fetch(`${COACH_URL}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Coach request failed: ${res.status}`);
    }

    const data = (await res.json()) as Omit<WritingFeedback, 'provider'>;
    return { ...data, provider: 'claude' };
  },
};

/** The provider the writing studio should use right now. */
export function activeProvider(): FeedbackProvider {
  // Lazily required to avoid a cycle at module-init time.
  const { offlineProvider } = require('./offlineRules') as typeof import('./offlineRules');
  return claudeProvider.isAvailable() ? claudeProvider : offlineProvider;
}
