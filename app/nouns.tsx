import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NOUN_RULES } from '../src/grammar/nounRules';
import type { NounQuestion } from '../src/grammar/nounExercise';
import { nextNounQuestion, nounRuleProgress, summarizeNouns, useNounProfile } from '../src/profile/nounStore';
import { ChoiceQuestion } from '../src/ui/ChoiceQuestion';
import { TrainerScreen } from '../src/ui/RulesPane';
import { StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';
import { levelLabel } from '../src/profile/mastery';
import { currentLevelNow } from '../src/profile/levelStore';
import { LevelUpNotice } from '../src/ui/LevelBadge';

/**
 * The en/et trainer.
 *
 * A typed form, not the schema board: gender and the definite suffix are
 * lexical facts to produce, not positions to arrange. Every wrong form the
 * question knows is the specific mistake the noun invites, and the
 * explanation says why — never a plain "no, try again."
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

      {/* One bar per rule; side by side when there is room, so the question stays on screen. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: t.space(6), rowGap: t.space(2) }}>
        {progress.map((p) => (
          <View key={p.id} style={{ gap: t.space(1), flexGrow: 1, flexBasis: 220 }}>
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

      <ChoiceQuestion
        label={rule.da}
        level={question.noun.level}
        prompt={question.prompt}
        options={question.options}
        correctIndex={question.correctIndex}
        picked={picked}
        onChoose={choose}
        explanation={question.explanation}
        explanationEn={question.explanationEn}
        onNext={advance}
      />
    </TrainerScreen>
  );
}
