import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../src/ui/Screen';
import { RULES } from '../src/grammar/rules';
import { activeProvider } from '../src/feedback/claudeCoach';
import type { WritingFeedback, WritingTask } from '../src/feedback/types';
import { Button, Card, Divider, Label, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';

/**
 * Writing studio.
 *
 * PD3's written paper is a letter plus a topic piece, and no consumer app
 * touches it. The offline checker below is deliberately narrow — it only flags
 * what it can explain by rule — and it says so. The Claude-backed coach slots
 * in behind the same interface once the proxy exists; the UI does not change,
 * only the provider label.
 */

const TASKS: WritingTask[] = [
  {
    kind: 'letter',
    register: 'formel',
    prompt:
      'Skriv en e-mail til din kommune. Du har fået et brev om, at du skal møde til en samtale den 3. marts, men du kan ikke komme. Forklar hvorfor, og foreslå en anden dato.',
  },
  {
    kind: 'letter',
    register: 'uformel',
    prompt:
      'Skriv en besked til en ven, der har inviteret dig til fødselsdag. Sig tak, forklar at du kommer lidt senere, og fortæl hvorfor.',
  },
  {
    kind: 'essay',
    minWords: 120,
    prompt:
      'Mange flytter fra landet til de store byer. Skriv om fordele og ulemper ved at bo i en storby, og giv din egen mening.',
  },
];

export default function Write() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [taskIdx, setTaskIdx] = useState(0);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [busy, setBusy] = useState(false);

  const task = TASKS[taskIdx];
  const provider = activeProvider();
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  const review = useCallback(async () => {
    setBusy(true);
    try {
      const fb = await provider.review(text, task);
      setFeedback(fb);
    } finally {
      setBusy(false);
    }
  }, [provider, task, text]);

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(10),
        gap: t.space(4),
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Task picker */}
      <View style={[s.row, { gap: t.space(2) }]}>
        {TASKS.map((tk, i) => (
          <Button
            key={i}
            tone={i === taskIdx ? 'primary' : 'ghost'}
            label={tk.kind === 'essay' ? 'Opgave' : tk.register === 'formel' ? 'Formel' : 'Uformel'}
            onPress={() => {
              setTaskIdx(i);
              setFeedback(null);
            }}
            style={{ flex: 1, paddingHorizontal: t.space(2) }}
          />
        ))}
      </View>

      <Card tone="sunken">
        <Label>
          {task.kind === 'essay'
            ? `Skriftlig fremstilling · min. ${task.minWords} ord`
            : `Brev · ${task.register}`}
        </Label>
        <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 23 }}>
          {task.prompt}
        </Txt>
      </Card>

      {/* Editor */}
      <View>
        <View style={s.rowBetween}>
          <Label>Din tekst</Label>
          <Txt variant="label" color={words ? t.c.textMuted : t.c.textFaint}>
            {words} ORD
          </Txt>
        </View>
        <TextInput
          multiline
          value={text}
          onChangeText={(v) => {
            setText(v);
            setFeedback(null);
          }}
          placeholder="Skriv her…"
          placeholderTextColor={t.c.textFaint}
          textAlignVertical="top"
          style={{
            marginTop: t.space(2),
            minHeight: 200,
            backgroundColor: t.c.surface,
            borderWidth: 1,
            borderColor: t.c.border,
            borderRadius: t.radius.md,
            padding: t.space(3.5),
            color: t.c.text,
            fontSize: 16,
            lineHeight: 24,
          }}
        />
      </View>

      <Button
        label={busy ? 'Checking…' : 'Check my Danish'}
        loading={busy}
        disabled={!text.trim()}
        onPress={review}
      />

      {/* Feedback */}
      {feedback ? (
        <View style={{ gap: t.space(3) }}>
          <Divider />
          <View style={s.rowBetween}>
            <Label>
              {feedback.corrections.length
                ? `${feedback.corrections.length} thing${feedback.corrections.length === 1 ? '' : 's'} to fix`
                : 'Nothing flagged'}
            </Label>
            <Txt variant="label" color={t.c.textFaint}>
              {provider.label.toUpperCase()}
            </Txt>
          </View>

          {feedback.corrections.map((c, i) => (
            <Card key={i}>
              <View style={[s.row, { gap: t.space(2), flexWrap: 'wrap' }]}>
                <Txt
                  variant="body"
                  color={t.c.accent}
                  style={{ textDecorationLine: 'line-through' }}
                >
                  {c.original}
                </Txt>
                <Txt variant="body" color={t.c.textFaint}>
                  →
                </Txt>
                <Txt variant="heading" color={t.c.success}>
                  {c.suggestion}
                </Txt>
              </View>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2.5) }}>
                {c.explanation}
              </Txt>
              {c.ruleId ? (
                <Button
                  tone="ghost"
                  label={`Rule: ${RULES[c.ruleId].da}`}
                  onPress={() => router.push(`/rule/${c.ruleId}` as never)}
                  style={{ marginTop: t.space(3) }}
                />
              ) : null}
            </Card>
          ))}

          {feedback.notes.map((n, i) => (
            <Card key={`n${i}`} tone="sunken">
              <Txt variant="body" color={t.c.textMuted}>
                {n}
              </Txt>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
