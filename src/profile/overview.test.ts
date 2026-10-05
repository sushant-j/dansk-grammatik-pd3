import { describe, expect, it } from 'vitest';
import { ALL_VERB_RULE_IDS } from '../grammar/verbRules';
import { ALL_SPELLING_RULE_IDS } from '../grammar/spellingRules';
import { applyOutcome, EMPTY_STAT, type ItemStat } from './mastery';
import { crossDomainReview, summarizeOverview, type OverviewStats } from './overview';
import { LIVE_DRILL_DOMAINS } from '../drills/registry';
import { fixtureDomain } from '../test/drillFixture';

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
  return { grammar: {}, verbs: {}, nouns: {}, adjectives: {}, comma: {}, spelling: {}, vocab: {}, drills: {} };
}

describe('crossDomainReview', () => {
  it('reports one row per trainer, always, plus each drill domain that has topics', () => {
    const domains = crossDomainReview(emptyStats(), NOW);
    expect(domains.map((d) => d.key).sort()).toEqual(
      [
        ...['adjectives', 'comma', 'grammar', 'nouns', 'spelling', 'verbs', 'vocab'],
        ...LIVE_DRILL_DOMAINS.map((d) => d.key),
      ].sort(),
    );
  });

  it('leaves out a drill domain with no topics yet', () => {
    const empty = fixtureDomain({});
    expect(crossDomainReview(emptyStats(), NOW, [empty]).map((d) => d.key)).not.toContain(empty.key);
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

  describe('drill domains', () => {
    // Ten topics: a big domain, to show that size alone never makes a gap.
    const topics = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`vt-t${i}`, [1, 1] as (1 | 2 | 3 | 4 | 5)[]]),
    );
    const drill = fixtureDomain(topics);

    it('count no attention for topics never practised, however many there are', () => {
      const row = crossDomainReview(emptyStats(), NOW, [drill]).find((d) => d.key === drill.key)!;
      expect(row.total).toBe(10);
      expect(row.attention).toBe(0);
      expect(row.started).toBe(false);
      expect(summarizeOverview(crossDomainReview(emptyStats(), NOW, [drill])).widestGap).toBeUndefined();
    });

    it('count only the practised shaky topics', () => {
      const stats = emptyStats();
      stats.drills = { [drill.key]: { 'vt-t0': shaky(), 'vt-t1': shaky(), 'vt-t2': solid() } };
      const row = crossDomainReview(stats, NOW, [drill]).find((d) => d.key === drill.key)!;
      expect(row.attention).toBe(2);
      expect(row.solid).toBe(1);
      expect(row.route).toBe(`/drill/${drill.key}`);
    });
  });
});
