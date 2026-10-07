import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAP } from '../../../src/drills/drillExercise';
import { renderSentence } from '../../../src/grammar/analyze';
import { ALL_NODE_IDS, WORLDS, lessonById, unitById, unitForCheckpoint } from '../../../src/path/curriculum';
import type { PathState } from '../../../src/path/progress';
import { nextPathQuestion, type PathQuestion } from '../../../src/path/questions';
import { indexedRule } from '../../../src/path/ruleIndex';
import { planSession, sessionPassed, starsFor, type SessionMode, type SessionSlot } from '../../../src/path/session';
import { recordPathSession, usePathState } from '../../../src/path/store';
import { ChoiceQuestion } from '../../../src/ui/ChoiceQuestion';
import { SchemaQuestion } from '../../../src/ui/SchemaQuestion';
import { TrainerScreen, type PaneRule } from '../../../src/ui/RulesPane';
import { Button, Card, Label, Txt, s } from '../../../src/ui/primitives';
import { useTheme } from '../../../src/ui/theme';

/**
 * A path session: a lesson, a checkpoint, or a repair, one question at a time,
 * then the result.
 *
 * Each answer is recorded with the trainer that owns the rule as it is given,
 * so it counts towards mastery even if the session is abandoned. The session
 * itself is logged once, at the end — that one event is what passes a lesson.
 * A scored session allows no retries within it: the result should say what
 * the learner knew, and "Try again" on the result screen is always there.
 */
export default function RunScreen() {
  const { nodeId, mode: modeParam } = useLocalSearchParams<{ nodeId: string; mode?: string }>();
  const t = useTheme();
  const router = useRouter();
  const state = usePathState();
  const [attempt, setAttempt] = useState(0);

  const isCheckpoint = !!unitForCheckpoint(nodeId);
  const mode: SessionMode = isCheckpoint ? 'checkpoint' : modeParam === 'repair' ? 'repair' : 'lesson';
  const lesson = lessonById(nodeId);

  // Only an open node can be played; a stale link to a locked one says so.
  const open = isCheckpoint
    ? state.checkpoints[nodeId]?.status !== 'locked'
    : !!lesson && state.lessons[nodeId].status !== 'locked';

  if (!ALL_NODE_IDS.includes(nodeId) || !open) {
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bg, padding: t.space(4), gap: t.space(3) }}>
        <Txt variant="title">{ALL_NODE_IDS.includes(nodeId) ? 'This lesson is still locked' : 'Unknown lesson'}</Txt>
        <Button tone="ghost" label="Back to the path" onPress={() => router.back()} />
      </View>
    );
  }

  return <Session key={`${nodeId}:${mode}:${attempt}`} nodeId={nodeId} mode={mode} onRetry={() => setAttempt((a) => a + 1)} />;
}

interface Answered {
  question: PathQuestion;
  correct: boolean;
}

/** The rules a session touches, the one being learnt first: what the rules pane holds. */
function sessionRules(slots: SessionSlot[]): PaneRule[] {
  const ids = [...new Set(slots.filter((x) => !x.review).map((x) => x.ruleId)), ...new Set(slots.filter((x) => x.review).map((x) => x.ruleId))];
  return [...new Set(ids)].map((id) => indexedRule(id)).filter((r): r is NonNullable<typeof r> => !!r);
}

function worldLevel(nodeId: string) {
  const worldIndex = lessonById(nodeId)?.worldIndex ?? unitForCheckpoint(nodeId)?.worldIndex ?? 0;
  return WORLDS[worldIndex].level;
}

