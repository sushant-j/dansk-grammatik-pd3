import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VERB_RULES } from '../src/grammar/verbRules';
import type { VerbQuestion } from '../src/grammar/verbExercise';
import { nextVerbQuestion, summarizeVerbs, useVerbProfile, verbRuleProgress } from '../src/profile/verbStore';
import { ChoiceQuestion } from '../src/ui/ChoiceQuestion';
import { TrainerScreen } from '../src/ui/RulesPane';
import { StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';
import { levelLabel } from '../src/profile/mastery';
import { currentLevelNow } from '../src/profile/levelStore';
import { LevelUpNotice } from '../src/ui/LevelBadge';

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
          Verb forms
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {summary.solid} of {summary.total} rules solid. Weak verbs take a suffix; strong verbs
          change shape entirely; and the auxiliary — er or har — tracks meaning, not verb type.
        </Txt>
      </View>

      {/* One bar per rule; side by side when there is room, so the question stays on screen. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: t.space(6), rowGap: t.space(2) }}>
        {progress.map((p) => (
          <View key={p.id} style={{ gap: t.space(1), flexGrow: 1, flexBasis: 220 }}>
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

      <ChoiceQuestion
        label={rule.da}
        level={question.verb.level}
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
