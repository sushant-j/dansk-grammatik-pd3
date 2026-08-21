/**
 * The rule catalogue.
 *
 * Every piece of feedback in this app points at a rule in here — never a bare
 * "wrong". A learner who moves a word to the correct slot without knowing which
 * rule forced it there has learned nothing transferable, which is precisely the
 * failure mode of tap-the-tile apps.
 *
 * Rules are also the unit of mastery: the grammar map in profile/ tracks
 * progress per rule id, so a gap the learner can see is a gap they can close.
 */

import type { FieldId } from './fields';

export type RuleId =
  | 'v2-inversion'
  | 'ikke-regel'
  | 'forfelt-single'
  | 'finit-verb-second'
  | 'subject-required'
  | 'verb-cluster-order'
  | 'central-vs-content-adverbial'
  | 'object-order'
  | 'relative-clause'
  | 'adverbial-order';

export type Exam = 'PD1' | 'PD2' | 'PD3' | 'FVU';

export interface RuleExample {
  wrong?: string;
  right: string;
  /** Why this pair matters, one line. */
  note: string;
}

export interface Rule {
  id: RuleId;
  /** Danish name — the term a teacher or textbook would use. */
  da: string;
  /** English name. */
  en: string;
  /** One-sentence statement of the rule itself. */
  statement: string;
  /** The longer explanation shown on the rule card. */
  explanation: string;
  /** Why learners get this wrong — usually L1 interference. */
  whyHard: string;
  examples: RuleExample[];
  /** Fields of the schema this rule constrains — used to highlight the board. */
  fields: FieldId[];
  cefr: 'A1' | 'A2' | 'B1' | 'B2';
  exams: Exam[];
}

