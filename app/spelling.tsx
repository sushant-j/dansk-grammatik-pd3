import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPELLING_RULES } from '../src/grammar/spellingRules';
import type { SpellingQuestion } from '../src/grammar/spellingExercise';
import {
  nextSpellingQuestion,
  spellingRuleProgress,
  summarizeSpelling,
  useSpellingProfile,
} from '../src/profile/spellingStore';
import { Screen } from '../src/ui/Screen';
import { Button, Card, Label, StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';

/**
 * The spelling trainer — FVU-oriented, not PD3.
 *
 * Every other module in this app targets an L2 exam learner mapping known
 * grammatical concepts onto Danish. This one targets literacy itself: sound
 * not matching spelling, a different failure mode entirely, which is why the
 * three rules here (silent d, silent h, nogen/nogle) are unrelated in kind to
 * anything in the grammar map.
 */
export default function Spelling() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const stats = useSpellingProfile((st) => st.stats);
  const record = useSpellingProfile((st) => st.record);

  const [question, setQuestion] = useState<SpellingQuestion>(() => nextSpellingQuestion(stats));
  const [picked, setPicked] = useState<number | null>(null);

  const progress = spellingRuleProgress(stats);
  const summary = summarizeSpelling(stats);

  const choose = useCallback(
    (i: number) => {
      if (picked !== null) return;
      setPicked(i);
      record(question.ruleId, i === question.correctIndex);
    },
    [picked, question, record],
  );

  const advance = useCallback(() => {
    const nxt = nextSpellingQuestion(useSpellingProfile.getState().stats, question.entry.id);
    setQuestion(nxt);
    setPicked(null);
  }, [question.entry.id]);

  const rule = SPELLING_RULES[question.ruleId];

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
          Stavning
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {summary.solid} af {summary.total} regler solide. These words are pronounced one way
          and spelled another — the ear cannot always be trusted here.
        </Txt>
      </View>

      <View style={{ gap: t.space(2) }}>
        {progress.map((p) => (
          <View key={p.id} style={{ gap: t.space(1) }}>
            <View style={s.rowBetween}>
              <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 13 }}>
                {SPELLING_RULES[p.id].da}
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
              {picked === question.correctIndex ? 'Rigtigt' : 'Ikke helt'}
            </Label>
            <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 22 }}>
              {question.explanation}
            </Txt>
          </Card>
          <Button label="Næste ord" onPress={advance} />
        </View>
      ) : null}
    </Screen>
  );
}