function Session({ nodeId, mode, onRetry }: { nodeId: string; mode: SessionMode; onRetry: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const state = usePathState();
  // The path as it stood before this session, to show what it unlocked.
  const [before] = useState<PathState>(state);
  const level = worldLevel(nodeId);

  const used = useRef(new Set<string>());
  const build = useCallback(
    (slot: SessionSlot): PathQuestion | null => {
      const q = nextPathQuestion(slot.ruleId, level, used.current, slot.review);
      if (q) used.current.add(q.itemId);
      return q;
    },
    [level],
  );

  const [slots] = useState(() => planSession(nodeId, mode));
  const rules = useState(() => sessionRules(slots))[0];
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<PathQuestion | null>(() => (slots.length ? build(slots[0]) : null));
  const [picked, setPicked] = useState<number | null>(null);
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [finished, setFinished] = useState(false);
  const logged = useRef(false);

  const total = slots.length;
  const right = answered.filter((a) => a.correct).length;
  const answeredThis = answered.length > index;

  const answer = useCallback(
    (correct: boolean) => {
      if (!question || answered.length > index) return;
      setAnswered((a) => [...a, { question, correct }]);
    },
    [question, answered.length, index],
  );

  const choose = useCallback(
    (i: number) => {
      if (!question || question.kind !== 'choice' || picked !== null) return;
      setPicked(i);
      const correct = i === question.correctIndex;
      question.record(correct);
      answer(correct);
    },
    [question, picked, answer],
  );

  const finish = useCallback(
    (all: Answered[]) => {
      if (!logged.current && mode !== 'repair') {
        logged.current = true;
        const outcomes = Object.fromEntries(all.map((a, i) => [`q${i + 1}:${a.question.itemId}`, a.correct]));
        const ok = all.filter((a) => a.correct).length;
        recordPathSession(nodeId, outcomes, sessionPassed(mode, ok, all.length));
      }
      setFinished(true);
    },
    [mode, nodeId],
  );

  const next = useCallback(() => {
    if (index + 1 >= total) {
      finish(answered);
      return;
    }
    const n = index + 1;
    setIndex(n);
    setPicked(null);
    setQuestion(build(slots[n]));
  }, [index, total, answered, finish, build, slots]);

  const title =
    mode === 'checkpoint' ? 'Checkpoint' : mode === 'repair' ? 'Repair' : lessonById(nodeId)?.rule.da ?? 'Lesson';

  if (finished) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <Result nodeId={nodeId} mode={mode} answered={answered} before={before} rules={rules} onRetry={onRetry} />
      </>
    );
  }

  const nextLabel = index + 1 >= total ? 'See result' : 'Next';
  const reviewTag = question?.review ? `Review · ${indexedRule(question.ruleId)?.da ?? ''}` : undefined;

  return (
    <>
      <Stack.Screen options={{ title }} />
      {/* The session's rules stay in view: beside the questions on a wide
          window, behind a "Rules" button on a phone; the one being asked is open. */}
      <TrainerScreen
        rules={rules}
        activeRuleId={question?.ruleId}
        contentContainerStyle={{ padding: t.space(4), paddingBottom: insets.bottom + t.space(10), gap: t.space(4) }}
      >
        {/* Progress: one segment per question, coloured as it is answered. */}
        <View style={{ gap: t.space(2) }}>
          <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Question ${index + 1} of ${total}`}>
            {slots.map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    i < answered.length
                      ? answered[i].correct
                        ? t.c.success
                        : t.c.accent
                      : i === index
                        ? t.c.borderStrong
                        : t.c.surfaceSunken,
                }}
              />
            ))}
          </View>
          <View style={s.rowBetween}>
            <Txt variant="label" color={t.c.textMuted}>
              {index + 1} / {total}
            </Txt>
            <Txt variant="label" color={t.c.textMuted}>
              <Txt variant="label" color={t.c.success}>
                ✓ {right}
              </Txt>
              {'   '}
              <Txt variant="label" color={t.c.accent}>
                ✗ {answered.length - right}
              </Txt>
            </Txt>
          </View>
        </View>

        {!question ? (
          <Card tone="sunken">
            <Txt variant="body">No question could be found for this rule. Skip it.</Txt>
            <Button label={nextLabel} onPress={next} style={{ marginTop: t.space(3) }} />
          </Card>
        ) : question.kind === 'choice' ? (
          <ChoiceQuestion
            key={index}
            label={indexedRule(question.ruleId)?.da ?? ''}
            level={question.level}
            tag={reviewTag}
            prompt={question.prompt}
            options={question.options}
            correctIndex={question.correctIndex}
            picked={picked}
            onChoose={choose}
            explanation={question.explanation}
            explanationEn={question.explanationEn}
            onNext={next}
            nextLabel={nextLabel}
          />
        ) : (
          <SchemaQuestion
            key={index}
            exercise={question.exercise}
            tag={reviewTag}
            allowRetry={false}
            onChecked={(evaluation, violated) => {
              if (answeredThis) return;
              question.record(evaluation.correct, violated);
              answer(evaluation.correct);
            }}
            onNext={next}
            nextLabel={nextLabel}
          />
        )}
      </TrainerScreen>
    </>
  );
}

/** A missed question as one readable line: the right sentence, or the prompt and its answer. */
function missedText(q: PathQuestion): string {
  if (q.kind === 'schema') return renderSentence(q.exercise, q.exercise.solution);
  const answer = q.options[q.correctIndex];
  return q.prompt.includes(GAP) ? q.prompt.replace(GAP, answer) : `${q.prompt} → ${answer}`;
}

function Result({
  nodeId,
  mode,
  answered,
  before,
  rules,
  onRetry,
}: {
  nodeId: string;
  mode: SessionMode;
  answered: Answered[];
  before: PathState;
  rules: PaneRule[];
  onRetry: () => void;
}) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const after = usePathState();

  const total = answered.length;
  const right = answered.filter((a) => a.correct).length;
  const passed = sessionPassed(mode, right, total);
  const stars = mode === 'lesson' ? starsFor(right, total) : 0;
  const missed = answered.filter((a) => !a.correct);

  // What this session opened: lessons and checkpoints that were locked before.
  const unlocked = [
    ...Object.entries(after.lessons)
      .filter(([id, s]) => s.status === 'available' && before.lessons[id]?.status === 'locked')
      .map(([id]) => lessonById(id)?.rule.da ?? id),
    ...after.worlds
      .map((w, i) => (w.open && !before.worlds[i].open ? `Niveau ${i + 1}` : null))
      .filter((x): x is string => !!x),
  ];
  const testedOut = mode === 'checkpoint' && passed
    ? Object.entries(after.lessons).filter(([id, s]) => s.status === 'testedOut' && before.lessons[id]?.status !== 'testedOut').length
    : 0;
  // Carry on in this unit if it has an open lesson (that is usually what was
  // just unlocked); otherwise the first open lesson on the path.
  const unit = unitById(lessonById(nodeId)?.unitId ?? '');
  const nextLesson =
    unit?.lessons.find((l) => l.id !== nodeId && after.lessons[l.id].status === 'available')?.id ?? after.nextLessonId;

  const headline =
    mode === 'repair'
      ? `Repair done – ${right}/${total}`
      : passed
        ? `${mode === 'checkpoint' ? 'Checkpoint' : 'Lesson'} passed – ${right}/${total}`
        : `${right}/${total} – need ${mode === 'checkpoint' ? 10 : 6} to pass`;
  const sub =
    mode === 'repair'
      ? 'The crack clears once the rule is back to solid — a strong repair usually does it.'
      : passed
        ? stars === 3
          ? 'A perfect run.'
          : 'Your best score is kept.'
        : 'Nothing is lost: every answer still counts towards your mastery.';

  return (
    <TrainerScreen
      rules={rules}
      activeRuleId={missed[0]?.question.ruleId}
      contentContainerStyle={{ padding: t.space(4), paddingTop: t.space(10), paddingBottom: insets.bottom + t.space(10), gap: t.space(5) }}
    >
      <View style={{ alignItems: 'center', gap: t.space(3) }}>
        {mode === 'lesson' ? (
          <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`${stars} of 3 stars`}>
            {[0, 1, 2].map((i) => (
              <Ionicons key={i} name="star" size={52} color={i < stars ? t.c.warning : t.c.border} />
            ))}
          </View>
        ) : (
          <Ionicons
            name={mode === 'repair' ? 'flash' : passed ? 'flag' : 'flag-outline'}
            size={52}
            color={passed ? t.c.success : t.c.textFaint}
          />
        )}
        <Txt variant="display" style={{ fontSize: 26, textAlign: 'center' }}>
          {headline}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ textAlign: 'center' }}>
          {sub}
        </Txt>
      </View>

      {testedOut ? (
        <Card tone="success">
          <Label color={t.c.success}>Tested out</Label>
          <Txt variant="body" style={{ marginTop: t.space(1.5) }}>
            {testedOut} lesson{testedOut === 1 ? '' : 's'} in this unit now count as done.
          </Txt>
        </Card>
      ) : null}

      {unlocked.length ? (
        <Card tone="success">
          <Label color={t.c.success}>Unlocked</Label>
          {unlocked.slice(0, 4).map((name) => (
            <Txt key={name} variant="heading" style={{ marginTop: t.space(1.5) }}>
              {name}
            </Txt>
          ))}
          {unlocked.length > 4 ? (
            <Txt variant="label" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
              and {unlocked.length - 4} more
            </Txt>
          ) : null}
        </Card>
      ) : null}

      {missed.length ? (
        <View style={{ gap: t.space(2) }}>
          <Label>Missed</Label>
          {missed.map((m, i) => (
            <Pressable
              key={i}
              onPress={() => router.push(`/rule/${m.question.ruleId}` as never)}
              accessibilityRole="link"
              style={({ pressed }) => [
                {
                  backgroundColor: t.c.surface,
                  borderWidth: 1,
                  borderColor: t.c.border,
                  borderRadius: t.radius.lg,
                  padding: t.space(3.5),
                  gap: 4,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Txt variant="body">{missedText(m.question)}</Txt>
              <Txt variant="label" color={t.c.accent} style={{ fontWeight: '600' }}>
                {indexedRule(m.question.ruleId)?.da} ›
              </Txt>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={{ gap: t.space(2) }}>
        {passed || mode === 'repair' ? (
          <>
            {mode !== 'repair' && nextLesson && nextLesson !== nodeId ? (
              <Button label="Next lesson ›" onPress={() => router.replace(`/path/${nextLesson}` as never)} />
            ) : (
              <Button label="Back to the path" onPress={() => router.dismissTo('/' as never)} />
            )}
            {mode === 'lesson' && stars < 3 ? <Button tone="ghost" label="Try again for ★★★" onPress={onRetry} /> : null}
          </>
        ) : (
          <>
            <Button label="Try again" onPress={onRetry} />
            {mode === 'lesson' ? (
              <Button tone="ghost" label="Read the rule" onPress={() => router.push(`/rule/${nodeId}` as never)} />
            ) : (
              <Button tone="ghost" label="Back to the path" onPress={() => router.dismissTo('/' as never)} />
            )}
          </>
        )}
      </View>
    </TrainerScreen>
  );
}
