/**
 * Question generator for the tense trainer.
 *
 * Same shape as nounExercise.ts / adjectiveExercise.ts: multiple choice, and
 * every distractor is the specific mistake this verb invites — the other
 * weak suffix, an over-regularised strong form, or the wrong auxiliary —
 * never an arbitrary wrong answer.
 */

import type { VerbEntry } from '../content/verbs';
import type { VerbRuleId } from './verbRules';

export type VerbQuestionKind = 'weak-suffix' | 'strong-form' | 'perfect-aux';

export interface VerbQuestion {
  kind: VerbQuestionKind;
  ruleId: VerbRuleId;
  verb: VerbEntry;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const SUBJECTS = ['Jeg', 'Du', 'Han', 'Hun', 'Vi', 'De'];
/** "sig" only agrees with a third-person subject: "han bevægede sig", never "jeg bevægede sig". */
const THIRD_PERSON = ['Han', 'Hun', 'De'];

function subjectFor(verb: VerbEntry, rng: () => number): string {
  return pick(verb.reflexive ? THIRD_PERSON : SUBJECTS, rng);
}

/** "i går" reads naturally after a bare verb, not after a particle verb that still wants its object ("stole på ___"). */
function pastFrame(verb: VerbEntry, rng: () => number): string {
  return `${subjectFor(verb, rng)} ___${verb.infinitive.includes(' ') && !verb.reflexive ? '' : ' i går'}.`;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

export function buildVerbQuestion(
  verb: VerbEntry,
  kind: VerbQuestionKind,
  rng: () => number = Math.random,
): VerbQuestion {
  if (kind === 'weak-suffix') {
    const options = shuffle([verb.past, verb.wrongPast], rng);
    return {
      kind,
      ruleId: 'weak-suffix-choice',
      verb,
      prompt: `Vælg datid af "at ${verb.infinitive}" (${verb.glossEn}): ${pastFrame(verb, rng)}`,
      options,
      correctIndex: options.indexOf(verb.past),
      explanation:
        verb.verbClass === 'weak-ede'
          ? `"${verb.infinitive}" tager -ede i datid: "${verb.past}", ikke "${verb.wrongPast}".`
          : `"${verb.infinitive}" tager -te i datid: "${verb.past}", ikke "${verb.wrongPast}".`,
    };
  }

  if (kind === 'strong-form') {
    const options = shuffle([verb.past, verb.wrongPast], rng);
    return {
      kind,
      ruleId: 'strong-verb-forms',
      verb,
      prompt: `Vælg datid af "at ${verb.infinitive}" (${verb.glossEn}): ${pastFrame(verb, rng)}`,
      options,
      correctIndex: options.indexOf(verb.past),
      explanation: `"${verb.infinitive}" er stærkt/uregelmæssigt: datid er "${verb.past}" — der tilføjes ingen endelse, formen skal huskes.`,
    };
  }

  // perfect-aux
  const options = shuffle(['er', 'har'], rng);
  const subject = subjectFor(verb, rng);
  return {
    kind,
    ruleId: 'perfect-auxiliary',
    verb,
    prompt: `Vælg hjælpeverbet: ${subject} ___ ${verb.participle}.`,
    options,
    correctIndex: options.indexOf(verb.perfectAux),
    explanation:
      verb.perfectAux === 'er'
        ? `"${verb.infinitive}" beskriver bevægelse eller forandring, så det tager "er": "${subject} er ${verb.participle}".`
        : `"${verb.infinitive}" er ikke et bevægelsesverbum, så det tager det almindelige "har": "${subject} har ${verb.participle}".`,
  };
}
