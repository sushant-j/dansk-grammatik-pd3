/**
 * PD3 sentence bank for the schema trainer.
 *
 * Sentences are drawn from the registers PD3 actually tests — workplace email,
 * letters to a kommune, opinion paragraphs — rather than the tourist phrases
 * that dominate consumer apps. Each one is built to force a specific rule
 * decision, and `alternatives` records the other orders a Dane would accept so
 * the trainer never punishes a correct answer it did not think of first.
 */

import type { Exercise } from '../grammar/types';

const t = (id: string, text: string, multiword = false) => ({ id, text, multiword });

export const EXERCISES: Exercise[] = [
  // ─── Inversion after a fronted adverbial ────────────────────────────────
  {
    id: 'ex-igaar',
    clause: 'helsætning',
    gloss: 'Yesterday I did not go to work.',
    tokens: [
      t('w1', 'i går', true),
      t('w2', 'gik'),
      t('w3', 'jeg'),
      t('w4', 'ikke'),
      t('w5', 'på arbejde', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      subjekt: ['w3'],
      centraladverbial: ['w4'],
      indholdsadverbial: ['w5'],
    },
    alternatives: [
      {
        forfelt: ['w3'],
        finitVerbum: ['w2'],
        centraladverbial: ['w4'],
        indholdsadverbial: ['w1', 'w5'],
      },
    ],
    targets: ['v2-inversion', 'finit-verb-second', 'forfelt-single'],
    cefr: 'A2',
    exams: ['PD2', 'PD3'],
    takeaway:
      'Front "I går" and the subject is pushed behind the verb. The verb never moves — everything else arranges itself around it.',
  },
  {
    id: 'ex-derfor',
    clause: 'helsætning',
    gloss: 'Therefore I cannot attend the meeting.',
    tokens: [
      t('w1', 'derfor'),
      t('w2', 'kan'),
      t('w3', 'jeg'),
      t('w4', 'ikke'),
      t('w5', 'deltage'),
      t('w6', 'i mødet', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      subjekt: ['w3'],
      centraladverbial: ['w4'],
      infinitVerbum: ['w5'],
      indholdsadverbial: ['w6'],
    },
    targets: ['v2-inversion', 'verb-cluster-order'],
    cefr: 'B1',
    exams: ['PD3'],
    takeaway:
      '"kan" is finite and holds slot 2; "deltage" is non-finite and waits in V — with "ikke" between them.',
  },
  {
    id: 'ex-om-sommeren',
    clause: 'helsætning',
    gloss: 'In the summer we usually travel to Skagen.',
    tokens: [
      t('w1', 'om sommeren', true),
      t('w2', 'tager'),
      t('w3', 'vi'),
      t('w4', 'som regel', true),
      t('w5', 'til Skagen', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      subjekt: ['w3'],
      centraladverbial: ['w4'],
      indholdsadverbial: ['w5'],
    },
    alternatives: [
      {
        forfelt: ['w3'],
        finitVerbum: ['w2'],
        centraladverbial: ['w4'],
        indholdsadverbial: ['w5', 'w1'],
      },
    ],
    targets: ['v2-inversion', 'finit-verb-second'],
    cefr: 'A2',
    exams: ['PD2', 'PD3'],
    takeaway:
      'Any constituent can be fronted — a time phrase is just as legal in the Forfelt as the subject.',
  },

  // ─── The ikke-regel in subordinate clauses ──────────────────────────────
  {
    id: 'ex-fordi-ikke',
    clause: 'ledsætning',
    gloss: '…because I cannot come tomorrow.',
    tokens: [
      t('w1', 'fordi'),
      t('w2', 'jeg'),
      t('w3', 'ikke'),
      t('w4', 'kan'),
      t('w5', 'komme'),
      t('w6', 'i morgen', true),
    ],
    solution: {
      konjunktional: ['w1'],
      subjekt: ['w2'],
      centraladverbial: ['w3'],
      finitVerbum: ['w4'],
      infinitVerbum: ['w5'],
      indholdsadverbial: ['w6'],
    },
    targets: ['ikke-regel', 'verb-cluster-order'],
    cefr: 'B1',
    exams: ['PD3'],
    takeaway:
      'Inside a ledsætning, "ikke" jumps in front of the finite verb. Compare the main clause: "Jeg kan ikke komme."',
  },
  {
    id: 'ex-om-tid',
    clause: 'ledsætning',
    gloss: '…whether he does not have time today.',
    tokens: [
      t('w1', 'om'),
      t('w2', 'han'),
      t('w3', 'ikke'),
      t('w4', 'har'),
      t('w5', 'tid'),
      t('w6', 'i dag', true),
    ],
    solution: {
      konjunktional: ['w1'],
      subjekt: ['w2'],
      centraladverbial: ['w3'],
      finitVerbum: ['w4'],
      objekt: ['w5'],
      indholdsadverbial: ['w6'],
    },
    targets: ['ikke-regel'],
    cefr: 'B1',
    exams: ['PD3'],
    takeaway:
      '"om" opens a subordinate clause, so the adverb precedes the verb — exactly as after "fordi", "hvis", "at", "når".',
  },
  {
    id: 'ex-hvis-aldrig',
    clause: 'ledsætning',
    gloss: '…if you never answer the letter.',
    tokens: [
      t('w1', 'hvis'),
      t('w2', 'du'),
      t('w3', 'aldrig'),
      t('w4', 'svarer'),
      t('w5', 'på brevet', true),
    ],
    solution: {
      konjunktional: ['w1'],
      subjekt: ['w2'],
      centraladverbial: ['w3'],
      finitVerbum: ['w4'],
      indholdsadverbial: ['w5'],
    },
    targets: ['ikke-regel'],
    cefr: 'B1',
    exams: ['PD3'],
    takeaway:
      'The rule is about the class of adverb, not the word "ikke" — "aldrig", "altid", "måske" and "kun" all behave the same way.',
  },

  // ─── Verb cluster splitting ─────────────────────────────────────────────
  {
    id: 'ex-har-spist',
    clause: 'helsætning',
    gloss: 'I have not eaten breakfast today.',
    tokens: [
      t('w1', 'jeg'),
      t('w2', 'har'),
      t('w3', 'ikke'),
      t('w4', 'spist'),
      t('w5', 'morgenmad'),
      t('w6', 'i dag', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      centraladverbial: ['w3'],
      infinitVerbum: ['w4'],
      objekt: ['w5'],
      indholdsadverbial: ['w6'],
    },
    alternatives: [
      {
        forfelt: ['w6'],
        finitVerbum: ['w2'],
        subjekt: ['w1'],
        centraladverbial: ['w3'],
        infinitVerbum: ['w4'],
        objekt: ['w5'],
      },
    ],
    targets: ['verb-cluster-order', 'central-vs-content-adverbial'],
    cefr: 'B1',
    exams: ['PD2', 'PD3'],
    takeaway:
      '"har spist" is not a block. The adverb lands between the two halves — that is what the schema is showing you.',
  },
  {
    id: 'ex-vil-gerne',
    clause: 'helsætning',
    gloss: 'She would like to buy a new bicycle.',
    tokens: [
      t('w1', 'hun'),
      t('w2', 'vil'),
      t('w3', 'gerne'),
      t('w4', 'købe'),
      t('w5', 'en ny cykel', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      centraladverbial: ['w3'],
      infinitVerbum: ['w4'],
      objekt: ['w5'],
    },
    targets: ['verb-cluster-order'],
    cefr: 'A2',
    exams: ['PD2', 'PD3'],
    takeaway:
      '"gerne" sits in the central slot, splitting "vil" from "købe" — the standard shape of every modal sentence.',
  },

  // ─── Adverbial type discrimination ──────────────────────────────────────
  {
    id: 'ex-kantinen',
    clause: 'helsætning',
    gloss: 'I never eat in the canteen.',
    tokens: [
      t('w1', 'jeg'),
      t('w2', 'spiser'),
      t('w3', 'aldrig'),
      t('w4', 'i kantinen', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      centraladverbial: ['w3'],
      indholdsadverbial: ['w4'],
    },
    targets: ['central-vs-content-adverbial'],
    cefr: 'B2',
    exams: ['PD3'],
    takeaway:
      'Two adverbials, two different slots: "aldrig" comments on the clause (a), "i kantinen" says where (A).',
  },
  {
    id: 'ex-maaske-hjem',
    clause: 'helsætning',
    gloss: 'He is perhaps coming home tomorrow.',
    tokens: [
      t('w1', 'han'),
      t('w2', 'kommer'),
      t('w3', 'måske'),
      t('w4', 'hjem'),
      t('w5', 'i morgen', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      centraladverbial: ['w3'],
      indholdsadverbial: ['w4', 'w5'],
    },
    targets: ['central-vs-content-adverbial'],
    cefr: 'B2',
    exams: ['PD3'],
    takeaway:
      'The content slot can hold several adverbials, and their internal order is place before time.',
  },

  // ─── Placeholder subjects ───────────────────────────────────────────────
  {
    id: 'ex-der-kommer',
    clause: 'helsætning',
    gloss: 'A bus is coming now.',
    tokens: [t('w1', 'der'), t('w2', 'kommer'), t('w3', 'en bus', true), t('w4', 'nu')],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      subjekt: ['w3'],
      indholdsadverbial: ['w4'],
    },
    targets: ['subject-required', 'finit-verb-second'],
    cefr: 'A2',
    exams: ['PD1', 'PD2', 'PD3'],
    takeaway:
      '"Der" is a placeholder holding the Forfelt open so the real subject can follow the verb.',
  },
  {
    id: 'ex-det-regner',
    clause: 'helsætning',
    gloss: 'It is raining a lot today.',
    tokens: [t('w1', 'det'), t('w2', 'regner'), t('w3', 'meget'), t('w4', 'i dag', true)],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      indholdsadverbial: ['w3', 'w4'],
    },
    alternatives: [
      {
        forfelt: ['w4'],
        finitVerbum: ['w2'],
        subjekt: ['w1'],
        indholdsadverbial: ['w3'],
      },
    ],
    targets: ['subject-required'],
    cefr: 'A1',
    exams: ['PD1', 'PD2', 'PD3'],
    takeaway:
      'Danish has no subjectless clause. Weather verbs take the dummy subject "det".',
  },

  // ─── Complex sentences: double objects ──────────────────────────────────
  {
    id: 'ex-sendte-chef-mail',
    clause: 'helsætning',
    gloss: 'She sent her boss an email yesterday.',
    tokens: [
      t('w1', 'hun'),
      t('w2', 'sendte'),
      t('w3', 'sin chef', true),
      t('w4', 'en mail', true),
      t('w5', 'i går', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      objekt: ['w3', 'w4'],
      indholdsadverbial: ['w5'],
    },
    alternatives: [
      {
        forfelt: ['w5'],
        finitVerbum: ['w2'],
        subjekt: ['w1'],
        objekt: ['w3', 'w4'],
      },
    ],
    targets: ['finit-verb-second', 'object-order'],
    cefr: 'B2',
    exams: ['PD3'],
    takeaway:
      'Two objects, fixed order: the receiver ("sin chef") before the thing sent ("en mail") — the same order English uses here.',
  },
  {
    id: 'ex-vil-give-raad',
    clause: 'helsætning',
    gloss: 'I would like to give you a good piece of advice.',
    tokens: [
      t('w1', 'jeg'),
      t('w2', 'vil'),
      t('w3', 'gerne'),
      t('w4', 'give'),
      t('w5', 'dig'),
      t('w6', 'et godt råd', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      centraladverbial: ['w3'],
      infinitVerbum: ['w4'],
      objekt: ['w5', 'w6'],
    },
    targets: ['verb-cluster-order', 'object-order'],
    cefr: 'B2',
    exams: ['PD3'],
    takeaway:
      'The object order holds even when the verb is split by a modal: "give dig et godt råd", receiver first.',
  },
  {
    id: 'ex-laereren-eleverne',
    clause: 'helsætning',
    gloss: 'Yesterday the teacher gave the students a difficult assignment.',
    tokens: [
      t('w1', 'i går', true),
      t('w2', 'gav'),
      t('w3', 'læreren'),
      t('w4', 'eleverne'),
      t('w5', 'en svær opgave', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      subjekt: ['w3'],
      objekt: ['w4', 'w5'],
    },
    alternatives: [
      {
        forfelt: ['w3'],
        finitVerbum: ['w2'],
        objekt: ['w4', 'w5'],
        indholdsadverbial: ['w1'],
      },
    ],
    targets: ['v2-inversion', 'object-order'],
    cefr: 'B2',
    exams: ['PD3'],
    takeaway:
      'Two rules at once: fronting "i går" pushes the subject after the verb, and the two objects still need their own fixed order.',
  },

  // ─── Complex sentences: stacked content adverbials ──────────────────────
  {
    id: 'ex-cyklede-skole',
    clause: 'helsætning',
    gloss: 'She cycled quickly to school every day.',
    tokens: [
      t('w1', 'hun'),
      t('w2', 'cyklede'),
      t('w3', 'hurtigt'),
      t('w4', 'til skole', true),
      t('w5', 'hver dag', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      indholdsadverbial: ['w3', 'w4', 'w5'],
    },
    targets: ['adverbial-order'],
    cefr: 'B2',
    exams: ['PD3'],
    takeaway:
      'Three adverbials in one slot, one fixed sequence: manner, then place, then time.',
  },
  {
    id: 'ex-talte-telefonen',
    clause: 'helsætning',
    gloss: 'He spoke calmly on the phone last night.',
    tokens: [
      t('w1', 'han'),
      t('w2', 'talte'),
      t('w3', 'roligt'),
      t('w4', 'i telefonen', true),
      t('w5', 'i aftes', true),
    ],
    solution: {
      forfelt: ['w1'],
      finitVerbum: ['w2'],
      indholdsadverbial: ['w3', 'w4', 'w5'],
    },
    targets: ['adverbial-order'],
    cefr: 'B2',
    exams: ['PD3'],
    takeaway:
      'Same sequence regardless of topic: how he spoke, where, then when.',
  },

  // ─── Complex sentences: relative clauses with "som" ─────────────────────
  {
    id: 'ex-som-ikke-loese',
    clause: 'ledsætning',
    gloss: '…that I cannot solve.',
    tokens: [t('w1', 'som'), t('w2', 'jeg'), t('w3', 'ikke'), t('w4', 'kan'), t('w5', 'løse')],
    solution: {
      konjunktional: ['w1'],
      subjekt: ['w2'],
      centraladverbial: ['w3'],
      finitVerbum: ['w4'],
      infinitVerbum: ['w5'],
    },
    targets: ['relative-clause', 'ikke-regel', 'verb-cluster-order'],
    cefr: 'B2',
    exams: ['PD3'],
    takeaway:
      '"Som" opens a relative clause exactly like "fordi" opens a causal one — same schema, same rules, including where "ikke" goes.',
  },
  {
    id: 'ex-som-laeste-igaar',
    clause: 'ledsætning',
    gloss: '…that I read yesterday.',
    tokens: [t('w1', 'som'), t('w2', 'jeg'), t('w3', 'læste'), t('w4', 'i går', true)],
    solution: {
      konjunktional: ['w1'],
      subjekt: ['w2'],
      finitVerbum: ['w3'],
      indholdsadverbial: ['w4'],
    },
    targets: ['relative-clause'],
    cefr: 'B1',
    exams: ['PD3'],
    takeaway:
      'A one-word relative pronoun still opens a full subordinate clause — "som" fills the konjunktional slot on its own.',
  },
];

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

/** Exercises that train a given rule. */
export function exercisesForRule(ruleId: string): Exercise[] {
  return EXERCISES.filter((e) => e.targets.includes(ruleId as never));
}
