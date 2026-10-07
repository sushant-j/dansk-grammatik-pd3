import { useRouter } from 'expo-router';
import React from 'react';
import { VOCABULARY } from '../../src/content/vocabulary';
import { DRILL_DOMAINS, drillDomain, type DrillDomainKey } from '../../src/drills/registry';
import type { DomainKey } from '../../src/profile/overview';
import { useOverview } from '../../src/profile/useOverview';
import { liveSets, useVocabSets } from '../../src/vocabSets/store';
import { DomainMeter, domainStatus } from '../../src/ui/DomainMeter';
import { Screen } from '../../src/ui/Screen';
import { ListGroup, ListRow, Txt } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';

/**
 * Practise — every trainer in one place, grouped by what it trains rather
 * than listed in the order they were built. Each row carries its own mastery
 * bar (from the same rollup as Today and Progress), so the list doubles as a
 * map of where you are weak.
 */
type Entry = { key: DomainKey; detail: string };

/** A drill domain's row: its detail line is the registry's blurb. */
const drill = (key: DrillDomainKey): Entry => ({ key, detail: drillDomain(key).blurb });

const LISTED: { title: string; entries: Entry[] }[] = [
  {
    title: 'Sentences',
    entries: [
      { key: 'grammar', detail: 'Put each word in its slot in the sætningsskema.' },
      { key: 'comma', detail: 'Comma before "men", never before "og".' },
    ],
  },
  {
    title: 'Verbs',
    entries: [
      { key: 'verbs', detail: '"Gik", not "gåede" — and "er" vs. "har".' },
      drill('verb-tenses'),
      drill('verb-blive-faa'),
      drill('modal-verbs'),
    ],
  },
  {
    title: 'Word forms',
    entries: [
      { key: 'nouns', detail: 'En or et, and "den røde bil" — never "bilen".' },
      drill('noun-usage'),
      { key: 'adjectives', detail: 'Rød, rødt or røde: the noun decides.' },
      drill('adjective-usage'),
      drill('adverbs'),
      { key: 'spelling', detail: 'When the sound doesn’t match the spelling. Mainly for FVU.' },
    ],
  },
  {
    title: 'Small words',
    entries: [drill('pronouns'), drill('conjunctions'), drill('prepositions')],
  },
  {
    title: 'Words',
    entries: [
      { key: 'vocab', detail: `${VOCABULARY.length.toLocaleString('en')} words, from first nouns to PD3 connectors.` },
      drill('word-choice-verbs'),
      drill('word-choice-other'),
    ],
  },
];

/**
 * The groups as shown. The order above is hand-picked (a drill sits next to
 * the trainer it extends), but no drill domain can go missing: one not placed
 * above still appears, at the end of its registry group. Rows without an
 * overview entry — drill domains with no topics yet — are left out.
 */
const PLACED = new Set(LISTED.flatMap((g) => g.entries.map((e) => e.key)));
const GROUPS = LISTED.map((g) => {
  const rest = DRILL_DOMAINS.filter((d) => d.group === g.title && !PLACED.has(d.key)).map((d) => drill(d.key));
  return { title: g.title, entries: [...g.entries, ...rest] };
});

export default function Practise() {
  const t = useTheme();
  const router = useRouter();
  const { byKey } = useOverview();
  const sets = useVocabSets((st) => st.sets);
  const items = useVocabSets((st) => st.items);
  const live = liveSets(sets);
  const liveIds = new Set(live.map((x) => x.id));
  const setWords = items.filter((i) => i.deletedAt === null && liveIds.has(i.setId)).length;

  return (
    <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: t.space(10), gap: t.space(6) }}>
      <Txt variant="body" color={t.c.textMuted}>
        Pick any trainer. Each one tracks its own rules, and the bar shows how many you have made solid.
      </Txt>

      {GROUPS.map((g) => {
        const rows = g.entries.flatMap((e) => {
          const d = byKey[e.key];
          return d ? [{ e, d }] : [];
        });
        if (rows.length === 0) return null;
        return (
          <ListGroup key={g.title} title={g.title}>
            {rows.flatMap(({ e, d }) => {
              const status = domainStatus(d, t);
              const row = (
                <ListRow
                  key={e.key}
                  title={d.label}
                  detail={e.detail}
                  meta={status.text}
                  metaColor={status.color}
                  onPress={() => router.push(d.route as never)}
                >
                  <DomainMeter d={d} />
                </ListRow>
              );
              // The learner's own sets sit right under the deck they are practised with.
              if (e.key !== 'vocab') return [row];
              return [
                row,
                <ListRow
                  key="sets"
                  title="My sets"
                  detail={
                    live.length
                      ? `${live.length} ${live.length === 1 ? 'set' : 'sets'} · ${setWords} ${setWords === 1 ? 'word' : 'words'} you picked out yourself.`
                      : 'Your own word lists, picked out of the reading texts.'
                  }
                  onPress={() => router.push('/sets' as never)}
                />,
              ];
            })}
          </ListGroup>
        );
      })}

      <ListGroup title="Writing">
        <ListRow
          title="Writing studio"
          detail="Write a letter or an essay and get the word order checked rule by rule."
          onPress={() => router.push('/write')}
        />
      </ListGroup>

    </Screen>
  );
}
