import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COMMA_RULES } from '../src/grammar/commaRules';
import type { CommaQuestion } from '../src/grammar/commaExercise';
import { commaRuleProgress, nextCommaQuestion, summarizeComma, useCommaProfile } from '../src/profile/commaStore';
import { ChoiceQuestion } from '../src/ui/ChoiceQuestion';
import { TrainerScreen } from '../src/ui/RulesPane';
import { StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';
import { levelLabel } from '../src/profile/mastery';
import { currentLevelNow } from '../src/profile/levelStore';
import { LevelUpNotice } from '../src/ui/LevelBadge';

/**
 * The comma trainer.
 *
 * The learner gets the whole sentence with its commas taken out and puts
 * them back, rather than a single word, because a
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

  const [question, setQuestion] = useState<CommaQuestion>(() =>
    nextCommaQuestion(stats, undefined, Date.now(), currentLevelNow('comma')),
  );
  const [picked, setPicked] = useState<number | null>(null);

  const progress = commaRuleProgress(stats);
  const summary = summarizeComma(stats);

  const choose = useCallback(
    (i: number) => {
      if (picked !== null) return;
      setPicked(i);
      record(question.ruleId, i === question.correctIndex, { id: question.entry.id, level: question.entry.level });
    },
    [picked, question, record],
  );

  const advance = useCallback(() => {
    const nxt = nextCommaQuestion(
      useCommaProfile.getState().stats,
      question.entry.id,
      Date.now(),
      currentLevelNow('comma'),
    );
    setQuestion(nxt);
    setPicked(null);
  }, [question.entry.id]);

  const rule = COMMA_RULES[question.ruleId];

  return (
    <TrainerScreen
      rules={Object.values(COMMA_RULES)}
      activeRuleId={question.ruleId}
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
          whole sentence's structure — read it through before you add any.
        </Txt>
      </View>

      {/* One bar per rule; side by side when there is room, so the question stays on screen. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: t.space(6), rowGap: t.space(2) }}>
        {progress.map((p) => (
          <View key={p.id} style={{ gap: t.space(1), flexGrow: 1, flexBasis: 220 }}>
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

      <LevelUpNotice domain="comma" />

      <ChoiceQuestion
        label={rule.da}
        level={question.entry.level}
        prompt={question.prompt}
        options={question.options}
        correctIndex={question.correctIndex}
        picked={picked}
        onChoose={choose}
        explanation={question.explanation}
        onNext={advance}
        mode="sentence"
      />
    </TrainerScreen>
  );
}
