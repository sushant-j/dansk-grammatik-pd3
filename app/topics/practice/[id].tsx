import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../../src/ui/Screen';
import { practiceTopicById } from '../../../src/content/topics';
import { Card, Divider, Label, Txt, s } from '../../../src/ui/primitives';
import { useTheme } from '../../../src/ui/theme';

const KIND_LABEL: Record<string, string> = {
  'first-a': 'Første obligatoriske spørgsmål · A',
  'first-a-follow': 'Opfølgende spørgsmål',
  'first-b': 'Første obligatoriske spørgsmål · B',
  'first-b-follow': 'Opfølgende spørgsmål',
  second: 'Andet obligatoriske spørgsmål',
  'second-follow': 'Opfølgende spørgsmål',
};

/**
 * A practice topic's Q&A, laid out exactly like the real exam's structure —
 * two picture prompts, a first obligatory question with two parts (A/B) each
 * carrying a follow-up, then a second obligatory question with its own
 * follow-up — so the *shape* of the exam is what gets rehearsed, not just
 * the vocabulary.
 */
export default function PracticeTopicDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const topic = practiceTopicById(id);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (!topic) {
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bg, padding: t.space(4) }}>
        <Txt variant="title">Øvelsesemne ikke fundet</Txt>
      </View>
    );
  }

  const toggle = (i: number) =>
    setRevealed((s2) => {
      const next = new Set(s2);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <>
      <Stack.Screen options={{ title: topic.title }} />
      <Screen
        contentContainerStyle={{
          padding: t.space(4),
          paddingBottom: insets.bottom + t.space(8),
          gap: t.space(4),
        }}
      >
        <View>
          <Label color={t.c.textFaint}>ØVELSESEMNE — IKKE EN RIGTIG EKSAMENSOPGAVE</Label>
          <Txt variant="display" style={{ marginTop: t.space(2), fontSize: 26 }}>
            {topic.title}
          </Txt>
        </View>

        <Card tone="sunken">
          <Label>Scenario</Label>
          {topic.scenario.map((sc, i) => (
            <Txt key={i} variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
              Billede {i + 1}: {sc}
            </Txt>
          ))}
        </Card>

        {topic.questions.map((q, i) => (
          <Card key={i} tone={q.kind.endsWith('follow') ? 'sunken' : 'surface'}>
            <Label color={q.kind.endsWith('follow') ? t.c.textFaint : t.c.accent}>
              {KIND_LABEL[q.kind]}
            </Label>
            <Txt variant="heading" style={{ marginTop: t.space(2), lineHeight: 24 }}>
              {q.q}
            </Txt>

            <Pressable onPress={() => toggle(i)} style={{ marginTop: t.space(3) }}>
              <View
                style={[
                  s.rowBetween,
                  {
                    borderWidth: 1,
                    borderColor: t.c.border,
                    borderRadius: t.radius.sm,
                    paddingVertical: t.space(2),
                    paddingHorizontal: t.space(3),
                  },
                ]}
              >
                <Txt variant="label" color={t.c.textMuted}>
                  {revealed.has(i) ? 'SKJUL MODELSVAR' : 'VIS MODELSVAR'}
                </Txt>
                <Txt variant="body" color={t.c.textFaint}>
                  {revealed.has(i) ? '▲' : '▼'}
                </Txt>
              </View>
            </Pressable>

            {revealed.has(i) ? (
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(3), lineHeight: 23 }}>
                {q.a}
              </Txt>
            ) : null}
          </Card>
        ))}

        <Divider />
        <Card tone="accent">
          <Label color={t.c.accent}>Husk</Label>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
            Dette emne er ikke sat til en rigtig eksamen. Det følger mønsteret, men brug det til
            at øve strukturen og argumentationen — ikke til at forudsige den næste eksamen.
          </Txt>
        </Card>
      </Screen>
    </>
  );
}
