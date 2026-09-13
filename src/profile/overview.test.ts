import { describe, expect, it } from 'vitest';
import { ALL_VERB_RULE_IDS } from '../grammar/verbRules';
import { ALL_SPELLING_RULE_IDS } from '../grammar/spellingRules';
import { applyOutcome, EMPTY_STAT, type ItemStat } from './mastery';
import { crossDomainReview, summarizeOverview, type OverviewStats } from './overview';

const NOW = 1_700_000_000_000;

function shaky(): ItemStat {
  // One wrong answer from cold — low strength, level 'shaky'.
  return applyOutcome({ ...EMPTY_STAT }, false, NOW);
}

function solid(): ItemStat {
  let s = { ...EMPTY_STAT };
  for (let i = 0; i < 8; i++) s = applyOutcome(s, true, NOW);
  return s;
}

function emptyStats(): OverviewStats {
  return { grammar: {}, verbs: {}, nouns: {}, adjectives: {}, comma: {}, spelling: {}, vocab: {} };
}

describe('crossDomainReview', () => {
  it('reports one row per trainer, always', () => {
    const domains = crossDomainReview(emptyStats(), NOW);
    expect(domains.map((d) => d.key).sort()).toEqual(
      ['adjectives', 'comma', 'grammar', 'nouns', 'spelling', 'verbs', 'vocab'],
    );
  });

  it('counts a fully untouched app as started=false with zero attention', () => {
    const s = summarizeOverview(crossDomainReview(emptyStats(), NOW));
    expect(s.started).toBe(false);
    expect(s.totalAttention).toBe(0);
    expect(s.totalSolid).toBe(0);
    expect(s.widestGap).toBeUndefined();
    // Every trainer's items are counted in the total, even unseen.
    expect(s.totalItems).toBeGreaterThan(0);
  });

  it('surfaces a shaky item as the widest gap, in the right domain', () => {
    const stats = emptyStats();
    stats.verbs = { [ALL_VERB_RULE_IDS[0]]: shaky() };
    const domains = crossDomainReview(stats, NOW);
    const s = summarizeOverview(domains);

    expect(s.started).toBe(true);
    expect(s.widestGap?.key).toBe('verbs');
    expect(s.totalAttention).toBe(1);
    // The gap domain sorts to the front.
    expect(domains[0].key).toBe('verbs');
  });

  it('ranks the domain with more open gaps ahead of one with fewer', () => {
    const stats = emptyStats();
    stats.spelling = Object.fromEntries(
      ALL_SPELLING_RULE_IDS.slice(0, 3).map((id) => [id, shaky()]),
    );
    stats.verbs = { [ALL_VERB_RULE_IDS[0]]: shaky() };

    const domains = crossDomainReview(stats, NOW);
    expect(domains[0].key).toBe('spelling');
    expect(domains[0].attention).toBe(3);
    expect(summarizeOverview(domains).widestGap?.key).toBe('spelling');
  });

  it('counts solid items toward solid, not attention', () => {
    const stats = emptyStats();
    stats.verbs = { [ALL_VERB_RULE_IDS[0]]: solid() };
    const verbs = crossDomainReview(stats, NOW).find((d) => d.key === 'verbs')!;
    expect(verbs.solid).toBeGreaterThanOrEqual(1);
    expect(verbs.attention).toBe(0);
    expect(verbs.started).toBe(true);
  });

  it('has no widest gap once every attempted item is solid', () => {
    const stats = emptyStats();
    stats.verbs = { [ALL_VERB_RULE_IDS[0]]: solid() };
    expect(summarizeOverview(crossDomainReview(stats, NOW)).widestGap).toBeUndefined();
  });
});
