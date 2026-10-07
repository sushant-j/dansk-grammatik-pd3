import { describe, expect, it } from 'vitest';
import { applyOutcome, EMPTY_STAT } from '../profile/mastery';
import { cardsFor, setProgress, toCard } from './cards';
import type { SetItem } from './types';

const item = (over: Partial<SetItem>): SetItem => ({
  id: Math.random().toString(),
  setId: 's',
  text: 'besluttet at',
  refId: null,
  meaning: null,
  context: null,
  source: null,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  ...over,
});

describe('toCard', () => {
  it('uses the deck card for a linked word, with the learner’s sentence added', () => {
    const card = toCard(item({ text: 'på grund af', refId: 'v-paa-grund-af', context: 'Det skete på grund af vejret.' }));
    expect(card.id).toBe('v-paa-grund-af');
    expect(card.glossEn).toBeTruthy();
    expect(card.own).toBeUndefined();
    expect(card.fromText?.sentence).toBe('Det skete på grund af vejret.');
  });

  it('makes the learner’s own card for anything else', () => {
    const src = { paperId: 'sim-4', part: 'lf2' as const, label: 'Sim 4 · LF2' };
    const card = toCard(item({ meaning: 'decided to', context: 'Skolen har besluttet at …', source: src }));
    expect(card).toMatchObject({ id: 'c:besluttet at', word: 'besluttet at', glossEn: 'decided to', own: true, category: 'phrase' });
    expect(card.fromText?.source).toEqual(src);
  });

  it('falls back to an own card when the linked deck word no longer exists', () => {
    expect(toCard(item({ refId: 'v-gone' })).own).toBe(true);
  });
});

describe('cardsFor', () => {
  it('makes one card per word, keeping a sentence or meaning from any copy', () => {
    const cards = cardsFor([
      item({ setId: 'a' }),
      item({ setId: 'b', text: 'Besluttet at', meaning: 'decided to', context: 'Hun har besluttet at gå.' }),
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0].fromText?.sentence).toBe('Hun har besluttet at gå.');
  });
});

describe('setProgress', () => {
  it('counts the words and the solid ones', () => {
    let solid = { ...EMPTY_STAT };
    const now = 1_700_000_000_000;
    for (let i = 0; i < 6; i++) solid = applyOutcome(solid, true, now);
    const p = setProgress([item({}), item({ text: 'fordi' })], { 'c:fordi': solid }, now);
    expect(p).toEqual({ words: 2, solid: 1 });
  });
});
