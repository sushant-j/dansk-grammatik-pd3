/**
 * Deterministic, offline writing checker.
 *
 * This is not a parser and does not pretend to be. It catches the specific
 * high-frequency structural errors that the schema teaches, using surface
 * patterns over a closed vocabulary of subordinators, sentence adverbs and
 * pronouns. Everything it flags, it can explain by rule — and it stays silent
 * rather than guessing, because a false correction costs far more trust than a
 * missed one.
 *
 * Style, register and topic relevance are explicitly out of scope; those need
 * the Claude-backed provider.
 */

import type { Correction, FeedbackProvider, WritingFeedback, WritingTask } from './types';

/** Subordinators that open a ledsætning and therefore trigger the ikke-regel. */
const SUBORDINATORS = [
  'fordi', 'hvis', 'når', 'da', 'at', 'om', 'som', 'mens', 'selvom',
  'inden', 'efter at', 'før', 'hvorfor', 'hvornår', 'hvordan',
];

/** Sentence adverbs that take the central slot. */
const CENTRAL_ADVERBS = [
  'ikke', 'aldrig', 'altid', 'ofte', 'måske', 'jo', 'nok', 'kun',
  'sjældent', 'allerede', 'gerne', 'vist', 'da', 'vel',
];

/** Finite verb forms common enough to detect reliably at this level. */
const FINITE_VERBS = [
  'er', 'var', 'har', 'havde', 'kan', 'kunne', 'vil', 'ville', 'skal',
  'skulle', 'må', 'måtte', 'bør', 'burde',
];

/**
 * Strong (irregular) past-tense forms.
 *
 * Danish weak verbs end in -ede/-te and are catchable with a suffix rule, but
 * the strong verbs — which are exactly the high-frequency ones a learner writes
 * most — are not: "gik", "kom", "skrev" match no pattern. Without this list the
 * inversion check silently misses the most common sentences it exists to catch.
 */
const STRONG_PAST = [
  'gik', 'kom', 'fik', 'blev', 'sad', 'stod', 'lå', 'gav', 'tog', 'skrev',
  'drak', 'fandt', 'holdt', 'sang', 'sov', 'så', 'bad', 'bar', 'brød',
  'faldt', 'fløj', 'hang', 'hed', 'hjalp', 'lod', 'løb', 'red', 'sagde',
  'skar', 'skød', 'slog', 'sprang', 'stak', 'stjal', 'traf', 'trak',
  'vandt', 'vidste', 'valgte', 'bragte', 'gjorde', 'spurgte', 'solgte',
];

/** Does this token plausibly sit in the finite-verb slot? */
function looksFinite(word: string): boolean {
  const w = word.toLowerCase();
  return (
    FINITE_VERBS.includes(w) ||
    STRONG_PAST.includes(w) ||
    // Weak past (-ede/-te) and present (-er/-r).
    /(?:ede|te|er|r)$/.test(w)
  );
}

/** Adverbials that commonly get fronted and then forget to invert. */
const FRONTABLE = [
  'i går', 'i dag', 'i morgen', 'derfor', 'så', 'nu', 'heldigvis',
  'desværre', 'om sommeren', 'om vinteren', 'normalt', 'til sidst',
  'først', 'bagefter', 'pludselig', 'endelig',
];

const SUBJECT_PRONOUNS = ['jeg', 'du', 'han', 'hun', 'vi', 'de', 'i', 'man', 'det', 'den'];

function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function checkText(text: string): Correction[] {
  const out: Correction[] = [];

  // ── ikke-regel: subordinator + subject + FINITE VERB + adverb ───────────
  // "fordi jeg kan ikke komme" → "fordi jeg ikke kan komme"
  {
    const sub = SUBORDINATORS.map(esc).join('|');
    const pron = SUBJECT_PRONOUNS.map(esc).join('|');
    const verb = FINITE_VERBS.map(esc).join('|');
    const adv = CENTRAL_ADVERBS.map(esc).join('|');
    const re = new RegExp(
      `\\b(${sub})\\s+(${pron})\\s+(${verb})\\s+(${adv})\\b`,
      'gi',
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const [full, s, p, v, a] = m;
      out.push({
        start: m.index,
        end: m.index + full.length,
        original: full,
        suggestion: `${s} ${p} ${a} ${v}`,
        ruleId: 'ikke-regel',
        explanation: `"${s}" opens a subordinate clause, so the adverb "${a}" moves in front of the finite verb "${v}". In a main clause you would write "${p} ${v} ${a}…" — inside a ledsætning the order flips.`,
        severity: 'error',
      });
    }
  }

  // ── Missing inversion after a fronted adverbial ─────────────────────────
  // Sentence-initial "I går jeg gik…" → "I går gik jeg…"
  {
    const front = FRONTABLE.map(esc).join('|');
    const pron = SUBJECT_PRONOUNS.map(esc).join('|');
    const re = new RegExp(
      `(^|[.!?]\\s+)(${front})\\s+(${pron})\\s+([a-zæøå]+)`,
      'gi',
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const [full, lead, adverbial, subject, verb] = m;
      // Only flag when the following word plausibly is the finite verb — an
      // adverbial followed by a pronoun and a noun is not this error.
      if (!looksFinite(verb)) continue;
      const start = m.index + lead.length;
      const original = full.slice(lead.length);
      out.push({
        start,
        end: start + original.length,
        original,
        suggestion: `${adverbial} ${verb} ${subject}`,
        ruleId: 'v2-inversion',
        explanation: `"${adverbial}" occupies the Forfelt, so the finite verb "${verb}" must come second — before the subject "${subject}". Danish keeps the verb in slot 2 no matter what you front.`,
        severity: 'error',
      });
    }
  }

  // ── "og" where the infinitive marker "at" is required ───────────────────
  {
    const re = /\b(prøver|prøvede|begynder|begyndte|plejer|plejede|glæder mig til|husk)\s+og\s+([a-zæøå]+e)\b/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const [full, v1, v2] = m;
      out.push({
        start: m.index,
        end: m.index + full.length,
        original: full,
        suggestion: `${v1} at ${v2}`,
        explanation: `Before an infinitive you need the marker "at", not "og". The two are pronounced almost identically in speech, which is why this error survives into writing — and examiners look for it specifically.`,
        severity: 'error',
      });
    }
  }

  return out.sort((a, b) => a.start - b.start);
}

export const offlineProvider: FeedbackProvider = {
  id: 'offline-rules',
  label: 'Offline rule checker',
  isAvailable: () => true,
  async review(text: string, task: WritingTask): Promise<WritingFeedback> {
    const corrections = checkText(text);
    const words = text.trim().split(/\s+/).filter(Boolean).length;

    const notes: string[] = [];
    if (task.minWords && words < task.minWords) {
      notes.push(
        `You wrote ${words} words; this task asks for at least ${task.minWords}. Falling short of the minimum costs marks in the exam.`,
      );
    }
    notes.push(
      'This is the offline checker: it verifies word order and a few high-frequency traps. It cannot judge style, register or how well you answered the prompt.',
    );

    return { corrections, notes, provider: 'offline-rules' };
  },
};
