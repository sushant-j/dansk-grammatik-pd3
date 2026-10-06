import { useMemo } from 'react';
import { crossDomainReview, summarizeOverview, type DomainKey, type DomainReview } from './overview';
import { useProfile } from './store';
import { useVocabProfile } from './vocabStore';
import { useNounProfile } from './nounStore';
import { useAdjectiveProfile } from './adjectiveStore';
import { useVerbProfile } from './verbStore';
import { useCommaProfile } from './commaStore';
import { useSpellingProfile } from './spellingStore';
import { useCurrentLevel } from './levelStore';
import { useDrillProfile } from '../drills/drillStore';

/**
 * Every trainer's mastery rolled up once, for the hub tabs (Today, Practise,
 * Progress). One hook so the three can never disagree about a number.
 */
export function useOverview() {
  const grammar = useProfile((st) => st.stats);
  const vocab = useVocabProfile((st) => st.stats);
  const nouns = useNounProfile((st) => st.stats);
  const adjectives = useAdjectiveProfile((st) => st.stats);
  const verbs = useVerbProfile((st) => st.stats);
  const comma = useCommaProfile((st) => st.stats);
  const spelling = useSpellingProfile((st) => st.stats);
  const drills = useDrillProfile((st) => st.stats);
  const vocabLevel = useCurrentLevel('vocab');

  return useMemo(() => {
    const domains = crossDomainReview({ grammar, verbs, nouns, adjectives, comma, spelling, vocab, drills, vocabLevel });
    // Partial: drill domains without content have no row.
    const byKey = Object.fromEntries(domains.map((d) => [d.key, d])) as Partial<Record<DomainKey, DomainReview>>;
    return { domains, byKey, overview: summarizeOverview(domains) };
  }, [grammar, verbs, nouns, adjectives, comma, spelling, vocab, drills, vocabLevel]);
}
