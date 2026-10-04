import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../../src/ui/Screen';
import { practiceTopicById } from '../../../src/content/topics';
import { Card, Divider, Label, Txt, s } from '../../../src/ui/primitives';
import { useTheme } from '../../../src/ui/theme';

const KIND_LABEL: Record<string, string> = {
  'first-a': 'First required question · A',
  'first-a-follow': 'Follow-up question',
  'first-b': 'First required question · B',
  'first-b-follow': 'Follow-up question',
  second: 'Second required question',
  'second-follow': 'Follow-up question',
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
        <Txt variant="title">Practice topic not found</Txt>
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
          <Label color={t.c.textFaint}>PRACTICE TOPIC — NOT A REAL EXAM TOPIC</Label>
          <Txt variant="display" style={{ marginTop: t.space(2), fontSize: 26 }}>
            {topic.title}
          </Txt>
        </View>

        <Card tone="sunken">
          <Label>Scenario</Label>
          {topic.scenario.map((sc, i) => (
            <Txt key={i} variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
              Picture {i + 1}: {sc}
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
                  {revealed.has(i) ? 'Hide model answer' : 'Show model answer'}
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
          <Label color={t.c.accent}>Remember</Label>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
            This topic was not set for a real exam. It follows the pattern, but use it to practise structure and argument — not to predict the next exam.
          </Txt>
        </Card>
      </Screen>
    </>
  );
}
