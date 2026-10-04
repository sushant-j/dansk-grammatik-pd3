import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { PART_NAMES, type ReadingPaper } from '../../../src/content/exams/types';
import { bestTotal, setSelfMark, useAttempts, type Attempt } from '../../../src/exam/attemptStore';
import { gradeFor, isPassingGrade, scorePart, type ItemResult } from '../../../src/exam/grade';
import { usePaper } from '../../../src/exam/papers';
import { formatDuration } from '../../../src/ui/exam/Clock';
import { Button, Card, Label, Txt, s } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';
import { useTheme } from '../../../src/ui/theme';

/** The marked paper: points, the grade it adds up to, and every answer against the key. */
export default function ReadingResult() {
  const t = useTheme();
  const { paperId, attempt: attemptId } = useLocalSearchParams<{ paperId: string; attempt: string }>();
  const { paper, error, retry } = usePaper(paperId);
  const attempt = useAttempts((st) => st.attempts.find((a) => a.id === attemptId));

  if (error) {
    return (
      <Screen contentContainerStyle={{ padding: t.space(4), gap: t.space(3) }}>
        <Txt variant="body">{error}</Txt>
        <Button label="Try again" tone="ghost" onPress={retry} />
      </Screen>
    );
  }
  if (!paper || !attempt) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.c.bg }}>
        {paper ? <Txt variant="body">This attempt isn’t on this device.</Txt> : <ActivityIndicator color={t.c.textMuted} />}
      </View>
    );
  }
  return <Result paper={paper} attempt={attempt} />;
}

function Result({ paper, attempt }: { paper: ReadingPaper; attempt: Attempt }) {
  const t = useTheme();
  const router = useRouter();
  const attempts = useAttempts((st) => st.attempts);
  const score = scorePart(paper, attempt.part, attempt.answers, attempt.selfMarks);
  const total = bestTotal(attempts, paper.id);
  const other = attempt.part === 'lf1' ? 'lf2' : 'lf1';
  const grade = total ? gradeFor(paper.gradeTable, total.points) : null;

  return (
    <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: t.space(12), gap: t.space(4) }}>
      <View>
        <Label color={t.c.textMuted}>{`${paper.title} · ${attempt.mode === 'exam' ? 'Exam' : 'Practice'}`}</Label>
        <Txt variant="display" style={{ fontSize: 28, lineHeight: 34, marginTop: t.space(1) }}>
          {PART_NAMES[attempt.part]}
        </Txt>
      </View>

      <Card>
        <View style={[s.row, { alignItems: 'flex-end', gap: t.space(2) }]}>
          <Txt variant="display">{String(score.points)}</Txt>
          <Txt variant="title" color={t.c.textMuted} style={{ marginBottom: 3 }}>
            {`/ ${score.max} point`}
          </Txt>
        </View>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {`Time used: ${formatDuration(attempt.durationMs)}`}
        </Txt>
        <View style={{ marginTop: t.space(3), gap: t.space(1.5) }}>
          {score.byTask.map((task) => (
            <View key={task.label} style={s.rowBetween}>
              <Txt variant="body" style={{ flex: 1 }} numberOfLines={1}>
                {`Delprøve ${task.label}  ·  ${task.title}`}
              </Txt>
              <Txt variant="heading">{`${task.points}/${task.max}`}</Txt>
            </View>
          ))}
        </View>
      </Card>

      {total && grade ? (
        <Card tone={isPassingGrade(grade) ? 'success' : 'warning'}>
          <Label color={isPassingGrade(grade) ? t.c.success : t.c.warning}>Reading grade</Label>
          <View style={[s.row, { alignItems: 'flex-end', gap: t.space(3), marginTop: t.space(1) }]}>
            <Txt variant="display">{grade}</Txt>
            <Txt variant="body" color={t.c.textMuted} style={{ marginBottom: 4, flex: 1 }}>
              {`${total.points}/${total.max} points: your best Læseforståelse 1 plus your best Læseforståelse 2 on this paper${
                paper.gradeTableFrom ? ' (this session’s conversion table isn’t available, so a neighbouring one is used)' : ''
              }.`}
            </Txt>
          </View>
        </Card>
      ) : (
        <Card tone="sunken">
          <Txt variant="body" style={{ lineHeight: 22 }}>
            {`The reading grade combines both parts. Do ${PART_NAMES[other]} of this paper to see it.`}
          </Txt>
          <Button
            label={`Go to ${PART_NAMES[other]}`}
            tone="ghost"
            style={{ marginTop: t.space(3) }}
            onPress={() => router.replace({ pathname: '/exam/[paperId]', params: { paperId: paper.id } } as never)}
          />
        </Card>
      )}

      <Txt variant="title">Your answers</Txt>
      {attempt.part === 'lf1' ? (
        <Txt variant="body" color={t.c.textMuted} style={{ lineHeight: 22, marginTop: -t.space(2) }}>
          The answer key is a guide, and the censor may accept other answers. If your answer says the same as the key in
          other words, mark it right yourself.
        </Txt>
      ) : null}
      <View style={{ gap: t.space(2) }}>
        {score.items.map((item) => (
          <ItemRow key={item.id} item={item} paper={paper} attempt={attempt} />
        ))}
      </View>

      <View style={{ gap: t.space(2), marginTop: t.space(2) }}>
        <Button
          label="Back to the paper"
          onPress={() => router.replace({ pathname: '/exam/[paperId]', params: { paperId: paper.id } } as never)}
        />
      </View>
    </Screen>
  );
}

function ItemRow({ item, paper, attempt }: { item: ItemResult; paper: ReadingPaper; attempt: Attempt }) {
  const t = useTheme();
  const lf1 = attempt.part === 'lf1';
  const prompt = lf1 ? paper.lf1.questions.find((q) => `q${q.n}` === item.id)?.prompt : undefined;
  const override = attempt.selfMarks[item.id];

  return (
    <View
      style={{
        padding: t.space(3),
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: item.correct ? t.c.success + '55' : t.c.warning + '55',
        backgroundColor: item.correct ? t.c.successSoft : t.c.warningSoft,
        gap: t.space(1),
      }}
    >
      <View style={s.rowBetween}>
        <Txt variant="heading">{item.label}</Txt>
        <Label color={item.correct ? t.c.success : t.c.warning}>
          {`${item.points}/${item.max}${item.selfMarked ? ' · marked by you' : ''}`}
        </Label>
      </View>
      {prompt ? (
        <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 14, lineHeight: 20 }}>
          {prompt}
        </Txt>
      ) : null}
      <Txt variant="body" style={{ fontSize: 15 }}>
        {`Your answer: ${item.given.trim() || '—'}`}
      </Txt>
      {!item.correct || lf1 ? (
        <Txt variant="body" style={{ fontSize: 15 }}>
          {`${lf1 ? 'Rettenøgle' : 'Right answer'}: ${item.key}`}
        </Txt>
      ) : null}
      {lf1 && item.given.trim() ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setSelfMark(paper, attempt.id, item.id, override === undefined ? !item.correct : null)}
          style={{ alignSelf: 'flex-start', marginTop: t.space(1) }}
        >
          <Txt variant="label" color={t.c.accent}>
            {override !== undefined ? 'Undo my marking' : item.correct ? 'Mark as wrong' : 'Mark as right'}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
