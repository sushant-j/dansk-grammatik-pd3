import React, { useCallback, useState } from 'react';
import { useActivity } from '../src/profile/activity';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COMMA_RULES } from '../src/grammar/commaRules';
import type { CommaQuestion } from '../src/grammar/commaExercise';
import { commaRuleProgress, nextCommaQuestion, summarizeComma, useCommaProfile } from '../src/profile/commaStore';
import { Screen } from '../src/ui/Screen';
import { Button, Card, Label, StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';
import { levelLabel } from '../src/profile/mastery';

/**
 * The comma trainer.
 *
 * The options here are full sentences rather than single words, because a
 * comma decision depends on the shape of the whole sentence, not on a
 * property of one word the way gender or verb class does — see the note in
 * commaRules.ts for why that also means this domain has no per-word question
 * generator, unlike nouns/adjectives/verbs.
 */
export default function Comma() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const stats = useCommaProfile((st) => st.stats);
  const record = useCommaProfile((st) => st.record);

  const [question, setQuestion] = useState<CommaQuestion>(() => nextCommaQuestion(stats));
  const [picked, setPicked] = useState<number | null>(null);

  const progress = commaRuleProgress(stats);
  const summary = summarizeComma(stats);

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
    const nxt = nextCommaQuestion(useCommaProfile.getState().stats, question.entry.id);
    setQuestion(nxt);
    setPicked(null);
  }, [question.entry.id]);

  const rule = COMMA_RULES[question.ruleId];

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
          Comma rules
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {summary.solid} of {summary.total} rules solid. A comma decision depends on the
          whole sentence's structure — read both options carefully.
        </Txt>
      </View>

      <View style={{ gap: t.space(2) }}>
        {progress.map((p) => (
          <View key={p.id} style={{ gap: t.space(1) }}>
            <View style={s.rowBetween}>
              <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 13 }}>
                {COMMA_RULES[p.id].da}
              </Txt>
              <Txt variant="label" color={t.c.textFaint}>
                {levelLabel(p.level)}
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
                <Txt variant="heading" color={revealed && isCorrect ? t.c.success : t.c.text} style={{ fontSize: 17, lineHeight: 24 }}>
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
