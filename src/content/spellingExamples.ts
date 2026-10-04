/**
 * Spelling exercise bank.
 *
 * Same reasoning as `commaExamples.ts`: there is no small per-word property
 * to generate a question from, so each entry is a hand-written sentence with
 * a blank and the two words a learner might plausibly choose between. The
 * "wrong" option is always a real spelling mistake this specific confusion
 * produces — a real other word ("hun" for "hund"), a silent-letter miss
 * ("vad" for "hvad"), or the paired function word ("nogen" for "nogle") —
 * never an arbitrary distractor.
 */

import SEED from './data/spelling.json';
import type { SpellingRuleId } from '../grammar/spellingRules';
import type { Level } from './levels';

export interface SpellingEntry {
  id: string;
  /** Niveau 1–5 (see levels.ts): when the trainer starts serving this item. */
  level: Level;
  ruleId: SpellingRuleId;
  /** Sentence with "___" marking the blank. */
  prompt: string;
  correct: string;
  incorrect: string;
  explanation: string;
  /** False until a person has checked the Danish; hand-written items are treated as checked. */
  reviewed?: boolean;
}

/** Hand-written originals. */
const HAND_WRITTEN: SpellingEntry[] = [
  // ── silent d ──────────────────────────────────────────────────────────
  {
    id: 's-hund',
    level: 1,
    ruleId: 'silent-d',
    prompt: 'Jeg har en ___ derhjemme.',
    correct: 'hund',
    incorrect: 'hun',
    explanation: '"Hund" (dog) needs its silent d — drop it and you get "hun" (she), a different real word.',
  },
  {
    id: 's-mand',
    level: 1,
    ruleId: 'silent-d',
    prompt: 'Han er en god ___.',
    correct: 'mand',
    incorrect: 'man',
    explanation: '"Mand" (man) loses its silent d and becomes "man" (one, you) — spelled without the d, but still a real word.',
  },
  {
    id: 's-guld',
    level: 2,
    ruleId: 'silent-d',
    prompt: 'Ringen er lavet af ___.',
    correct: 'guld',
    incorrect: 'gul',
    explanation: '"Guld" (gold) has a silent d after the l — without it you get "gul" (yellow), an unrelated word.',
  },
  {
    id: 's-haand',
    level: 2,
    ruleId: 'silent-d',
    prompt: 'Ræk mig din ___.',
    correct: 'hånd',
    incorrect: 'hån',
    explanation: '"Hånd" (hand) keeps its silent d after n — "hån" (without the d) means scorn, a different word entirely.',
  },
  {
    id: 's-bord',
    level: 2,
    ruleId: 'silent-d',
    prompt: 'Maden står på ___.',
    correct: 'bordet',
    incorrect: 'boret',
    explanation: '"Bord" (table) has a silent d after r — drop it and "boret" reads like "the drill" (bor), not the table.',
  },
  {
    id: 's-vild',
    level: 2,
    ruleId: 'silent-d',
    prompt: 'Hunden er helt ___.',
    correct: 'vild',
    incorrect: 'vil',
    explanation: '"Vild" (wild) keeps its silent d after l — without it you get "vil" (will/want), a completely different word.',
  },

  // ── silent h in hv-words ─────────────────────────────────────────────
  {
    id: 's-hvad',
    level: 1,
    ruleId: 'silent-h-hv',
    prompt: '___ hedder du?',
    correct: 'Hvad',
    incorrect: 'Vad',
    explanation: 'Pronounced identically either way — the silent h has to be memorised, not heard.',
  },
  {
    id: 's-hvor',
    level: 1,
    ruleId: 'silent-h-hv',
    prompt: '___ bor du?',
    correct: 'Hvor',
    incorrect: 'Vor',
    explanation: 'Same silent-h pattern — "vor" is even a real (old-fashioned) word for "our", which makes this one easy to miss.',
  },
  {
    id: 's-hvem',
    level: 1,
    ruleId: 'silent-h-hv',
    prompt: '___ er det?',
    correct: 'Hvem',
    incorrect: 'Vem',
    explanation: 'The h is silent but still required in spelling — "vem" is not a Danish word at all.',
  },
  {
    id: 's-hvorfor',
    level: 2,
    ruleId: 'silent-h-hv',
    prompt: '___ kommer du ikke?',
    correct: 'Hvorfor',
    incorrect: 'Vorfor',
    explanation: 'Every hv-question-word follows the same pattern: silent h, spelled anyway.',
  },
  {
    id: 's-hvordan',
    level: 2,
    ruleId: 'silent-h-hv',
    prompt: '___ har du det?',
    correct: 'Hvordan',
    incorrect: 'Vordan',
    explanation: 'The h is silent but required — "vordan" is not a word, so this one is purely a spelling habit to build.',
  },
  {
    id: 's-hvis',
    level: 3,
    ruleId: 'silent-h-hv',
    prompt: '___ bog er det?',
    correct: 'Hvis',
    incorrect: 'Vis',
    explanation: '"Hvis" (whose) carries the silent h — "vis" without it is a real word (wise / show), so the ear cannot warn you.',
  },

  // ── nogen vs. nogle ──────────────────────────────────────────────────
  {
    id: 's-nogle-1',
    level: 3,
    ruleId: 'nogen-vs-nogle',
    prompt: 'Jeg har ___ gode venner.',
    correct: 'nogle',
    incorrect: 'nogen',
    explanation: 'A plain positive statement about a plural amount takes "nogle".',
  },
  {
    id: 's-nogen-1',
    level: 3,
    ruleId: 'nogen-vs-nogle',
    prompt: 'Er der ___ herinde?',
    correct: 'nogen',
    incorrect: 'nogle',
    explanation: 'A question meaning "anyone" takes "nogen", not "nogle".',
  },
  {
    id: 's-nogen-2',
    level: 3,
    ruleId: 'nogen-vs-nogle',
    prompt: 'Har du ___ penge, jeg kan låne?',
    correct: 'nogen',
    incorrect: 'nogle',
    explanation: 'Questions take "nogen", even when what\'s being asked about is a plural-sounding thing like money.',
  },
  {
    id: 's-nogle-2',
    level: 3,
    ruleId: 'nogen-vs-nogle',
    prompt: 'Vi købte ___ æbler i går.',
    correct: 'nogle',
    incorrect: 'nogen',
    explanation: 'A positive statement about a plural amount — "nogle" again, not "nogen".',
  },
  {
    id: 's-nogen-3',
    level: 4,
    ruleId: 'nogen-vs-nogle',
    prompt: 'Der er ikke ___ mælk tilbage.',
    correct: 'nogen',
    incorrect: 'nogle',
    explanation: 'A negative statement ("ikke … tilbage") takes "nogen", not "nogle".',
  },
  {
    id: 's-nogle-3',
    level: 3,
    ruleId: 'nogen-vs-nogle',
    prompt: 'Han læste ___ bøger i ferien.',
    correct: 'nogle',
    incorrect: 'nogen',
    explanation: 'A plain positive statement about a plural amount — "nogle".',
  },

  // ── og vs. at before an infinitive ───────────────────────────────────
  // Includes genuine "og" cases on purpose: the skill is discriminating,
  // not defaulting to "at". A pool that only ever answered "at" would teach
  // a habit, not the rule.
  {
    id: 's-at-1',
    level: 2,
    ruleId: 'og-vs-at',
    prompt: 'Jeg prøver ___ komme til tiden.',
    correct: 'at',
    incorrect: 'og',
    explanation: '"komme" is an infinitive depending on "prøver", so it takes the marker "at", not "og".',
  },
  {
    id: 's-at-2',
    level: 2,
    ruleId: 'og-vs-at',
    prompt: 'Det er svært ___ forstå.',
    correct: 'at',
    incorrect: 'og',
    explanation: 'Swap in "to" — "difficult to understand" — and it confirms "at", not "og".',
  },
  {
    id: 's-at-3',
    level: 3,
    ruleId: 'og-vs-at',
    prompt: 'Hun plejer ___ løbe om morgenen.',
    correct: 'at',
    incorrect: 'og',
    explanation: '"løbe" is an infinitive after "plejer" — the marker "at" is required.',
  },
  {
    id: 's-og-1',
    level: 1,
    ruleId: 'og-vs-at',
    prompt: 'Jeg købte brød ___ mælk.',
    correct: 'og',
    incorrect: 'at',
    explanation: 'Here two equal things are joined ("bread and milk"), so it really is "og" — not every gap is "at".',
  },
  {
    id: 's-og-2',
    level: 2,
    ruleId: 'og-vs-at',
    prompt: 'Han spiser ___ drikker for meget.',
    correct: 'og',
    incorrect: 'at',
    explanation: 'Two parallel verbs with the same subject ("eats and drinks") are joined by "og".',
  },
  // ── present-tense -r ──────────────────────────────────────────────────
  {
    id: 's-laerer-1',
    level: 2,
    ruleId: 'present-tense-r',
    prompt: 'Jeg vil gerne ___ mere dansk.',
    correct: 'lære',
    incorrect: 'lærer',
    explanation: 'After the helping verb "vil" the verb is an infinitive, so no -r: "vil lære".',
  },
  {
    id: 's-laerer-2',
    level: 2,
    ruleId: 'present-tense-r',
    prompt: 'Min søn ___ at svømme i år.',
    correct: 'lærer',
    incorrect: 'lære',
    explanation: '"lærer" is the verb carrying the tense here — present tense, so it takes -r.',
  },

  // ── ligge / lægge ─────────────────────────────────────────────────────
  {
    id: 's-laegge-1',
    level: 3,
    ruleId: 'ligge-laegge',
    prompt: 'Kan du ___ nøglerne på bordet?',
    correct: 'lægge',
    incorrect: 'ligge',
    explanation: 'You put the keys somewhere — something is being moved, so it is "lægge".',
  },
  {
    id: 's-ligge-1',
    level: 3,
    ruleId: 'ligge-laegge',
    prompt: 'Brevet ___ stadig i postkassen.',
    correct: 'ligger',
    incorrect: 'lægger',
    explanation: 'The letter is just lying there — nothing is being put anywhere, so it is "ligge".',
  },
];

/** Hand-written originals, then the drafted bank in data/spelling.json. */
export const SPELLING_EXAMPLES: SpellingEntry[] = [...HAND_WRITTEN, ...(SEED as SpellingEntry[])];

export function spellingExamplesForRule(ruleId: SpellingRuleId): SpellingEntry[] {
  return SPELLING_EXAMPLES.filter((e) => e.ruleId === ruleId);
}
