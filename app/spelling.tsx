import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPELLING_RULES } from '../src/grammar/spellingRules';
import type { SpellingQuestion } from '../src/grammar/spellingExercise';
import {
  nextSpellingQuestion,
  spellingRuleProgress,
  summarizeSpelling,
  useSpellingProfile,
} from '../src/profile/spellingStore';
import { ChoiceQuestion } from '../src/ui/ChoiceQuestion';
import { TrainerScreen } from '../src/ui/RulesPane';
import { StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';
import { levelLabel } from '../src/profile/mastery';
import { currentLevelNow } from '../src/profile/levelStore';
import { LevelUpNotice } from '../src/ui/LevelBadge';

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

  const [question, setQuestion] = useState<SpellingQuestion>(() =>
    nextSpellingQuestion(stats, undefined, Date.now(), currentLevelNow('spelling')),
  );
  const [picked, setPicked] = useState<number | null>(null);

  const progress = spellingRuleProgress(stats);
  const summary = summarizeSpelling(stats);

  const choose = useCallback(
    (i: number) => {
      if (picked !== null) return;
      setPicked(i);
      record(question.ruleId, i === question.correctIndex, { id: question.entry.id, level: question.entry.level });
    },
    [picked, question, record],
  );

  const advance = useCallback(() => {
    const nxt = nextSpellingQuestion(
      useSpellingProfile.getState().stats,
      question.entry.id,
      Date.now(),
      currentLevelNow('spelling'),
    );
    setQuestion(nxt);
    setPicked(null);
  }, [question.entry.id]);

  const rule = SPELLING_RULES[question.ruleId];

  return (
    <TrainerScreen
      rules={Object.values(SPELLING_RULES)}
      activeRuleId={question.ruleId}
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          Spelling
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {summary.solid} of {summary.total} rules solid. These words are pronounced one way
          and spelled another — the ear cannot always be trusted here.
        </Txt>
      </View>

      {/* One bar per rule; side by side when there is room, so the question stays on screen. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: t.space(6), rowGap: t.space(2) }}>
        {progress.map((p) => (
          <View key={p.id} style={{ gap: t.space(1), flexGrow: 1, flexBasis: 220 }}>
            <View style={s.rowBetween}>
              <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 13 }}>
                {SPELLING_RULES[p.id].da}
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

      <LevelUpNotice domain="spelling" />

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
        showOptions
      />
    </TrainerScreen>
  );
}
