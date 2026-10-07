/**
 * The grammar path: every rule in the app, in the order to learn them.
 *
 * Four worlds on the niveau scale, each split into themed units of at most
 * eight lessons, one lesson per rule. A unit ends in a checkpoint over all its
 * rules, which is also how a learner tests out of material they already know.
 *
 *   - Worlds open in turn: the next one when every checkpoint in this one is passed.
 *   - Units inside an open world are open side by side.
 *   - Lessons inside a unit open one after another, and a lesson may also
 *     `require` lessons elsewhere — that is what "builds on" means, and the
 *     lesson then mixes in review questions from what it builds on.
 *
 * Lesson ids are the rule ids and checkpoint ids are `cp-<unit id>`. Both go
 * into the progress log, so like every other content id they are locked
 * (`content-ids.lock.json`, bank `path:nodes`) and must never be renamed.
 */

import type { Level } from '../content/levels';
import { indexedRule, type IndexedRule } from './ruleIndex';

export type Theme = 'sentences' | 'verbs' | 'nouns' | 'small' | 'spelling' | 'mixed';

export interface PathLesson {
  id: string;
  rule: IndexedRule;
  /** Lessons in other units this one builds on (the previous lesson in the unit is implied). */
  requires: string[];
  unitId: string;
  worldIndex: number;
}

export interface PathUnit {
  id: string;
  name: string;
  theme: Theme;
  worldIndex: number;
  lessons: PathLesson[];
  checkpointId: string;
}

export interface PathWorld {
  index: number;
  /** Niveau label, e.g. "Let øvet". */
  name: string;
  cefr: string;
  /** Highest niveau the world's questions are drawn from. */
  level: Level;
  units: PathUnit[];
}

type LessonSpec = string | [id: string, requires: string[]];
interface UnitSpec {
  id: string;
  name: string;
  theme: Theme;
  lessons: LessonSpec[];
}
interface WorldSpec {
  name: string;
  cefr: string;
  level: Level;
  units: UnitSpec[];
}

