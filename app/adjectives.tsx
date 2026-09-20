import React, { useCallback, useState } from 'react';
import { useActivity } from '../src/profile/activity';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADJECTIVE_RULES } from '../src/grammar/adjectiveRules';
import type { AdjectiveQuestion } from '../src/grammar/adjectiveExercise';
import {
  adjectiveRuleProgress,
  nextAdjectiveQuestion,
  summarizeAdjectives,
  useAdjectiveProfile,
} from '../src/profile/adjectiveStore';
import { Screen } from '../src/ui/Screen';
import { Button, Card, Label, StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';

/**
 * The adjective-agreement trainer.
 *
 * Deliberately built as a near-twin of nouns.tsx rather than a generalised
 * "multiple choice trainer" component shared between them. The two screens
 * happen to look alike today because both domains happen to need three
 * multiple-choice rules right now — that is a coincidence of content, not a
 * structural fact the code should bet on. A forced shared abstraction would
 * need to bend the moment one domain needs a fourth rule, a different input
 * shape, or per-item (not per-rule) mastery, and untangling a premature
 * abstraction costs more than the duplication does today.
 */
export default function Adjectives() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const stats = useAdjectiveProfile((st) => st.stats);
  const record = useAdjectiveProfile((st) => st.record);

  const [question, setQuestion] = useState<AdjectiveQuestion>(() => nextAdjectiveQuestion(stats));
  const [picked, setPicked] = useState<number | null>(null);

  const progress = adjectiveRuleProgress(stats);
  const summary = summarizeAdjectives(stats);

  const choose = useCallback(
    (i: number) => {
      if (picked !== null) return;
      setPicked(i);
      record(question.ruleId, i === question.correctIndex);
      useActivity.getState().markToday();
    },
    [picked, question, record],
  );

  const advance = useCallback(() => {
    const nxt = nextAdjectiveQuestion(useAdjectiveProfile.getState().stats, question.adjective.id);
    setQuestion(nxt);
    setPicked(null);
  }, [question.adjective.id]);

  const rule = ADJECTIVE_RULES[question.ruleId];

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          Adjective agreement
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {summary.solid} of {summary.total} rules solid. One adjective, three forms — which one
          depends on the noun's gender, number, and definiteness, never on the adjective itself.
        </Txt>
      </View>

      <View style={{ gap: t.space(2) }}>
        {progress.map((p) => (
          <View key={p.id} style={{ gap: t.space(1) }}>
            <View style={s.rowBetween}>
              <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 13 }}>
                {ADJECTIVE_RULES[p.id].da}
              </Txt>
              <Txt variant="label" color={t.c.textFaint}>
                {p.level.toUpperCase()}
              </Txt>
            </View>
            <StrengthBar
              value={p.strength}
              color={p.strength >= 0.7 ? t.c.success : p.strength >= 0.4 ? t.c.warning : t.c.accent}
            />
          </View>
        ))}
      </View>

      <Card tone="sunken">
        <Label>{rule.da}</Label>
        <Txt variant="title" style={{ marginTop: t.space(2) }}>
          {question.prompt}
        </Txt>
      </Card>

      <View style={{ gap: t.space(2.5) }}>
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIndex;
          const isPicked = i === picked;
          const revealed = picked !== null;

          const bg = !revealed
            ? t.c.surface
            : isCorrect
              ? t.c.successSoft
              : isPicked
                ? t.c.accentSoft
                : t.c.surface;
          const border = !revealed
            ? t.c.border
            : isCorrect
              ? t.c.success
              : isPicked
                ? t.c.accent
                : t.c.border;

          return (
            <Pressable key={i} onPress={() => choose(i)} disabled={revealed}>
              <View
                style={{
                  backgroundColor: bg,
                  borderWidth: 1.5,
                  borderColor: border,
                  borderRadius: t.radius.md,
                  paddingVertical: t.space(3.5),
                  paddingHorizontal: t.space(4),
                }}
              >
                <Txt variant="heading" color={revealed && isCorrect ? t.c.success : t.c.text}>
                  {opt}
                </Txt>
              </View>
            </Pressable>
          );
        })}
      </View>

      {picked !== null ? (
        <View style={{ gap: t.space(3) }}>
          <Card tone={picked === question.correctIndex ? 'success' : 'warning'}>
            <Label color={picked === question.correctIndex ? t.c.success : t.c.warning}>
              {picked === question.correctIndex ? 'Correct' : 'Not quite'}
            </Label>
            <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 22 }}>
              {question.explanation}
            </Txt>
          </Card>
          <Button label="Next" onPress={advance} />
        </View>
      ) : null}
    </Screen>
  );
}
