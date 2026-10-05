import { describe, expect, it } from 'vitest';
import { VOCABULARY } from '../content/vocabulary';
import { EMPTY_STAT, applyOutcome, type ItemStat } from './mastery';
import { MAX_LEVEL } from '../content/levels';
import { SESSION_CATEGORIES, countByCategory, nextWord, summarizeVocab, vocabProgress } from './vocabStore';

const NOW = 1_700_000_000_000;

function statsWith(entries: Record<string, ItemStat>): Record<string, ItemStat> {
  return entries;
}

describe('vocabProgress', () => {
  it('covers every word in the deck', () => {
    expect(vocabProgress({}, NOW)).toHaveLength(VOCABULARY.length);
  });

  it('starts every word unseen', () => {
    const p = vocabProgress({}, NOW);
    expect(p.every((x) => x.level === 'unseen')).toBe(true);
  });
});

describe('summarizeVocab', () => {
  it('counts nothing mastered on a blank deck', () => {
    expect(summarizeVocab({}, NOW).mastered).toBe(0);
  });

  it('treats an unseen word as due for review', () => {
    const s = summarizeVocab({}, NOW);
    expect(s.dueForReview.length).toBe(VOCABULARY.length);
  });

  it('removes a word from the due pile once it is solid', () => {
    const id = VOCABULARY[0].id;
    let stat = { ...EMPTY_STAT };
    for (let i = 0; i < 6; i++) stat = applyOutcome(stat, true, NOW);
    const s = summarizeVocab(statsWith({ [id]: stat }), NOW);
    expect(s.dueForReview.map((p) => p.id)).not.toContain(id);
  });
});

describe('nextWord', () => {
  it('returns a real vocabulary entry', () => {
    const w = nextWord({}, undefined, NOW);
    expect(VOCABULARY.map((v) => v.id)).toContain(w.id);
  });

  it('never immediately repeats the word just reviewed', () => {
    for (let i = 0; i < 30; i++) {
      expect(nextWord({}, VOCABULARY[0].id, NOW).id).not.toBe(VOCABULARY[0].id);
    }
  });

  it('prefers a weak word over a mastered one', () => {
    let strong = { ...EMPTY_STAT };
    for (let i = 0; i < 8; i++) strong = applyOutcome(strong, true, NOW);
    const stats: Record<string, ItemStat> = {};
    for (const v of VOCABULARY) stats[v.id] = strong;
    const weakId = VOCABULARY[VOCABULARY.length - 1].id;
    stats[weakId] = { ...EMPTY_STAT };

    let hits = 0;
    const runs = 40;
    for (let i = 0; i < runs; i++) {
      if (nextWord(stats, undefined, NOW).id === weakId) hits++;
    }
    expect(hits / runs).toBeGreaterThan(0.5);
  });
});

describe('the deck follows the niveau', () => {
  it('serves no word above the learner’s niveau', () => {
    for (let i = 0; i < 40; i++) expect(nextWord({}, undefined, NOW, 1).level).toBe(1);
  });

  it('counts words up to the niveau, plus any already practised above it', () => {
    const hard = VOCABULARY.find((v) => v.level === 5)!;
    const atOne = vocabProgress({}, NOW, 1);
    expect(atOne.every((p) => VOCABULARY.find((v) => v.id === p.id)!.level === 1)).toBe(true);

    const practised = { attempts: 2, correct: 2, recent: [true, true], lastSeen: NOW, raw: 0.6 };
    expect(vocabProgress({ [hard.id]: practised }, NOW, 1).map((p) => p.id)).toContain(hard.id);
  });

  it('includes every word the grammar trainers use', () => {
    expect(VOCABULARY.some((v) => v.id === 'w-n-bil' && v.forms === 'en bil · bilen')).toBe(true);
    expect(VOCABULARY.some((v) => v.id === 'w-v-gå' && v.word === 'at gå')).toBe(true);
  });
});

describe('a vocabulary session', () => {
  it('serves only the chosen word types', () => {
    for (let i = 0; i < 40; i++) {
      const w = nextWord({}, undefined, NOW, MAX_LEVEL, { categories: ['verb', 'adjective'] });
      expect(['verb', 'adjective']).toContain(w.category);
    }
  });

  it('treats no chosen types as all of them', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(nextWord({}, undefined, NOW, MAX_LEVEL, { categories: [] }).category);
    expect(seen.size).toBeGreaterThan(1);
  });

  it('shows no word twice until every word of those types has been shown', () => {
    // The smallest type at niveau 1 keeps the run short enough to exhaust.
    const counts = countByCategory(1);
    const category = SESSION_CATEGORIES.filter((c) => counts[c] > 0).sort((a, b) => counts[a] - counts[b])[0];
    const size = counts[category];

    const served = new Set<string>();
    let last: string | undefined;
    for (let i = 0; i < size; i++) {
      const w = nextWord({}, last, NOW, 1, { categories: [category], exclude: served });
      expect(served.has(w.id)).toBe(false);
      served.add(w.id);
      last = w.id;
    }
    expect(served.size).toBe(size);

    // Exhausted: repeats are allowed rather than running out of cards.
    const again = nextWord({}, last, NOW, 1, { categories: [category], exclude: served });
    expect(served.has(again.id)).toBe(true);
  });

  it('still never serves a word above the learner’s niveau', () => {
    const served = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const w = nextWord({}, undefined, NOW, 2, { categories: ['noun'], exclude: served });
      expect(w.level).toBeLessThanOrEqual(2);
      expect(w.category).toBe('noun');
      served.add(w.id);
    }
  });

  it('with all levels open, draws from above the niveau too, and can reach every word of a type', () => {
    const verbs = VOCABULARY.filter((v) => v.category === 'verb');
    const served = new Set<string>();
    for (let i = 0; i < verbs.length; i++) {
      const w = nextWord({}, undefined, NOW, 1, { categories: ['verb'], exclude: served, allLevels: true });
      expect(w.category).toBe('verb');
      served.add(w.id);
    }
    expect(served.size).toBe(verbs.length);
    expect(verbs.some((v) => v.level > 1 && served.has(v.id))).toBe(true);
  });

  it('counts the words of each type a niveau can serve', () => {
    const counts = countByCategory(3);
    for (const c of SESSION_CATEGORIES) {
      expect(counts[c]).toBe(VOCABULARY.filter((v) => v.category === c && v.level <= 3).length);
    }
    expect(countByCategory(1).noun).toBeLessThanOrEqual(counts.noun);
  });
});