const SPEC: WorldSpec[] = [
  {
    name: 'Begynder',
    cefr: 'A1',
    level: 1,
    units: [
      { id: 'w1-first', name: 'Første skridt', theme: 'mixed', lessons: ['subject-required', 'present-tense-r'] },
      {
        id: 'w1-verbs',
        name: 'Verber',
        theme: 'verbs',
        lessons: ['vt-verb-forms', 'vt-at-modal', 'vb-vaere-blive-state-change', 'vb-have-faa-state-change'],
      },
      {
        id: 'w1-nouns',
        name: 'Navneord & tillægsord',
        theme: 'nouns',
        lessons: ['en-et-gender', 'definite-suffix', 'nu-noun-forms', 'adjective-common-form', 'au-colours', 'au-god'],
      },
      { id: 'w1-small', name: 'Små ord', theme: 'small', lessons: ['pr-subject-object', 'pr-countable', 'wv-know'] },
    ],
  },
  {
    name: 'Let øvet',
    cefr: 'A2',
    level: 2,
    units: [
      {
        id: 'w2-sentences',
        name: 'Sætninger',
        theme: 'sentences',
        lessons: [['v2-inversion', ['subject-required']], 'forfelt-single', 'finit-verb-second'],
      },
      {
        id: 'w2-verbs',
        name: 'Verber',
        theme: 'verbs',
        lessons: [
          ['weak-suffix-choice', ['vt-verb-forms']],
          'strong-verb-forms',
          ['vt-past-vs-perfect', ['vt-verb-forms']],
          ['vb-passive-blive', ['vt-verb-forms']],
          ['vb-vil-have-faa', ['vb-have-faa-state-change']],
          ['mv-meaning', ['vt-at-modal']],
          'mv-maatte-kunne',
        ],
      },
      {
        id: 'w2-nouns',
        name: 'Navneord & tillægsord',
        theme: 'nouns',
        lessons: [
          ['adjective-neuter-form', ['en-et-gender']],
          ['adjective-e-form', ['adjective-common-form']],
          ['double-definiteness', ['definite-suffix']],
          ['nu-general-singular', ['nu-noun-forms']],
          'nu-definite-indefinite',
          'au-regular',
        ],
      },
      {
        id: 'w2-pronouns',
        name: 'Små ord · Pronominer & bindeord',
        theme: 'small',
        lessons: [
          ['pr-det-den-de', ['pr-subject-object']],
          'pr-det-der',
          'pr-man-du-i',
          'cj-hvis-om',
          'cj-hvornaar-da-naar',
          'cj-at-som-det',
        ],
      },
      {
        id: 'w2-prepositions',
        name: 'Små ord · Præpositioner & adverbier',
        theme: 'small',
        lessons: ['pp-for-til', 'pp-af-fra', 'pp-tid-varighed', 'pp-tid-tidspunkt', 'ad-direction-location', 'ad-adjective-adverb'],
      },
      {
        id: 'w2-wordchoice',
        name: 'Små ord · Ordvalg',
        theme: 'small',
        lessons: [['wv-go', ['wv-know']], 'wv-make', 'wv-say', 'wo-bad', 'wo-long'],
      },
      {
        id: 'w2-spelling',
        name: 'Stavning & komma',
        theme: 'spelling',
        lessons: [
          'silent-d',
          'silent-h-hv',
          ['og-vs-at', ['present-tense-r']],
          'comma-men-vs-og',
          'comma-list-items',
        ],
      },
    ],
  },
  {
    name: 'Mellem',
    cefr: 'B1 · PD2',
    level: 3,
    units: [
      {
        id: 'w3-sentences',
        name: 'Sætninger',
        theme: 'sentences',
        lessons: [
          ['ikke-regel', ['v2-inversion']],
          ['verb-cluster-order', ['finit-verb-second']],
          'relative-clause',
        ],
      },
      {
        id: 'w3-tenses',
        name: 'Verber · Tider',
        theme: 'verbs',
        lessons: [
          ['perfect-auxiliary', ['strong-verb-forms']],
          ['vt-past-vs-pluperfect', ['vt-past-vs-perfect']],
          'vt-pluperfect-var-havde',
          'vt-future',
          ['vt-at-object-infinitive', ['vt-at-modal']],
        ],
      },
      {
        id: 'w3-verbs2',
        name: 'Verber · Være, blive, få & modalverber',
        theme: 'verbs',
        lessons: [
          ['vb-vaere-blive-passive-state', ['vb-passive-blive']],
          ['vb-vil-vaere-blive', ['vb-vaere-blive-state-change']],
          'vb-skal-vaere-blive',
          ['vb-skal-have-faa', ['vb-vil-have-faa']],
          ['mv-skulle-ville', ['mv-meaning']],
          'mv-skulle-maatte',
          'mv-burde-skulle',
        ],
      },
      {
        id: 'w3-nouns',
        name: 'Navneord & tillægsord',
        theme: 'nouns',
        lessons: [['nu-general-plural', ['nu-general-singular']], ['au-irregular', ['au-regular']], 'au-al-hel-singular'],
      },
      {
        id: 'w3-small',
        name: 'Små ord · Pronominer, bindeord & adverbier',
        theme: 'small',
        lessons: [
          ['pr-man-en-sig', ['pr-man-du-i']],
          ['pr-hans-sin', ['pr-subject-object']],
          'cj-for-fordi',
          ['cj-der-som', ['relative-clause']],
          ['pp-for-at-til-at', ['pp-for-til']],
          ['ad-direction-or-nothing', ['ad-direction-location']],
        ],
      },
      {
        id: 'w3-wordchoice',
        name: 'Små ord · Ordvalg',
        theme: 'small',
        lessons: [
          'wv-change',
          'wv-need',
          'wv-think',
          'wo-almindelig-normal-saedvanlig',
          'wo-different',
          'wo-lige-bare',
          'wo-bare-kun',
          ['wo-laenge-lang-tid', ['wo-long']],
        ],
      },
      {
        id: 'w3-spelling',
        name: 'Stavning & komma',
        theme: 'spelling',
        lessons: ['nogen-vs-nogle', 'ligge-laegge', ['comma-after-subclause', ['comma-men-vs-og']]],
      },
    ],
  },
  {
    name: 'Øvet / PD3',
    cefr: 'B1+ · B2',
    level: 5,
    units: [
      {
        id: 'w4-sentences',
        name: 'Sætninger & komma',
        theme: 'sentences',
        lessons: [
          ['central-vs-content-adverbial', ['ikke-regel']],
          'object-order',
          'adverbial-order',
          ['comma-relative-clause', ['relative-clause']],
        ],
      },
      {
        id: 'w4-passive',
        name: 'Verber · Passiv med modalverber',
        theme: 'verbs',
        lessons: [
          ['mv-vil-passive', ['vb-passive-blive']],
          'mv-skal-passive',
          'mv-kan-passive',
          'mv-maa-passive-necessity',
          'mv-maa-passive-permission',
        ],
      },
      {
        id: 'w4-small',
        name: 'Små ord & former',
        theme: 'small',
        lessons: [
          ['au-al-hel-all', ['au-al-hel-singular']],
          ['pr-ens-sin', ['pr-hans-sin']],
          ['cj-som-hvilket', ['cj-der-som']],
          'wo-contrasting',
          'wo-even',
        ],
      },
    ],
  },
];

