import React, { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrainerScreen } from '../src/ui/RulesPane';
import { RULES } from '../src/grammar/rules';
import type { Evaluation, Exercise } from '../src/grammar/types';
import { nextExercise, useProfile } from '../src/profile/store';
import { useSettings } from '../src/profile/settings';
import { currentLevelNow } from '../src/profile/levelStore';
import { LevelUpNotice } from '../src/ui/LevelBadge';
import { SchemaQuestion } from '../src/ui/SchemaQuestion';
import { useTheme } from '../src/ui/theme';

/**
 * The trainer.
 *
 * One exercise at a time, chosen by the learner model rather than by a fixed
 * lesson order, so the sentence in front of you is the one your profile says
 * you need. The exercise itself — board, check, diagnosis — is SchemaQuestion.
 */
export default function Train() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const stats = useProfile((st) => st.stats);
  const seen = useProfile((st) => st.seen);
  const record = useProfile((st) => st.record);
  const targetExam = useSettings((st) => st.targetExam);

  const [exercise, setExercise] = useState<Exercise>(() =>
    nextExercise(stats, seen, undefined, Date.now(), targetExam, currentLevelNow('grammar')),
  );

  const checked = useCallback(
    (evaluation: Evaluation, violated: string[]) => record(exercise, evaluation.correct, violated as never),
    [exercise, record],
  );

  const advance = useCallback(() => {
    const nxt = nextExercise(
      useProfile.getState().stats,
      useProfile.getState().seen,
      exercise.id,
      Date.now(),
      useSettings.getState().targetExam,
      currentLevelNow('grammar'),
    );
    setExercise(nxt);
  }, [exercise.id]);

  return (
    <TrainerScreen
      rules={Object.values(RULES)}
      activeRuleId={exercise.targets[0]}
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(10),
        gap: t.space(4),
      }}
    >
      <LevelUpNotice domain="grammar" />
      <SchemaQuestion key={exercise.id} exercise={exercise} onChecked={checked} onNext={advance} />
    </TrainerScreen>
  );
}