export const RULES: Record<RuleId, Rule> = {
  'v2-inversion': {
    id: 'v2-inversion',
    da: 'Inversion (omvendt ordstilling)',
    en: 'Inversion after a fronted element',
    statement:
      'If anything other than the subject occupies the Forfelt — the one slot before the verb — the subject moves to the right of the finite verb instead.',
    explanation:
      'Danish permits almost any constituent in the Forfelt (front slot) — a time expression, a place, an object, even a whole subordinate clause. But the finite verb refuses to move: it stays in slot 2. So when you front something that is not the subject, the subject is pushed out of first position and lands directly after the verb. The schema makes this mechanical rather than mysterious: the Forfelt holds exactly one thing, the verb sits in the next slot, and whatever is left over falls into place.',
    whyHard:
      'English fronts freely without touching the subject–verb order ("Yesterday I went home"), so the inversion feels gratuitous and is easy to forget under time pressure in the written exam.',
    examples: [
      {
        wrong: 'I går jeg gik i skole.',
        right: 'I går gik jeg i skole.',
        note: '"I går" takes the front slot, so "gik" must come before "jeg".',
      },
      {
        wrong: 'Derfor jeg kan ikke komme.',
        right: 'Derfor kan jeg ikke komme.',
        note: 'Fronted "derfor" triggers inversion just like any other adverbial.',
      },
      {
        right: 'Jeg gik i skole i går.',
        note: 'No inversion here — the subject itself is in the front slot, so nothing is displaced.',
      },
    ],
    fields: ['forfelt', 'finitVerbum', 'subjekt'],
    cefr: 'A2',
    exams: ['PD2', 'PD3'],
  },

  'ikke-regel': {
    id: 'ikke-regel',
    da: 'Ikke-reglen i ledsætninger',
    en: 'Adverb placement in subordinate clauses',
    statement:
      'In a subordinate clause the central adverb (ikke, aldrig, altid, måske…) goes BEFORE the finite verb.',
    explanation:
      'This is the mirror image of the main clause, and it is the clearest reason to learn the two schemas side by side. In a main clause the finite verb is nailed to slot 2 and the adverb follows it: "Jeg kan ikke komme." Inside a subordinate clause the verb loses that privileged position, and the adverb slides in front of it: "…fordi jeg ikke kan komme." Same words, same meaning, opposite order — the only thing that changed is which schema applies.',
    whyHard:
      'Learners internalise the main-clause pattern first because it is far more frequent, then apply it everywhere. Danes notice this error immediately, and it is heavily weighted in the PD3 written assessment.',
    examples: [
      {
        wrong: 'Jeg siger det, fordi jeg kan ikke komme.',
        right: 'Jeg siger det, fordi jeg ikke kan komme.',
        note: 'After "fordi", the adverb "ikke" precedes the finite verb "kan".',
      },
      {
        wrong: 'Hun spørger, om han har ikke tid.',
        right: 'Hun spørger, om han ikke har tid.',
        note: '"om" opens a subordinate clause, so the same reversal applies.',
      },
      {
        right: 'Han kan ikke komme.',
        note: 'As a standalone main clause, the adverb correctly follows the verb.',
      },
    ],
    fields: ['konjunktional', 'subjekt', 'centraladverbial', 'finitVerbum'],
    cefr: 'B1',
    exams: ['PD3'],
  },

  'forfelt-single': {
    id: 'forfelt-single',
    da: 'Kun ét led i forfeltet',
    en: 'One constituent only in the front slot',
    statement: 'The Forfelt — the one slot before the verb — holds exactly one constituent, never two.',
    explanation:
      'A constituent can be long ("den mand jeg mødte i går") but it still counts as one unit. Placing two separate elements before the finite verb — a time phrase and the subject, say — breaks the V2 rule, because the verb is then no longer second.',
    whyHard:
      'A constituent is not a word, so learners under-count: "i går" is one unit, but so is "hele den lange weekend". Deciding what is one unit is the skill being trained.',
    examples: [
      {
        wrong: 'I går jeg gik i skole.',
        right: 'I går gik jeg i skole.',
        note: '"I går" and "jeg" are two constituents; only one may precede the verb.',
      },
      {
        right: 'Hver eneste morgen drikker jeg kaffe.',
        note: '"Hver eneste morgen" is long but is still a single constituent.',
      },
    ],
    fields: ['forfelt'],
    cefr: 'A2',
    exams: ['PD2', 'PD3'],
  },

  'finit-verb-second': {
    id: 'finit-verb-second',
    da: 'Verbet på plads nummer to (V2)',
    en: 'The finite verb sits in slot two',
    statement:
      'In any main clause the finite verb occupies the second slot — no exceptions.',
    explanation:
      'V2 is the backbone of Danish word order and the anchor of the whole schema. Everything else is arranged around it: one constituent before it, everything else after. Once the verb is placed, most other decisions follow mechanically. If a sentence sounds wrong to a Dane and you cannot say why, check the verb position first.',
    whyHard:
      'Languages with freer or subject-first order let the verb drift. Under exam pressure learners revert to their L1 template and the verb slips to slot three.',
    examples: [
      {
        wrong: 'Om sommeren vi tager til Skagen.',
        right: 'Om sommeren tager vi til Skagen.',
        note: 'The verb must be second, so it precedes the subject.',
      },
      {
        right: 'Vi tager til Skagen om sommeren.',
        note: 'Also correct — the verb is still in slot 2, just with the subject in front.',
      },
    ],
    fields: ['forfelt', 'finitVerbum'],
    cefr: 'A2',
    exams: ['PD1', 'PD2', 'PD3'],
  },

  'subject-required': {
    id: 'subject-required',
    da: 'Subjektet skal med',
    en: 'The subject cannot be dropped',
    statement:
      'Danish requires an explicit subject, even when it carries no meaning (der, det).',
    explanation:
      'Unlike Spanish, Italian or Polish, Danish has no pro-drop. Every finite clause needs a subject in the schema, and where there is no meaningful one the language inserts a placeholder: "Det regner", "Der kommer en bus".',
    whyHard:
      'Speakers of pro-drop languages omit the subject because their L1 recovers it from the verb ending — but Danish verb endings carry no person information at all.',
    examples: [
      {
        wrong: 'Regner meget i dag.',
        right: 'Det regner meget i dag.',
        note: 'Weather verbs still need the placeholder subject "det".',
      },
      {
        wrong: 'Kommer en bus nu.',
        right: 'Der kommer en bus nu.',
        note: '"Der" fills the subject slot when the real subject follows the verb.',
      },
    ],
    fields: ['subjekt'],
    cefr: 'A1',
    exams: ['PD1', 'PD2', 'PD3'],
  },

  'verb-cluster-order': {
    id: 'verb-cluster-order',
    da: 'Rækkefølgen i verballeddet',
    en: 'Order inside the verb cluster',
    statement:
      'The finite verb is separated from its infinitives and participles; the non-finite parts sit later, in the V slot.',
    explanation:
      'Danish splits the verb group across the schema. The tensed part ("har", "vil", "kan") occupies the finite slot, while the participle or infinitive ("spist", "gå", "komme") waits in the non-finite slot — with the subject and the central adverb in between. This is why "har" and "spist" so often end up far apart.',
    whyHard:
      'Learners treat "har spist" as one indivisible chunk, as it is in English, and then have nowhere to put "ikke".',
    examples: [
      {
        wrong: 'Jeg har spist ikke morgenmad.',
        right: 'Jeg har ikke spist morgenmad.',
        note: 'The adverb lands between the finite "har" and the participle "spist".',
      },
      {
        right: 'Hun vil gerne købe en ny cykel.',
        note: '"vil" is finite; "købe" waits in the non-finite slot after the adverb.',
      },
    ],
    fields: ['finitVerbum', 'centraladverbial', 'infinitVerbum'],
    cefr: 'B1',
    exams: ['PD2', 'PD3'],
  },

  'central-vs-content-adverbial': {
    id: 'central-vs-content-adverbial',
    da: 'Centraladverbial eller indholdsadverbial?',
    en: 'Two kinds of adverbial, two different slots',
    statement:
      'Sentence adverbs (ikke, altid, måske) take the central slot; adverbials of manner, place and time take the content slot at the end.',
    explanation:
      'The schema has two adverbial slots and they are not interchangeable. Central adverbials comment on the truth of the whole clause and sit early, right after the subject. Content adverbials describe how, where or when and sit late. Mixing them up produces sentences that are grammatical-sounding but subtly off, which is exactly the kind of error that caps a written score.',
    whyHard:
      'Both are called "adverbs" in most school grammars, so learners assume there is one slot for them. The distinction is semantic, not morphological.',
    examples: [
      {
        wrong: 'Jeg spiser i kantinen aldrig.',
        right: 'Jeg spiser aldrig i kantinen.',
        note: '"aldrig" is a sentence adverb → central slot; "i kantinen" is place → content slot.',
      },
      {
        right: 'Han kommer måske hjem i morgen.',
        note: '"måske" central, "hjem" and "i morgen" content — in that order.',
      },
    ],
    fields: ['centraladverbial', 'indholdsadverbial'],
    cefr: 'B2',
    exams: ['PD3'],
  },

  'object-order': {
    id: 'object-order',
    da: 'Rækkefølgen af to objekter',
    en: 'Indirect object before direct object',
    statement:
      'When a sentence has two objects, the indirect object (the receiver) comes before the direct object (the thing given).',
    explanation:
      'The object slot can hold more than one constituent, and when it does, Danish has a fixed internal order: who receives it, then what is received. "Jeg gav ham bogen" — "ham" (indirect, the receiver) precedes "bogen" (direct, the thing handed over). This is the same order English uses in "I gave him the book", which makes it one of the easier complex-sentence rules to transfer — but it still trips learners who default to the direct object first because that is the constituent that feels more central to the action.',
    whyHard:
      'Some languages mark the indirect object with a preposition or case ending, which frees its position. Danish marks it by word order alone, so getting the order backwards is not stylistically odd — it is simply wrong.',
    examples: [
      {
        wrong: 'Jeg gav bogen ham.',
        right: 'Jeg gav ham bogen.',
        note: 'The receiver "ham" comes first; the thing given, "bogen", comes second.',
      },
      {
        right: 'Hun sendte sin chef en mail.',
        note: '"sin chef" (indirect) before "en mail" (direct) — the same pattern with full nouns.',
      },
    ],
    fields: ['objekt'],
    cefr: 'B2',
    exams: ['PD3'],
  },

  'relative-clause': {
    id: 'relative-clause',
    da: 'Relativsætning med "som"',
    en: 'Object relative clauses with "som"',
    statement:
      '"Som" opens a relative clause — which in Danish is a subordinate clause (a "ledsætning"), so subject and any adverb still come before the finite verb, exactly as after "fordi" or "hvis".',
    explanation:
      'A relative clause describing something ("the letter that I wrote") is a subordinate clause in Danish — a ledsætning — introduced by "som", and it obeys every rule a subordinate clause obeys, including the ikke-regel. "Som" itself occupies the same opening position as "fordi" or "hvis"; what follows it is ordinary subordinate-clause word order. Chaining a relative clause onto a main clause is one of the most reliable ways to raise a PD3 answer from a string of short sentences into one that reads as genuinely complex.',
    whyHard:
      'Learners often keep main-clause order inside the relative clause because "som" does not feel like "fordi" — it reads more like a connector than a conjunction. But the schema does not care what the word means, only what position it opens.',
    examples: [
      {
        wrong: 'Bogen, som jeg læste den i går, var god.',
        right: 'Bogen, som jeg læste i går, var god.',
        note: '"som" already stands for the object being read — a second pronoun ("den") is not needed.',
      },
      {
        right: 'Det er et problem, som jeg ikke kan løse.',
        note: 'Ordinary subordinate-clause order after "som": subject, then "ikke", then the finite verb.',
      },
    ],
    fields: ['konjunktional', 'subjekt', 'centraladverbial', 'finitVerbum'],
    cefr: 'B2',
    exams: ['PD3'],
  },

  'adverbial-order': {
    id: 'adverbial-order',
    da: 'Rækkefølge af flere indholdsadverbialer',
    en: 'Order among several content adverbials',
    statement:
      'When a sentence stacks more than one content adverbial, they go in a fixed sequence: manner, then place, then time.',
    explanation:
      'The A slot can hold several adverbials at once, and like the double object, it has its own internal order. Danish sequences them by type — how, then where, then when — regardless of how long each phrase is. "Hun cyklede hurtigt til skole hver dag": manner ("hurtigt"), place ("til skole"), time ("hver dag"). Getting every adverbial into the A slot is only half the task; a native reader also notices when they arrive in the wrong sequence.',
    whyHard:
      'This order is arbitrary from an English speaker\'s point of view — English tolerates far more freedom here — so there is no logic to reason through, only a sequence to memorise.',
    examples: [
      {
        wrong: 'Hun cyklede hver dag hurtigt til skole.',
        right: 'Hun cyklede hurtigt til skole hver dag.',
        note: 'Manner ("hurtigt") comes first among the three, time ("hver dag") last.',
      },
      {
        right: 'Han talte roligt i telefonen i aftes.',
        note: 'Manner, then place, then time — the same sequence regardless of topic.',
      },
    ],
    fields: ['indholdsadverbial'],
    cefr: 'B2',
    exams: ['PD3'],
  },
};

export const ALL_RULE_IDS = Object.keys(RULES) as RuleId[];

export function rule(id: RuleId): Rule {
  return RULES[id];
}
