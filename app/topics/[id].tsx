import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../src/ui/Screen';
import { topicById } from '../../src/content/topics';
import { VOCABULARY } from '../../src/content/vocabulary';
import { Card, Divider, Label, Txt, s } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';

/**
 * One archive topic in full: obligatory questions, follow-ups, and the model
 * answer for each — with the linking words highlighted in place, because
 * seeing "på den anden side" doing real work inside a real answer teaches it
 * faster than meeting it on a flashcard first.
 */
export default function TopicDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const topic = topicById(id);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (!topic) {
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bg, padding: t.space(4) }}>
        <Txt variant="title">Topic not found</Txt>
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
          <Label>
            {topic.year}-{topic.term}
            {topic.label ? ` · Topic ${topic.label}` : ''}
          </Label>
          <Txt variant="display" style={{ marginTop: t.space(2), fontSize: 26 }}>
            {topic.title}
          </Txt>
        </View>

        {topic.questions.map((q, i) => (
          <Card key={i} tone={q.kind === 'follow' ? 'sunken' : 'surface'}>
            <Label color={q.kind === 'follow' ? t.c.textFaint : t.c.accent}>
              {q.kind === 'follow'
                ? 'Follow-up question'
                : q.kind === 'obligatory'
                  ? 'Second required question'
                  : 'Question'}
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
              <HighlightedAnswer text={q.a} style={{ marginTop: t.space(3) }} />
            ) : null}
          </Card>
        ))}

        <Divider />
        <Card tone="sunken">
          <Label>How to use a model answer</Label>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
            Read the question aloud, answer it yourself for 20–30 seconds, then check the model answer. The highlighted words are linking words — practise reusing them in your own answer rather than memorising the model.
          </Txt>
        </Card>
      </Screen>
    </>
  );
}

/** Renders `text` with any known connector phrase visually marked. */
function HighlightedAnswer({ text, style }: { text: string; style?: object }) {
  const t = useTheme();
  const connectors = useMemo(
    () =>
      VOCABULARY.filter((v) => v.category === 'connector')
        .map((v) => v.word.split(/[/(]/)[0].trim())
        .filter((w) => w.length > 2)
        .sort((a, b) => b.length - a.length),
    [],
  );

  const segments = useMemo(() => splitOnConnectors(text, connectors), [text, connectors]);

  return (
    <Txt variant="body" style={{ lineHeight: 24, ...style }}>
      {segments.map((seg, i) =>
        seg.match ? (
          <Txt key={i} variant="body" color={t.c.accent} style={{ fontWeight: '700', lineHeight: 24 }}>
            {seg.text}
          </Txt>
        ) : (
          <Txt key={i} variant="body" color={t.c.textMuted} style={{ lineHeight: 24 }}>
            {seg.text}
          </Txt>
        ),
      )}
    </Txt>
  );
}

function splitOnConnectors(
  text: string,
  connectors: string[],
): { text: string; match: boolean }[] {
  if (!connectors.length) return [{ text, match: false }];
  const pattern = new RegExp(`(${connectors.map(escapeRe).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts
    .filter((p) => p.length)
    .map((p) => ({
      text: p,
      match: connectors.some((c) => c.toLowerCase() === p.toLowerCase()),
    }));
}

function escapeRe(s2: string): string {
  return s2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
