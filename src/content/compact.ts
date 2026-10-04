/**
 * A one-line authoring format for word-order exercises.
 *
 * Writing an `Exercise` by hand means inventing token ids and then repeating
 * them in a solution object — fine for 25 sentences, error-prone for 300. In
 * this format the sentence *is* the solution: each constituent is written
 * once, in schema order, tagged with its field's Diderichsen abbreviation.
 *
 *   "F:i går | v:gik | n:jeg | a:ikke | A:på arbejde"
 *
 *   F forfelt · k konjunktional · v finit verbum · n subjekt
 *   a centraladverbial · V infinit verbum · N objekt · A indholdsadverbial
 *
 * A field holding two constituents just repeats its tag ("N:ham | N:en bog").
 * Alternatives are written the same way, using the same constituent texts.
 * A sentence with a konjunktional is a ledsætning; otherwise a helsætning.
 */

import type { FieldId } from '../grammar/fields';
import type { Exam, RuleId } from '../grammar/rules';
import type { Exercise, Placement, Token } from '../grammar/types';
import type { Level } from './levels';

export interface CompactExercise {
  id: string;
  level: Level;
  exams: Exam[];
  gloss: string;
  sentence: string;
  alternatives?: string[];
  targets: RuleId[];
  takeaway: string;
  /** False until a person has checked the Danish. */
  reviewed?: boolean;
}

const FIELD_BY_ABBR: Record<string, FieldId> = {
  F: 'forfelt',
  k: 'konjunktional',
  v: 'finitVerbum',
  n: 'subjekt',
  a: 'centraladverbial',
  V: 'infinitVerbum',
  N: 'objekt',
  A: 'indholdsadverbial',
};

interface Segment {
  field: FieldId;
  text: string;
}

function segments(line: string, id: string): Segment[] {
  return line.split('|').map((raw) => {
    const m = raw.trim().match(/^([FkvnaVNA]):\s*(.+)$/);
    if (!m) throw new Error(`${id}: cannot read "${raw.trim()}" — expected "<field>:<words>"`);
    return { field: FIELD_BY_ABBR[m[1]], text: m[2].trim() };
  });
}

function toPlacement(segs: Segment[], idsFor: (text: string) => string): Placement {
  const placement: Placement = {};
  for (const { field, text } of segs) placement[field] = [...(placement[field] ?? []), idsFor(text)];
  return placement;
}

export function fromCompact(spec: CompactExercise): Exercise {
  const main = segments(spec.sentence, spec.id);
  const tokens: Token[] = main.map(({ text }, i) => ({ id: `w${i + 1}`, text, multiword: text.includes(' ') }));

  // Map constituent text → token id. A text may occur twice ("i dag … i dag"
  // is unlikely, but "en" or "det" twice is not), so ids are handed out in order.
  const idsFor = () => {
    const used = new Set<string>();
    return (text: string) => {
      const token = tokens.find((t) => t.text === text && !used.has(t.id));
      if (!token) throw new Error(`${spec.id}: alternative uses "${text}", which is not a constituent of the sentence`);
      used.add(token.id);
      return token.id;
    };
  };

  const alternatives = (spec.alternatives ?? []).map((line) => {
    const segs = segments(line, spec.id);
    if (segs.length !== tokens.length) {
      throw new Error(`${spec.id}: alternative "${line}" has ${segs.length} constituents, the sentence has ${tokens.length}`);
    }
    return toPlacement(segs, idsFor());
  });

  return {
    id: spec.id,
    clause: main.some((s) => s.field === 'konjunktional') ? 'ledsætning' : 'helsætning',
    gloss: spec.gloss,
    tokens,
    solution: toPlacement(main, idsFor()),
    ...(alternatives.length ? { alternatives } : {}),
    targets: spec.targets,
    level: spec.level,
    exams: spec.exams,
    takeaway: spec.takeaway,
    ...(spec.reviewed === undefined ? {} : { reviewed: spec.reviewed }),
  };
}
