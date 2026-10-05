import { describe, expect, it } from 'vitest';
import { EXAMPLES, EXAMPLE_SHARDS, containsForm, formToken, splitAtForm } from './examples';
import { VOCABULARY } from './vocabulary';

const byId = new Map(VOCABULARY.map((v) => [v.id, v]));

describe('vocabulary example sentences', () => {
  it('only covers words in the deck, and no word sits in two shards', () => {
    const seen = new Set<string>();
    for (const [shard, entries] of Object.entries(EXAMPLE_SHARDS)) {
      for (const id of Object.keys(entries)) {
        expect(byId.has(id), `${shard}: unknown id ${id}`).toBe(true);
        expect(seen.has(id), `${shard}: ${id} is in another shard too`).toBe(false);
        seen.add(id);
      }
    }
  });

  it('every sentence is a translated, punctuated sentence that shows its form', () => {
    const bad: string[] = [];
    for (const [id, list] of Object.entries(EXAMPLES)) {
      for (const ex of list) {
        const words = ex.da.trim().split(/\s+/).length;
        if (!ex.en?.trim()) bad.push(`${id}: no English for "${ex.da}"`);
        if (words < 4 || words > 25) bad.push(`${id}: ${words} words in "${ex.da}"`);
        if (!/[.!?]["”»]?$/.test(ex.da.trim())) bad.push(`${id}: no end punctuation in "${ex.da}"`);
        if (ex.form !== undefined) {
          if (/\s/.test(ex.form.trim())) bad.push(`${id}: form "${ex.form}" must be one word`);
          if (!containsForm(ex.da, ex.form)) bad.push(`${id}: "${ex.form}" not in "${ex.da}"`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('every bank word has a sentence for each of its forms, and every exam word has extra usages', () => {
    const missing: string[] = [];
    for (const w of VOCABULARY) {
      const list = w.examples ?? [];
      if (w.formList) {
        for (const form of w.formList) {
          const token = formToken(form);
          if (!list.some((ex) => ex.form?.toLowerCase() === token.toLowerCase() && containsForm(ex.da, token))) {
            missing.push(`${w.id}: ${token}`);
          }
        }
      } else if (list.length < 2) {
        missing.push(`${w.id}: ${list.length} extra usages`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('splitAtForm', () => {
  it('splits around the whole-word form, keeping the sentence’s own casing', () => {
    expect(splitAtForm('Bilen holdt stille, og bilen startede igen.', 'bilen')).toEqual({
      before: '',
      match: 'Bilen',
      after: ' holdt stille, og bilen startede igen.',
    });
  });

  it('matches a form only as a whole word, Danish letters included', () => {
    expect(splitAtForm('Han går, når han får gåden løst.', 'gå')).toBeNull();
    expect(splitAtForm('Vi bevæger os, når de bevæger sig.', 'bevæger sig')?.before).toBe('Vi ');
  });

  it('gives nothing to highlight without a form', () => {
    expect(splitAtForm('En sætning uden form.', undefined)).toBeNull();
  });
});
