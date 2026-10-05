import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { PART_MINUTES, PART_NAMES, type ExamPart, type ReadingPaper } from '../../../src/content/exams/types';
import {
  attemptsFor,
  bestTotal,
  discardDraft,
  draftKey,
  isPaused,
  remainingMs,
  startDraft,
  useAttempts,
  type ExamMode,
} from '../../../src/exam/attemptStore';
import { gradeFor, partMax } from '../../../src/exam/grade';
import { usePaper } from '../../../src/exam/papers';
import { formatClock, formatDuration, useNow } from '../../../src/ui/exam/Clock';
import { formatNote } from '../../../src/ui/exam/paperText';
import { Button, Card, Label, Txt, s } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';
import { useTheme } from '../../../src/ui/theme';

/** One paper: its two parts, how to sit them, and how earlier attempts went. */
export default function PaperOverview() {
  const t = useTheme();
  const { paperId } = useLocalSearchParams<{ paperId: string }>();
  const { paper, error, retry } = usePaper(paperId);

  if (error) {
    return (
      <Screen contentContainerStyle={{ padding: t.space(4), gap: t.space(3) }}>
        <Txt variant="body">{error}</Txt>
        <Button label="Try again" tone="ghost" onPress={retry} />
      </Screen>
    );
  }
  if (!paper) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.c.bg }}>
        <ActivityIndicator color={t.c.textMuted} />
      </View>
    );
  }
  return <Overview paper={paper} />;
}