function build(): PathWorld[] {
  return SPEC.map((w, worldIndex) => ({
    index: worldIndex,
    name: w.name,
    cefr: w.cefr,
    level: w.level,
    units: w.units.map((u) => ({
      id: u.id,
      name: u.name,
      theme: u.theme,
      worldIndex,
      checkpointId: `cp-${u.id}`,
      lessons: u.lessons.map((spec) => {
        const [id, requires] = typeof spec === 'string' ? [spec, []] : spec;
        const rule = indexedRule(id);
        if (!rule) throw new Error(`curriculum: unknown rule "${id}"`);
        return { id, rule, requires, unitId: u.id, worldIndex };
      }),
    })),
  }));
}

export const WORLDS: PathWorld[] = build();
export const ALL_UNITS: PathUnit[] = WORLDS.flatMap((w) => w.units);
/** Every lesson, in path order. */
export const ALL_LESSONS: PathLesson[] = ALL_UNITS.flatMap((u) => u.lessons);

const LESSONS = new Map(ALL_LESSONS.map((l) => [l.id, l]));
const UNITS = new Map(ALL_UNITS.map((u) => [u.id, u]));
const CHECKPOINTS = new Map(ALL_UNITS.map((u) => [u.checkpointId, u]));

export function lessonById(id: string): PathLesson | undefined {
  return LESSONS.get(id);
}

export function unitById(id: string): PathUnit | undefined {
  return UNITS.get(id);
}

/** The unit a checkpoint id belongs to. */
export function unitForCheckpoint(id: string): PathUnit | undefined {
  return CHECKPOINTS.get(id);
}

/** Every node id on the path: lessons and checkpoints. These are the locked ids. */
export const ALL_NODE_IDS: string[] = ALL_UNITS.flatMap((u) => [...u.lessons.map((l) => l.id), u.checkpointId]);

/** Short world title, e.g. "Niveau 2 · Let øvet"; the last world spans niveau 4–5. */
export function worldTitle(w: PathWorld): string {
  const n = w.index === WORLDS.length - 1 && w.index + 1 !== w.level ? `${w.index + 1}–${w.level}` : `${w.index + 1}`;
  return `Niveau ${n} · ${w.name}`;
}
