import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VERB_RULES } from '../src/grammar/verbRules';
import type { VerbQuestion } from '../src/grammar/verbExercise';
import { nextVerbQuestion, summarizeVerbs, useVerbProfile, verbRuleProgress } from '../src/profile/verbStore';
import { TrainerScreen } from '../src/ui/RulesPane';
import { Button, Card, Label, StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';
import { levelLabel } from '../src/profile/mastery';
import { currentLevelNow } from '../src/profile/levelStore';
import { LevelBadge, LevelUpNotice } from '../src/ui/LevelBadge';

/**
 * The tense trainer.
 *
 * A third near-twin of nouns.tsx / adjectives.tsx, and deliberately so — see
 * the note on adjectives.tsx for why these stay separate screens rather than
 * one generalised component. Here the case for staying separate is even
 * stronger: the three rules genuinely differ in kind (a leaky phonological
 * pattern, pure memorisation, a semantic fact about the verb), not just in
 * which words they draw from.
 */
export default function Verbs() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const stats = useVerbProfile((st) => st.stats);
  const record = useVerbProfile((st) => st.record);

  const [question, setQuestion] = useState<VerbQuestion>(() =>
    nextVerbQuestion(stats, undefined, Date.now(), currentLevelNow('verbs')),
  );
  const [picked, setPicked] = useState<number | null>(null);

  const progress = verbRuleProgress(stats);
  const summary = summarizeVerbs(stats);

  const choose = useCallback(
    (i: number) => {
      if (picked !== null) return;
      setPicked(i);
      record(question.ruleId, i === question.correctIndex, { id: question.verb.id, level: question.verb.level });
    },
    [picked, question, record],
  );

  const advance = useCallback(() => {
    const nxt = nextVerbQuestion(
      useVerbProfile.getState().stats,
      question.verb.id,
      Date.now(),
      currentLevelNow('verbs'),
    );
    setQuestion(nxt);
    setPicked(null);
  }, [question.verb.id]);

  const rule = VERB_RULES[question.ruleId];

  return (
    <TrainerScreen
      rules={Object.values(VERB_RULES)}
      activeRuleId={question.ruleId}
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          Verb tenses
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {summary.solid} of {summary.total} rules solid. Weak verbs take a suffix; strong verbs
          change shape entirely; and the auxiliary — er or har — tracks meaning, not verb type.
        </Txt>
      </View>

      <View style={{ gap: t.space(2) }}>
        {progress.map((p) => (
          <View key={p.id} style={{ gap: t.space(1) }}>
            <View style={s.rowBetween}>
              <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 13 }}>
                {VERB_RULES[p.id].da}
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

      <LevelUpNotice domain="verbs" />

      <Card tone="sunken">
        <View style={s.rowBetween}>
          <Label>{rule.da}</Label>
          <LevelBadge level={question.verb.level} />
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
