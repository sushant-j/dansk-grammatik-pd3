import { describe, expect, it } from 'vitest';
import { cardIdFor, isPickable, matchDeck, normalise, sentenceAt, splitAtPhrase, tidy } from './match';

describe('tidy / normalise', () => {
  it('trims punctuation and spaces at the ends and collapses inner whitespace', () => {
    expect(tidy('  «besluttet\n at», ')).toBe('besluttet at');
    expect(normalise('Besluttet  AT.')).toBe('besluttet at');
  });

  it('keeps Danish letters', () => {
    expect(tidy('(Øl og æbler å)')).toBe('Øl og æbler å');
  });
});

describe('isPickable', () => {
  it('takes a word or a short phrase', () => {
    expect(isPickable('fordi')).toBe(true);
    expect(isPickable('på grund af')).toBe(true);
  });

  it('refuses nothing, and anything sentence-sized', () => {
    expect(isPickable(' , ')).toBe(false);
    expect(isPickable('en to tre fire fem seks syv otte ni')).toBe(false);
    expect(isPickable('a'.repeat(81))).toBe(false);
  });
});

describe('matchDeck', () => {
  it('finds a hand-written exam phrase', () => {
    expect(matchDeck('På grund af')?.id).toBe('v-paa-grund-af');
  });

  it('finds a bank word from any of its forms', () => {
    expect(matchDeck('accepterede')?.id).toBe('w-v-acceptere');
    expect(matchDeck('at acceptere')?.id).toBe('w-v-acceptere');
  });

  it('finds nothing for a word the deck lacks', () => {
    expect(matchDeck('besluttet at')).toBeNull();
    expect(matchDeck('')).toBeNull();
  });
});

describe('cardIdFor', () => {
  it('uses the deck id for a linked word, and the text for the learner’s own', () => {
    expect(cardIdFor({ refId: 'v-paa-grund-af', text: 'på grund af' })).toBe('v-paa-grund-af');
    expect(cardIdFor({ refId: null, text: ' Besluttet at. ' })).toBe('c:besluttet at');
  });
});

describe('splitAtPhrase', () => {
  it('splits around a phrase regardless of case and line breaks', () => {
    expect(splitAtPhrase('Skolen har Besluttet\nat indføre det.', 'besluttet at')).toEqual({
      before: 'Skolen har ',
      match: 'Besluttet\nat',
      after: ' indføre det.',
    });
  });

  it('matches whole words only', () => {
    expect(splitAtPhrase('Han har besluttet.', 'beslut')).toBeNull();
  });
});

describe('sentenceAt', () => {
  const text = 'Det regner. Skolen har besluttet at indføre en lektiecafé! Den åbner i morgen.';

  it('cuts out the sentence holding the selection', () => {
    const at = text.indexOf('besluttet');
    expect(sentenceAt(text, at, 'besluttet at'.length)).toBe('Skolen har besluttet at indføre en lektiecafé!');
  });

  it('works at the start and the end of the text', () => {
    expect(sentenceAt(text, 0, 3)).toBe('Det regner.');
    expect(sentenceAt(text, text.indexOf('åbner'), 5)).toBe('Den åbner i morgen.');
  });

  it('cuts a very long sentence down around the selection', () => {
    const long = `${'ord '.repeat(100)}målet ${'ord '.repeat(100)}.`;
    const out = sentenceAt(long, long.indexOf('målet'), 5)!;
    expect(out.length).toBeLessThan(300);
    expect(out).toContain('målet');
    expect(out.startsWith('… ')).toBe(true);
  });
});
