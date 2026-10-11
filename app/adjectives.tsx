import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADJECTIVE_RULES } from '../src/grammar/adjectiveRules';
import type { AdjectiveQuestion } from '../src/grammar/adjectiveExercise';
import {
  adjectiveRuleProgress,
  adjectiveQuestionLevel,
  nextAdjectiveQuestion,
  summarizeAdjectives,
  useAdjectiveProfile,
} from '../src/profile/adjectiveStore';
import { ChoiceQuestion } from '../src/ui/ChoiceQuestion';
import { TrainerScreen } from '../src/ui/RulesPane';
import { StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';
import { levelLabel } from '../src/profile/mastery';
import { currentLevelNow } from '../src/profile/levelStore';
import { LevelUpNotice } from '../src/ui/LevelBadge';

/**
 * The adjective-agreement trainer.
 *
 * Deliberately built as a near-twin of nouns.tsx rather than a generalised
 * trainer shared between them; only the question itself (ChoiceQuestion, the
 * typed answer box) is shared. The two screens happen to look alike today
 * because both domains happen to need three typed-form rules right now —
 * that is a coincidence of content, not a
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

  const [question, setQuestion] = useState<AdjectiveQuestion>(() =>
    nextAdjectiveQuestion(stats, undefined, Date.now(), currentLevelNow('adjectives')),
  );
  const [picked, setPicked] = useState<number | null>(null);

  const progress = adjectiveRuleProgress(stats);
  const summary = summarizeAdjectives(stats);

  const choose = useCallback(
    (i: number) => {
      if (picked !== null) return;
      setPicked(i);
      record(question.ruleId, i === question.correctIndex, { id: question.adjective.id, level: adjectiveQuestionLevel(question) });
    },
    [picked, question, record],
  );

  const advance = useCallback(() => {
    const nxt = nextAdjectiveQuestion(
      useAdjectiveProfile.getState().stats,
      question.adjective.id,
      Date.now(),
      currentLevelNow('adjectives'),
    );
    setQuestion(nxt);
    setPicked(null);
  }, [question.adjective.id]);

  const rule = ADJECTIVE_RULES[question.ruleId];

  return (
    <TrainerScreen
      rules={Object.values(ADJECTIVE_RULES)}
      activeRuleId={question.ruleId}
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

      {/* One bar per rule; side by side when there is room, so the question stays on screen. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: t.space(6), rowGap: t.space(2) }}>
        {progress.map((p) => (
          <View key={p.id} style={{ gap: t.space(1), flexGrow: 1, flexBasis: 220 }}>
            <View style={s.rowBetween}>
              <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 13 }}>
                {ADJECTIVE_RULES[p.id].da}
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

      <LevelUpNotice domain="adjectives" />

      <ChoiceQuestion
        label={rule.da}
        level={adjectiveQuestionLevel(question)}
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
