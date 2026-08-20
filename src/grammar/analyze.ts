/**
 * The diagnostic engine.
 *
 * Comparing a learner's placement to the answer key tells you *that* they are
 * wrong. This module works out *why* — which named rule the arrangement
 * violates — so the feedback can be a lesson instead of a buzzer.
 *
 * Diagnosis is ordered: we report the most structurally upstream error first,
 * because fixing verb position often fixes three downstream slots at once and
 * a learner shown five simultaneous errors learns none of them.
 */

import { fieldsFor, type ClauseType, type FieldId } from './fields';
import { ALL_RULE_IDS, RULES, type RuleId } from './rules';
import type { Diagnosis, Evaluation, Exercise, Placement, Token } from './types';

function tokenText(ex: Exercise, id: string): string {
  return ex.tokens.find((t) => t.id === id)?.text ?? id;
}

function join(ex: Exercise, ids: string[]): string {
  return ids.map((id) => tokenText(ex, id)).join(' ');
}

/** Normalise a placement so comparison ignores empty fields. */
function normalize(p: Placement): Placement {
  const out: Placement = {};
  for (const [k, v] of Object.entries(p)) {
    if (v && v.length) out[k as FieldId] = [...v];
  }
  return out;
}

function samePlacement(a: Placement, b: Placement): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  const ka = Object.keys(na).sort();
  const kb = Object.keys(nb).sort();
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
  return ka.every((k) => {
    const va = na[k as FieldId]!;
    const vb = nb[k as FieldId]!;
    return va.length === vb.length && va.every((t, i) => t === vb[i]);
  });
}

/** Which field did the answer key put this token in? */
function expectedField(solution: Placement, tokenId: string): FieldId | undefined {
  for (const [f, ids] of Object.entries(solution)) {
    if (ids?.includes(tokenId)) return f as FieldId;
  }
  return undefined;
}

function fieldOf(placement: Placement, tokenId: string): FieldId | undefined {
  for (const [f, ids] of Object.entries(placement)) {
    if (ids?.includes(tokenId)) return f as FieldId;
  }
  return undefined;
}

/** Token ids the learner has placed anywhere. */
function placedIds(p: Placement): string[] {
  return Object.values(p).flatMap((v) => v ?? []);
}

/**
 * Rendered word order implied by a placement, following the schema's field
 * order for the clause type. This is what the learner's sentence would read as.
 */
export function renderSentence(ex: Exercise, p: Placement): string {
  const order = fieldsFor(ex.clause);
  const words: string[] = [];
  for (const f of order) {
    for (const id of p[f.id] ?? []) words.push(tokenText(ex, id));
  }
  if (!words.length) return '';
  const s = words.join(' ');
  return ex.clause === 'helsætning'
    ? s.charAt(0).toUpperCase() + s.slice(1) + '.'
    : s;
}

/** Index of a field within its clause's schema order. */
function slotIndex(clause: ClauseType, id: FieldId): number {
  return fieldsFor(clause).findIndex((f) => f.id === id);
}

export function evaluate(ex: Exercise, placement: Placement): Evaluation {
  const candidates = [ex.solution, ...(ex.alternatives ?? [])];
  const matchIdx = candidates.findIndex((c) => samePlacement(c, placement));

  if (matchIdx >= 0) {
    return {
      correct: true,
      viaAlternative: matchIdx > 0,
      diagnoses: [],
      accuracy: 1,
    };
  }

  // Diagnose against whichever accepted answer the learner came closest to —
  // grading a fronted-adverbial attempt against a subject-first key would
  // produce nonsense feedback.
  const best = candidates.reduce(
    (acc, cand) => {
      const score = ex.tokens.filter(
        (t) => fieldOf(placement, t.id) === expectedField(cand, t.id),
      ).length;
      return score > acc.score ? { cand, score } : acc;
    },
    { cand: ex.solution, score: -1 },
  );

  const solution = best.cand;
  const accuracy = ex.tokens.length ? best.score / ex.tokens.length : 0;
  const diagnoses = diagnose(ex, placement, solution);

  return { correct: false, viaAlternative: false, diagnoses, accuracy };
}

