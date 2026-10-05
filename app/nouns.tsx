import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NOUN_RULES } from '../src/grammar/nounRules';
import type { NounQuestion } from '../src/grammar/nounExercise';
import { nextNounQuestion, nounRuleProgress, summarizeNouns, useNounProfile } from '../src/profile/nounStore';
import { TrainerScreen } from '../src/ui/RulesPane';
import { Button, Card, Label, StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';
import { levelLabel } from '../src/profile/mastery';
import { currentLevelNow } from '../src/profile/levelStore';
import { LevelBadge, LevelUpNotice } from '../src/ui/LevelBadge';

/**
 * The en/et trainer.
 *
 * Multiple choice, not the schema board: gender and the definite suffix are
 * lexical facts to recognise, not positions to arrange, so tap-to-place would
 * be the wrong mechanic wearing the right app's clothes. Every wrong option
 * is the specific mistake the noun invites, so picking it and reading why is
 * the lesson — never a plain "no, try again."
 */
export default function Nouns() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const stats = useNounProfile((st) => st.stats);
  const record = useNounProfile((st) => st.record);

  const [question, setQuestion] = useState<NounQuestion>(() =>
    nextNounQuestion(stats, undefined, Date.now(), currentLevelNow('nouns')),
  );
  const [picked, setPicked] = useState<number | null>(null);

  const progress = nounRuleProgress(stats);
  const summary = summarizeNouns(stats);

  const choose = useCallback(
    (i: number) => {
      if (picked !== null) return;
      setPicked(i);
      record(question.ruleId, i === question.correctIndex, { id: question.noun.id, level: question.noun.level });
    },
    [picked, question, record],
  );

  const advance = useCallback(() => {
    const nxt = nextNounQuestion(
      useNounProfile.getState().stats,
      question.noun.id,
      Date.now(),
      currentLevelNow('nouns'),
    );
    setQuestion(nxt);
    setPicked(null);
  }, [question.noun.id]);

  const rule = NOUN_RULES[question.ruleId];

  return (
    <TrainerScreen
      rules={Object.values(NOUN_RULES)}
      activeRuleId={question.ruleId}
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          Gender: en / et
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {summary.solid} of {summary.total} rules solid. Gender is memorised per word — this
          drills the two rules that follow from it.
        </Txt>
      </View>

      <View style={{ gap: t.space(2) }}>
        {progress.map((p) => (
          <View key={p.id} style={{ gap: t.space(1) }}>
            <View style={s.rowBetween}>
              <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 13 }}>
                {NOUN_RULES[p.id].da}
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

      <LevelUpNotice domain="nouns" />

      <Card tone="sunken">
        <View style={s.rowBetween}>
          <Label>{rule.da}</Label>
          <LevelBadge level={question.noun.level} />
        </View>
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
            <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
              {question.explanationEn}
            </Txt>
          </Card>
          <Button label="Next" onPress={advance} />
        </View>
      ) : null}
    </TrainerScreen>
  );
}
