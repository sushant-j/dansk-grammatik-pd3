import { describe, expect, it } from 'vitest';
import { VOCABULARY } from '../content/vocabulary';
import { EMPTY_STAT, applyOutcome, type ItemStat } from './mastery';
import { nextWord, summarizeVocab, vocabProgress } from './vocabStore';

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
