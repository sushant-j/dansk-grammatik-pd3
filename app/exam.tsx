import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../src/ui/Screen';
import { Card, Divider, Label, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';

/**
 * The PD3 exam, section by section, as SIRI currently describes it on
 * danskogproever.dk — with links to the official sample papers rather than
 * copies of them, since the long reading texts are third-party material.
 */

const BASE = 'https://danskogproever.dk/media';

interface Doc {
  label: string;
  url: string;
}

interface Part {
  name: string;
  time: string;
  what: string;
}

interface Section {
  key: string;
  title: string;
  danish: string;
  summary: string;
  parts: Part[];
  tips: string[];
  docs: Doc[];
  route?: { label: string; path: string };
}

const SECTIONS: Section[] = [
  {
    key: 'reading',
    title: 'Reading',
    danish: 'Læseforståelse',
    summary: '90 minutes, no dictionary, 4 parts. Each answer is worth 1 point.',
    parts: [
      {
        name: 'Delprøve 1',
        time: '25 min',
        what: '15 short-answer questions. Scan a ~10-page brochure-style text collection for facts, using its table of contents.',
      },
      {
        name: 'Delprøve 2A',
        time: '65 min for 2A, 2B and 3 together',
        what: '3 multiple-choice questions (3 options) on a ~1.5-page informative or argumentative text. The questions follow the order of the text.',
      },
      {
        name: 'Delprøve 2B',
        time: '',
        what: 'Put 5 removed paragraphs back into a ~2.5-page text. There are 2 extra paragraphs that do not fit.',
      },
      {
        name: 'Delprøve 3',
        time: '',
        what: '8 gaps in a ~1.5-page text. Choose the right word or phrase from 4 options.',
      },
    ],
    tips: [
      'Delprøve 1 rewards speed, not deep reading: read the question, jump to the section named above it, and answer in as few words as possible.',
      'In 2B, look at the first and last sentence of each missing paragraph. Pronouns (den, det, de) and connectors (derfor, desuden, til gengæld) show which way they link.',
      'Delprøve 3 tests word choice and grammar together. The trainers in this app (gender, adjectives, verbs, word order) are direct practice for it.',
    ],
    docs: [
      { label: 'Text collection 2023 (Delprøve 1)', url: `${BASE}/szzplwje/pd3-tekstsamling-sommer-2023.pdf` },
      { label: 'Questions 2023 (Delprøve 1)', url: `${BASE}/n3iio431/pd3-laeseforstaaelse-1-opgavehaefte-sommer-2023.pdf` },
      { label: 'Answer key 2023 (Delprøve 1)', url: `${BASE}/f5dlnjbt/rettenoegle-dp3-delproeve-1-sommer-2023-pdf.pdf` },
      { label: 'Texts 2023 (Delprøve 2A, 2B, 3)', url: `${BASE}/nj1d0ymo/pd3-laeseforstaaelse-2-teksthaefte-sommer-2023.pdf` },
      { label: 'Questions 2023 (Delprøve 2A, 2B, 3)', url: `${BASE}/slkdckdc/pd3-laeseforstaaelse-2-opgavehaefte-sommer-2023.pdf` },
      { label: 'Answer key 2023 (Delprøve 2A, 2B, 3)', url: `${BASE}/wo5gwhyp/rettenoegle-pd3-delproeve-2a-2b-og-3-sommer-2023.pdf` },
    ],
  },
  {
    key: 'writing',
    title: 'Writing',
    danish: 'Skriftlig fremstilling',
    summary: '2½ hours, all dictionaries allowed. Two tasks. The e-mail counts for less than the essay.',
    parts: [
      {
        name: 'Delprøve 1',
        time: '',
        what: 'An informal e-mail to a friend replying to their message. Thank them, answer every underlined question, and do what the last bullet asks (e.g. suggest meeting). There is no length requirement.',
      },
      {
        name: 'Delprøve 2A',
        time: '',
        what: 'Diagram task, minimum 200 words: briefly describe the main trends, explain possible causes, then discuss pros and cons (about 50% of the answer).',
      },
      {
        name: 'Delprøve 2B',
        time: '',
        what: 'Opinion task, minimum 200 words: briefly describe a personal experience, comment on one or two of the listed statements or factors, then give your assessment (about 50% of the answer).',
      },
    ],
    tips: [
      'Choose either 2A or 2B, not both. 2A suits you if you can describe numbers; 2B suits you if you can argue from your own experience.',
      'The final bullet carries about half the marks, so plan for roughly 100 words there.',
      'Use a clear structure: an opening sentence for each bullet, a connector (desuden, på den anden side, derfor) and a short conclusion.',
    ],
    docs: [
      { label: 'Official writing paper 2022', url: `${BASE}/apahvtdf/pd3-skriftlig-fremstilling-sommer-2022.pdf` },
      { label: 'Example of a passing answer', url: `${BASE}/ncfhgdmf/260921-pd3-besvarelse-002.pdf` },
    ],
    route: { label: 'Practise the official 2022 tasks in the Writing studio', path: '/write' },
  },
  {
    key: 'speaking',
    title: 'Speaking',
    danish: 'Mundtlig kommunikation',
    summary: 'About 10 minutes in total: two 5-minute parts with an examiner and an external assessor (censor).',
    parts: [
      {
        name: 'Delprøve 1',
        time: '≈2 min + 2½ min',
        what: 'You present a society topic your school gives you 5 working days before the oral exam period. You may bring one sheet of your own notes. The examiner then asks follow-up questions.',
      },
      {
        name: 'Delprøve 2',
        time: '≈4½ min',
        what: 'Unprepared. You draw topic A, B or C and get about 10 seconds to look at its two pictures. The examiner asks a first required question about one picture, then a second, broader required question ("Hvilke fordele og ulemper…?"). Each is followed by follow-up questions.',
      },
    ],
    tips: [
      'In Delprøve 1 the examiner uses four kinds of follow-up question: clarifying ("Vil du godt forklare det lidt nærmere?"), elaborating ("Kan du ikke fortælle lidt mere om det?"), explaining ("…men hvorfor tror du så, at …?") and taking a position ("Mener du, at …? Hvorfor/hvorfor ikke?").',
      'Answer with a reason every time. If you do not justify your answer, the examiner has to ask again, and that pulls your grade down.',
      'The first required question is almost always "Hvorfor tror du, …?" (causes). The second is "Hvilke fordele og ulemper…?" Prepare a structure for both.',
      'Delprøve 1 topics are set by your own school, not centrally, so there is no national list. Prepare a 2-minute structure (introduction, 2–3 points, your opinion) that works for any society topic.',
    ],
    docs: [
      { label: 'Official oral examiner booklet, May–June 2024', url: `${BASE}/prob2ifo/censor-og-eksaminatorhaefte-pd3-mdt.pdf` },
      { label: 'Example picture sheet (Delprøve 2)', url: `${BASE}/u0hdwfmo/eksempel-pd3-mundtlig-kommunikation-opgave.pdf` },
    ],
    route: { label: 'Open the topic archive (includes the full 2024 set)', path: '/topics' },
  },
];

export default function ExamGuide() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(10),
        gap: t.space(4),
      }}
    >
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          The PD3 exam
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5), lineHeight: 22 }}>
          Level B2. Reading, writing and speaking each get their own grade on the 7-point scale. Speaking counts double in your average. The exam is held in May–June and November–December.
        </Txt>
      </View>

      {SECTIONS.map((sec) => (
        <Card key={sec.key}>
          <View style={s.rowBetween}>
            <Label color={t.c.accent}>{sec.title}</Label>
            <Label color={t.c.textFaint}>{sec.danish.toUpperCase()}</Label>
          </View>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
            {sec.summary}
          </Txt>

          <View style={{ marginTop: t.space(3), gap: t.space(2.5) }}>
            {sec.parts.map((p) => (
              <View key={p.name}>
                <View style={s.rowBetween}>
                  <Txt variant="heading">{p.name}</Txt>
                  {p.time ? (
                    <Txt variant="label" color={t.c.textFaint}>
                      {p.time.toUpperCase()}
                    </Txt>
                  ) : null}
                </View>
                <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1), lineHeight: 22 }}>
                  {p.what}
                </Txt>
              </View>
            ))}
          </View>

          <Divider />
          <Label>Tips</Label>
          <View style={{ marginTop: t.space(1.5), gap: t.space(1.5) }}>
            {sec.tips.map((tip, i) => (
              <Txt key={i} variant="body" color={t.c.textMuted} style={{ lineHeight: 22 }}>
                • {tip}
              </Txt>
            ))}
          </View>

          <Divider />
          <Label>Official material</Label>
          <View style={{ marginTop: t.space(1.5), gap: t.space(1) }}>
            {sec.docs.map((d) => (
              <Pressable key={d.url} onPress={() => Linking.openURL(d.url)}>
                <Txt variant="body" color={t.c.accent} style={{ lineHeight: 24 }}>
                  ↗ {d.label}
                </Txt>
              </Pressable>
            ))}
          </View>

          {sec.route ? (
            <Pressable onPress={() => router.push(sec.route!.path as never)} style={{ marginTop: t.space(3) }}>
              <Card tone="accent">
                <Txt variant="body" color={t.c.accent} style={{ fontWeight: '600' }}>
                  {sec.route.label} →
                </Txt>
              </Card>
            </Pressable>
          ) : null}
        </Card>
      ))}

      <Card tone="sunken">
        <Label>What has been published</Label>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
          SIRI publishes only one sample paper per section (reading 2023, writing 2022, oral May–June 2024). Papers from November–December 2024 and from 2025 are not public, so this app does not guess at them. Source: danskogproever.dk.
        </Txt>
      </Card>
    </Screen>
  );
}
