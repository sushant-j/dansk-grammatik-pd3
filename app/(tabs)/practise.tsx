import { useRouter } from 'expo-router';
import React from 'react';
import { VOCABULARY } from '../../src/content/vocabulary';
import type { DomainKey } from '../../src/profile/overview';
import { useOverview } from '../../src/profile/useOverview';
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

const GROUPS: { title: string; entries: Entry[] }[] = [
  {
    title: 'Sentences',
    entries: [
      { key: 'grammar', detail: 'Put each word in its slot in the sætningsskema.' },
      { key: 'comma', detail: 'Comma before "men", never before "og".' },
    ],
  },
  {
    title: 'Word forms',
    entries: [
      { key: 'nouns', detail: 'En or et, and "den røde bil" — never "bilen".' },
      { key: 'adjectives', detail: 'Rød, rødt or røde: the noun decides.' },
      { key: 'verbs', detail: '"Gik", not "gåede" — and "er" vs. "har".' },
      { key: 'spelling', detail: 'When the sound doesn’t match the spelling. Mainly for FVU.' },
    ],
  },
  {
    title: 'Words',
    entries: [{ key: 'vocab', detail: `${VOCABULARY.length} hard words, each from a real exam answer.` }],
  },
];

export default function Practise() {
  const t = useTheme();
  const router = useRouter();
  const { byKey } = useOverview();

  return (
    <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: t.space(10), gap: t.space(6) }}>
      <Txt variant="body" color={t.c.textMuted}>
        Pick any trainer. Each one tracks its own rules, and the bar shows how many you have made solid.
      </Txt>

      {GROUPS.map((g) => (
        <ListGroup key={g.title} title={g.title}>
          {g.entries.map((e) => {
            const d = byKey[e.key];
            const status = domainStatus(d, t);
            return (
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
          })}
        </ListGroup>
      ))}

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