function diagnose(ex: Exercise, p: Placement, solution: Placement): Diagnosis[] {
  const out: Diagnosis[] = [];
  const clause = ex.clause;
  const seen = new Set<string>();

  const push = (d: Diagnosis) => {
    const key = d.ruleId + '|' + d.tokenIds.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      out.push(d);
    }
  };

  const placed = placedIds(p);
  const unplaced = ex.tokens.filter((t) => !placed.includes(t.id));

  // ---- Unfinished board -------------------------------------------------
  if (unplaced.length) {
    push({
      ruleId: 'finit-verb-second',
      severity: 'nuance',
      message: `Still to place: ${unplaced.map((t) => `"${t.text}"`).join(', ')}. Every word has a home in the schema.`,
      fields: [],
      tokenIds: unplaced.map((t) => t.id),
    });
  }

  // ---- Forfelt overloaded (main clause only) ----------------------------
  const forfelt = p.forfelt ?? [];
  if (clause === 'helsætning' && forfelt.length > 1) {
    push({
      ruleId: 'forfelt-single',
      severity: 'error',
      message: `You put ${forfelt.length} constituents in the Forfelt — "${join(ex, forfelt)}". Only one may stand before the finite verb, otherwise the verb is no longer second.`,
      fields: ['forfelt', 'finitVerbum'],
      tokenIds: forfelt,
    });
  }

  // ---- Finite verb misplaced -------------------------------------------
  const finiteExpected = solution.finitVerbum ?? [];
  for (const id of finiteExpected) {
    const actual = fieldOf(p, id);
    if (actual && actual !== 'finitVerbum') {
      if (clause === 'helsætning') {
        push({
          ruleId: 'finit-verb-second',
          severity: 'error',
          message: `"${tokenText(ex, id)}" carries the tense, so it is the finite verb — in a main clause it belongs in slot 2, not in the ${labelOf(clause, actual)}.`,
          fields: ['finitVerbum', actual],
          tokenIds: [id],
        });
      } else {
        push({
          ruleId: 'verb-cluster-order',
          severity: 'error',
          message: `"${tokenText(ex, id)}" is the finite verb and belongs in the v slot, after the subject and any central adverb.`,
          fields: ['finitVerbum', actual],
          tokenIds: [id],
        });
      }
    }
  }

  // ---- The ikke-regel: central adverb vs finite verb in a ledsætning ----
  if (clause === 'ledsætning') {
    // The failure mode to catch: the adverb landed in a slot that renders
    // after the finite verb — i.e. the learner applied the main-clause
    // pattern inside a subordinate clause.
    for (const id of solution.centraladverbial ?? []) {
      const actual = fieldOf(p, id);
      if (actual && actual !== 'centraladverbial') {
        const afterVerb =
          slotIndex(clause, actual) > slotIndex(clause, 'finitVerbum');
        push({
          ruleId: afterVerb ? 'ikke-regel' : 'central-vs-content-adverbial',
          severity: 'error',
          message: afterVerb
            ? `In a subordinate clause "${tokenText(ex, id)}" comes BEFORE the finite verb — "…${solutionPreview(ex, solution)}". You placed it after, which is the main-clause pattern.`
            : `"${tokenText(ex, id)}" is a sentence adverb, so it takes the central slot (a), not the ${labelOf(clause, actual)}.`,
          fields: ['centraladverbial', 'finitVerbum'],
          tokenIds: [id],
        });
      }
    }
  }

  // ---- Inversion in a main clause --------------------------------------
  if (clause === 'helsætning') {
    const solForfelt = solution.forfelt ?? [];
    const solSubject = solution.subjekt ?? [];
    const subjectIsFronted = solForfelt.some((id) =>
      (solution.subjekt ?? []).includes(id),
    );

    // Learner put the subject in the Forfelt when the key fronts something else.
    for (const id of solSubject) {
      const actual = fieldOf(p, id);
      if (actual === 'forfelt' && !subjectIsFronted && solForfelt.length) {
        push({
          ruleId: 'v2-inversion',
          severity: 'error',
          message: `"${join(ex, solForfelt)}" is what this sentence fronts, so the subject "${tokenText(ex, id)}" moves to the right of the verb. Danish inverts whenever the Forfelt holds something other than the subject.`,
          fields: ['forfelt', 'finitVerbum', 'subjekt'],
          tokenIds: [id, ...solForfelt],
        });
      }
    }
  }

  // ---- Non-finite verb stranded ----------------------------------------
  for (const id of solution.infinitVerbum ?? []) {
    const actual = fieldOf(p, id);
    if (actual && actual !== 'infinitVerbum') {
      push({
        ruleId: 'verb-cluster-order',
        severity: 'error',
        message: `"${tokenText(ex, id)}" is non-finite — it waits in the V slot, separated from its finite partner. Danish splits the verb group; it is not one block as in English.`,
        fields: ['finitVerbum', 'infinitVerbum'],
        tokenIds: [id],
      });
    }
  }

  // ---- Two objects: indirect before direct -------------------------------
  const objExpected = solution.objekt ?? [];
  const objActual = p.objekt ?? [];
  if (objExpected.length === 2 && objActual.length === 2) {
    if (objActual[0] !== objExpected[0]) {
      push({
        ruleId: 'object-order',
        severity: 'error',
        message: `Two objects, wrong order — the receiver "${tokenText(ex, objExpected[0])}" (indirect object) belongs before "${tokenText(ex, objExpected[1])}" (direct object), not after it.`,
        fields: ['objekt'],
        tokenIds: objExpected,
      });
    }
  }

  // ---- Adverbial type confusion (main clause) ---------------------------
  for (const id of solution.indholdsadverbial ?? []) {
    const actual = fieldOf(p, id);
    if (actual === 'centraladverbial') {
      push({
        ruleId: 'central-vs-content-adverbial',
        severity: 'error',
        message: `"${tokenText(ex, id)}" describes how, where or when — that is a content adverbial (A) and it sits late, not in the central slot.`,
        fields: ['centraladverbial', 'indholdsadverbial'],
        tokenIds: [id],
      });
    }
  }
  for (const id of solution.centraladverbial ?? []) {
    const actual = fieldOf(p, id);
    if (actual === 'indholdsadverbial' && clause === 'helsætning') {
      push({
        ruleId: 'central-vs-content-adverbial',
        severity: 'error',
        message: `"${tokenText(ex, id)}" comments on the whole clause, so it is a central adverbial (a) and sits right after the subject.`,
        fields: ['centraladverbial', 'indholdsadverbial'],
        tokenIds: [id],
      });
    }
  }

  // ---- Missing subject --------------------------------------------------
  if (!(p.subjekt ?? []).length && (solution.subjekt ?? []).length) {
    const missing = (solution.subjekt ?? []).filter((id) => !placed.includes(id));
    if (missing.length) {
      push({
        ruleId: 'subject-required',
        severity: 'error',
        message: 'Danish never drops the subject — the n slot has to be filled, even by a placeholder like "det" or "der".',
        fields: ['subjekt'],
        tokenIds: missing,
      });
    }
  }

  // ---- Same words, wrong internal order ----------------------------------
  // A multi-item field (double object, stacked adverbials, a relative clause's
  // own multi-word phrases) can have every token in the *right field* while
  // still being wrong, because Danish also fixes the order *within* that
  // field. Field-membership checks above are blind to this — every id is
  // "correctly" placed — so without this pass a sentence like "hun cyklede
  // hver dag hurtigt til skole" would silently produce zero diagnoses.
  const sameSetWrongOrder = (field: FieldId): boolean => {
    const exp = solution[field] ?? [];
    const act = p[field] ?? [];
    if (exp.length < 2 || act.length !== exp.length) return false;
    const sameSet = [...exp].sort().join(',') === [...act].sort().join(',');
    const sameOrder = exp.every((id, i) => id === act[i]);
    return sameSet && !sameOrder;
  };

  if (sameSetWrongOrder('indholdsadverbial')) {
    const exp = solution.indholdsadverbial!;
    push({
      ruleId: 'adverbial-order',
      severity: 'error',
      message: `All the right words are in the content-adverbial slot, but in the wrong sequence. Danish orders them manner, then place, then time: "${join(ex, exp)}".`,
      fields: ['indholdsadverbial'],
      tokenIds: exp,
    });
  }
  if (sameSetWrongOrder('objekt') && !out.some((d) => d.ruleId === 'object-order')) {
    const exp = solution.objekt!;
    push({
      ruleId: 'object-order',
      severity: 'error',
      message: `Both objects are in the right slot but swapped — the receiver comes first: "${join(ex, exp)}".`,
      fields: ['objekt'],
      tokenIds: exp,
    });
  }

  // ---- Generic fallback -------------------------------------------------
  if (!out.length) {
    const misplaced = ex.tokens
      .map((t) => ({
        token: t,
        actual: fieldOf(p, t.id),
        expected: expectedField(solution, t.id),
      }))
      .filter((m) => m.actual && m.expected && m.actual !== m.expected);

    if (misplaced.length) {
      const involved = misplaced.flatMap((m) => [m.actual!, m.expected!]);
      push({
        // Attribute to whichever rule actually governs the fields in play.
        // Naming a rule the learner did not break teaches them the wrong
        // lesson, which is worse than declining to name one.
        ruleId: bestRuleForFields(involved, ex.targets),
        severity: 'error',
        message: `Not quite — ${misplaced.map((m) => `"${m.token.text}"`).join(', ')} ${
          misplaced.length === 1 ? 'is' : 'are'
        } in the wrong field. ${misplaced
          .map(
            (m) =>
              `"${m.token.text}" belongs in the ${labelOf(clause, m.expected!)}, not the ${labelOf(clause, m.actual!)}.`,
          )
          .join(' ')}`,
        fields: involved,
        tokenIds: misplaced.map((m) => m.token.id),
      });
    }
  }

  // Structural errors first, nuances last.
  return out.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return 0;
  });
}