function Overview({ paper }: { paper: ReadingPaper }) {
  const t = useTheme();
  const router = useRouter();
  const all = useAttempts((st) => st.attempts);
  const drafts = useAttempts((st) => st.drafts);
  const past = attemptsFor(all, paper.id);
  const total = bestTotal(all, paper.id);
  // Which part's open attempt is waiting on a "discard / start over?" answer.
  const [confirming, setConfirming] = React.useState<ExamPart | null>(null);

  // Keep the "N:NN left" of a running exam ticking, so coming Back from the
  // runner shows the real time left rather than the time when the page last drew.
  const ticking = (['lf1', 'lf2'] as const).some((p) => {
    const d = drafts[draftKey(paper.id, p)];
    return !!d && d.mode === 'exam' && !isPaused(d);
  });
  const now = useNow(ticking);

  /** `fresh` starts a new attempt (replacing any open one) with a new clock; otherwise the open one is continued. */
  const open = (part: ExamPart, mode: ExamMode, fresh: boolean) => {
    if (fresh) startDraft(paper.id, part, mode);
    setConfirming(null);
    router.push({ pathname: '/exam/[paperId]/[part]', params: { paperId: paper.id, part, mode } } as never);
  };

  const discard = (part: ExamPart) => {
    discardDraft(paper.id, part);
    setConfirming(null);
  };

  const startButtons = (part: ExamPart, replacing: boolean) => (
    <View style={[s.row, { gap: t.space(2) }]}>
      <Button
        label={`${replacing ? 'New exam' : 'Exam'} · ${PART_MINUTES[part]} min`}
        onPress={() => open(part, 'exam', true)}
        style={{ flex: 1 }}
      />
      <Button label={replacing ? 'New practice' : 'Practice'} tone="ghost" onPress={() => open(part, 'practice', true)} style={{ flex: 1 }} />
    </View>
  );

  const partCard = (part: ExamPart) => {
    const draft = drafts[draftKey(paper.id, part)];
    const left = draft ? remainingMs(draft, now) : null;
    const answeredCount = draft ? Object.values(draft.answers).filter((v) => v.trim()).length : 0;
    const timeUp = draft?.mode === 'exam' && (left === null || left <= 0);
    const continueLabel = !draft
      ? ''
      : draft.mode === 'practice'
        ? `Continue · ${answeredCount} answered`
        : timeUp
          ? 'Open and hand in'
          : isPaused(draft)
            ? `Continue · paused at ${formatClock(left ?? 0)}`
            : `Continue · ${formatClock(left ?? 0)} left`;
    const detail =
      part === 'lf1'
        ? `Delprøve 1 · ${paper.lf1.theme} · ${paper.lf1.questions.length} short answers`
        : paper.lf2.tasks.map((task) => `${task.label} ${task.title}`).join('  ·  ');
    return (
      <Card key={part}>
        <View style={s.rowBetween}>
          <Label color={t.c.accent}>{PART_NAMES[part]}</Label>
          <Label color={t.c.textFaint}>{`${PART_MINUTES[part]} min · ${partMax(paper, part)} point`}</Label>
        </View>
        <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 22 }}>
          {detail}
        </Txt>
        {draft ? (
          <View style={{ marginTop: t.space(3), gap: t.space(2) }}>
            <Txt variant="body" color={t.c.textMuted} style={{ lineHeight: 22 }}>
              {draft.mode === 'exam'
                ? timeUp
                  ? 'Exam in progress — time is up; it will be handed in when you open it.'
                  : isPaused(draft)
                    ? `Exam in progress, paused with ${formatClock(left ?? 0)} left. ${answeredCount} answered.`
                    : `Exam in progress — the clock is still running (${answeredCount} answered).`
                : `Practice in progress — ${answeredCount} answered.`}
            </Txt>
            {confirming === part ? (
              <Card tone="warning" style={{ padding: t.space(3), gap: t.space(2.5) }}>
                <Txt variant="body" style={{ lineHeight: 22 }}>
                  {`Throw away this ${draft.mode === 'exam' ? 'exam' : 'practice'} attempt${
                    answeredCount ? ` and its ${answeredCount} answer${answeredCount === 1 ? '' : 's'}` : ''
                  }? Starting again gives you a fresh clock.`}
                </Txt>
                {startButtons(part, true)}
                <View style={[s.row, { gap: t.space(2) }]}>
                  <Button label="Just discard" tone="ghost" onPress={() => discard(part)} style={{ flex: 1 }} />
                  <Button label="Keep it" tone="ghost" onPress={() => setConfirming(null)} style={{ flex: 1 }} />
                </View>
              </Card>
            ) : (
              <View style={[s.row, { gap: t.space(2) }]}>
                <Button label={continueLabel} onPress={() => open(part, draft.mode, false)} style={{ flex: 1 }} />
                <Button label="Start over / discard" tone="ghost" onPress={() => setConfirming(part)} style={{ flex: 1 }} />
              </View>
            )}
          </View>
        ) : (
          <View style={{ marginTop: t.space(3) }}>{startButtons(part, false)}</View>
        )}
      </Card>
    );
  };

  return (
    <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: t.space(12), gap: t.space(4) }}>
      <View>
        <Label color={t.c.textMuted}>{paper.source.kind === 'official' ? 'Official paper' : 'Simulated paper'}</Label>
        <Txt variant="display" style={{ fontSize: 28, lineHeight: 34, marginTop: t.space(1) }}>
          {paper.title}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
          {formatNote(paper)}
        </Txt>
        {paper.source.kind === 'official' ? (
          <Txt variant="label" color={t.c.textFaint} style={{ marginTop: t.space(1.5) }}>
            {`Source: ${paper.source.label}`}
          </Txt>
        ) : null}
      </View>

      <Txt variant="body" color={t.c.textMuted} style={{ lineHeight: 22 }}>
        Exam mode is timed like the real thing and shows nothing until you hand in. Practice has no clock and lets you
        check each answer as you go.
      </Txt>

      {partCard('lf1')}
      {partCard('lf2')}

      {total ? (
        <Card tone="sunken">
          <Label>Best result on this paper</Label>
          <Txt variant="title" style={{ marginTop: t.space(1) }}>
            {`${total.points}/${total.max} point · grade ${gradeFor(paper.gradeTable, total.points)}`}
          </Txt>
        </Card>
      ) : null}

      {past.length ? (
        <View style={{ gap: t.space(2) }}>
          <Txt variant="heading" color={t.c.textMuted}>
            Earlier attempts
          </Txt>
          {past.map((a) => (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/exam/[paperId]/result', params: { paperId: paper.id, attempt: a.id } } as never)}
              style={({ pressed }) => ({
                padding: t.space(3),
                borderRadius: t.radius.md,
                borderWidth: 1,
                borderColor: t.c.border,
                backgroundColor: pressed ? t.c.surfaceSunken : t.c.surface,
              })}
            >
              <View style={s.rowBetween}>
                <Txt variant="heading">{`${PART_NAMES[a.part]} · ${a.points}/${a.max}`}</Txt>
                <Label color={t.c.textFaint}>{a.mode === 'exam' ? 'Exam' : 'Practice'}</Label>
              </View>
              <Txt variant="label" color={t.c.textMuted} style={{ marginTop: 2 }}>
                {`${new Date(a.finishedAt).toLocaleDateString()} · ${formatDuration(a.durationMs)}`}
              </Txt>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