/**
 * Pick the rule that best explains an error touching `fields`.
 *
 * Scored by how much of a rule's declared field set the error actually
 * involves, with the exercise's own targets used only to break ties — so a
 * misplaced adverbial is never reported as an inversion error just because
 * inversion is what the sentence was written to drill.
 */
function bestRuleForFields(fields: FieldId[], targets: RuleId[]): RuleId {
  const involved = new Set(fields);
  let best: { id: RuleId; score: number } | null = null;

  for (const id of ALL_RULE_IDS) {
    const r = RULES[id];
    const overlap = r.fields.filter((f) => involved.has(f)).length;
    if (!overlap) continue;
    // Prefer rules whose field set is *covered* by the error, not merely
    // touched by it, then prefer a rule this exercise was built to train.
    const score = overlap / r.fields.length + (targets.includes(id) ? 0.15 : 0);
    if (!best || score > best.score) best = { id, score };
  }

  return best?.id ?? targets[0] ?? 'finit-verb-second';
}

function labelOf(clause: ClauseType, id: FieldId): string {
  const f = fieldsFor(clause).find((x) => x.id === id);
  return f ? `${f.name} (${f.abbr})` : id;
}

function solutionPreview(ex: Exercise, solution: Placement): string {
  return renderSentence(ex, solution).replace(/\.$/, '');
}

/** Tokens not yet placed, in their original presentation order. */
export function trayTokens(ex: Exercise, p: Placement): Token[] {
  const placed = new Set(placedIds(p));
  return ex.tokens.filter((t) => !placed.has(t.id));
}
