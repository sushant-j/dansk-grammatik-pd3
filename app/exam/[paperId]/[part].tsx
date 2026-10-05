import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { ExamPart, InsertTask, Lf2Task, ReadingPaper } from '../../../src/content/exams/types';
import { PART_NAMES } from '../../../src/content/exams/types';
import {
  draftKey,
  isPaused,
  markChecked,
  pauseDraft,
  remainingMs,
  resumeDraft,
  setAnswer,
  startDraft,
  submitDraft,
  useAttempts,
  type Draft,
  type ExamMode,
} from '../../../src/exam/attemptStore';
import { lf2ItemId, partItemIds } from '../../../src/exam/grade';
import { usePaper } from '../../../src/exam/papers';
import { Countdown, formatClock, useNow } from '../../../src/ui/exam/Clock';
import { ChoiceItem, InsertPicker, Lf1Item } from '../../../src/ui/exam/items';
import { PassageBlocks, PassageTitle } from '../../../src/ui/exam/Passage';
import { ReadingLayout, useIsWide, type Pane } from '../../../src/ui/exam/ReadingLayout';
import { Button, Card, Label, Txt, s, withFont } from '../../../src/ui/primitives';
import { Segmented } from '../../../src/ui/Segmented';
import { useTheme } from '../../../src/ui/theme';

/** Sitting one part of a reading paper: Læseforståelse 1 or 2, timed or as practice. */
export default function ReadingRunner() {
  const { paperId, part, mode } = useLocalSearchParams<{ paperId: string; part: string; mode?: string }>();
  const { paper, error, retry } = usePaper(paperId);

  if (part !== 'lf1' && part !== 'lf2') return <Message text="There is no such part of the paper." />;
  if (error) return <Message text={error} onRetry={retry} />;
  if (!paper) return <Loading />;
  return <Runner paper={paper} part={part} mode={mode === 'exam' ? 'exam' : 'practice'} />;
}

function Loading() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.c.bg }}>
      <ActivityIndicator color={t.c.textMuted} />
    </View>
  );
}

function Message({ text, onRetry }: { text: string; onRetry?: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, padding: t.space(6), gap: t.space(4), backgroundColor: t.c.bg }}>
      <Txt variant="body">{text}</Txt>
      {onRetry ? <Button label="Try again" tone="ghost" onPress={onRetry} /> : null}
    </View>
  );
}

function Runner({ paper, part, mode }: { paper: ReadingPaper; part: ExamPart; mode: ExamMode }) {
  const router = useRouter();
  const hydrated = useAttempts((st) => st.hydrated);
  const draft = useAttempts((st) => st.drafts[draftKey(paper.id, part)]);
  const submitted = useRef(false);

  // Resume the saved draft if there is one, otherwise start fresh in the mode asked for.
  useEffect(() => {
    if (hydrated && !draft && !submitted.current) startDraft(paper.id, part, mode);
  }, [hydrated, draft, paper.id, part, mode]);

  const finish = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    const attempt = submitDraft(paper, part);
    if (attempt) router.replace({ pathname: '/exam/[paperId]/result', params: { paperId: paper.id, attempt: attempt.id } } as never);
  }, [paper, part, router]);

  if (!draft) return <Loading />;
  return <Desk paper={paper} part={part} draft={draft} onFinish={finish} />;
}

function Desk({
  paper,
  part,
  draft,
  onFinish,
}: {
  paper: ReadingPaper;
  part: ExamPart;
  draft: Draft;
  onFinish: () => void;
}) {
  const t = useTheme();
  const wide = useIsWide();
  const passageRef = useRef<ScrollView>(null);
  const questionsRef = useRef<ScrollView>(null);
  const [pane, setPane] = useState<Pane>('text');
  const [taskIdx, setTaskIdx] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [focusItem, setFocusItem] = useState<string | null>(null);
  const itemY = useRef<Record<string, number>>({});
  const sectionY = useRef<Record<number, number>>({});

  const practice = draft.mode === 'practice';
  const paused = isPaused(draft);
  // The clock only ticks while it is running. Right after a resume `now` may
  // still hold the time of its last tick, earlier than the real time, so for
  // that one render `remaining` can only be overstated — it never expires early.
  const now = useNow(!practice && !paused);
  const remaining = remainingMs(draft, now);

  // Time's up: hand the paper in, as the invigilator would. A paused clock never runs out.
  useEffect(() => {
    if (!paused && remaining !== null && remaining <= 0) onFinish();
  }, [paused, remaining, onFinish]);

  const ids = useMemo(() => partItemIds(paper, part), [paper, part]);
  const answered = ids.filter((id) => (draft.answers[id] ?? '').trim()).length;

  const answer = (id: string) => draft.answers[id] ?? '';
  const set = (id: string) => (v: string) => setAnswer(paper.id, part, id, v);
  const practiceProps = (id: string) => ({
    practice,
    checked: draft.checked.includes(id),
    onCheck: () => markChecked(paper.id, part, id),
  });

  /** From a gap in the text to its question: switch pane on a phone, then scroll to it. */
  const goToItem = (id: string) => {
    setFocusItem(id);
    if (!wide) setPane('questions');
    const y = itemY.current[id];
    if (y !== undefined) setTimeout(() => questionsRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true }), 50);
  };

  const track = (id: string, child: React.ReactNode) => (
    <View key={id} onLayout={(e) => (itemY.current[id] = e.nativeEvent.layout.y)} style={{ marginBottom: t.space(3) }}>
      {child}
    </View>
  );

  const switchTask = (i: number) => {
    setTaskIdx(i);
    setFocusItem(null);
    itemY.current = {};
    passageRef.current?.scrollTo({ y: 0, animated: false });
    questionsRef.current?.scrollTo({ y: 0, animated: false });
  };

  // ── Top bar ──────────────────────────────────────────────────────────────

  const top = (
    <View style={{ gap: t.space(2.5) }}>
      <View style={[s.rowBetween, { gap: t.space(3) }]}>
        <View style={{ flex: 1 }}>
          <Label color={t.c.textMuted}>{practice ? 'Practice' : 'Exam'}</Label>
          <Txt variant="heading" numberOfLines={1}>
            {PART_NAMES[part]}
            <Txt variant="body" color={t.c.textMuted}>{`  ·  ${paper.title}`}</Txt>
          </Txt>
        </View>
        {remaining !== null ? <Countdown remaining={remaining} /> : null}
        {remaining !== null ? (
          <Button
            label={paused ? 'Resume' : 'Pause'}
            tone="ghost"
            onPress={() => (paused ? resumeDraft(paper.id, part) : pauseDraft(paper.id, part))}
            style={{ paddingVertical: t.space(2), paddingHorizontal: t.space(4) }}
          />
        ) : null}
        <Button label="Hand in" onPress={() => setConfirming(true)} style={{ paddingVertical: t.space(2), paddingHorizontal: t.space(4) }} />
      </View>
      {part === 'lf2' ? (
        <Segmented
          compact
          options={paper.lf2.tasks.map((task, i) => ({ key: String(i), label: task.label }))}
          value={String(taskIdx)}
          onChange={(k) => switchTask(Number(k))}
        />
      ) : null}
      {confirming ? (
        <Card tone="warning" style={{ padding: t.space(3) }}>
          <Txt variant="body" style={{ lineHeight: 22 }}>
            {answered < ids.length
              ? `${ids.length - answered} of ${ids.length} unanswered. Hand in anyway?`
              : 'Hand in your answers?'}
            {part === 'lf2' ? ' This hands in 2A, 2B and 3 together.' : ''}
          </Txt>
          <View style={[s.row, { gap: t.space(2), marginTop: t.space(2.5) }]}>
            <Button label="Hand in" onPress={onFinish} style={{ flex: 1, paddingVertical: t.space(2.5) }} />
            <Button label="Keep going" tone="ghost" onPress={() => setConfirming(false)} style={{ flex: 1, paddingVertical: t.space(2.5) }} />
          </View>
        </Card>
      ) : null}
    </View>
  );

  // ── Panes ────────────────────────────────────────────────────────────────

  let passage: React.ReactNode;
  let questions: React.ReactNode;

  if (part === 'lf1') {
    ({ passage, questions } = lf1Panes());
  } else {
    ({ passage, questions } = lf2Panes(paper.lf2.tasks[taskIdx], taskIdx));
  }

  function lf1Panes() {
    const toc = (
      <Card tone="sunken" style={{ marginBottom: t.space(6) }}>
        <Label>Indhold</Label>
        <Txt variant="title" style={{ marginTop: t.space(1), marginBottom: t.space(2) }}>
          {paper.lf1.theme}
        </Txt>
        {paper.lf1.sections.map((sec, i) => (
          <Pressable
            key={i}
            accessibilityRole="link"
            onPress={() => passageRef.current?.scrollTo({ y: Math.max(0, (sectionY.current[i] ?? 0) - 8), animated: true })}
            style={({ pressed }) => ({ paddingVertical: t.space(1.5), opacity: pressed ? 0.6 : 1 })}
          >
            <Txt variant="body" color={t.c.accent} style={{ textDecorationLine: 'underline' }}>
              {sec.title}
            </Txt>
          </Pressable>
        ))}
      </Card>
    );
    const p = (
      <>
        {toc}
        {paper.lf1.sections.map((sec, i) => (
          <View key={i} onLayout={(e) => (sectionY.current[i] = e.nativeEvent.layout.y)} style={{ marginBottom: t.space(10) }}>
            <View style={[s.rowBetween, { marginBottom: t.space(2) }]}>
              <Label color={t.c.textFaint}>{paper.lf1.theme}</Label>
              <Pressable onPress={() => passageRef.current?.scrollTo({ y: 0, animated: true })} accessibilityRole="link">
                <Label color={t.c.accent}>↑ Indhold</Label>
              </Pressable>
            </View>
            <PassageTitle>{sec.title}</PassageTitle>
            <PassageBlocks blocks={sec.blocks} />
          </View>
        ))}
      </>
    );
    const groups: { section: string; qs: typeof paper.lf1.questions }[] = [];
    for (const q of paper.lf1.questions) {
      const last = groups[groups.length - 1];
      if (last && last.section === q.section) last.qs.push(q);
      else groups.push({ section: q.section, qs: [q] });
    }
    const qs = (
      <>
        <Instruction>
          Søg informationer i tekstsamlingen. Brug indholdsfortegnelsen. Svar præcist og kort på spørgsmålene.
        </Instruction>
        {groups.map((g) => (
          <View key={g.section} style={{ marginBottom: t.space(2) }}>
            <Label color={t.c.textMuted}>{`Søg informationer under ${g.section}`}</Label>
            <View style={{ height: t.space(2) }} />
            {g.qs.map((q) =>
              track(
                `q${q.n}`,
                <Lf1Item q={q} value={answer(`q${q.n}`)} onChange={set(`q${q.n}`)} {...practiceProps(`q${q.n}`)} />,
              ),
            )}
          </View>
        ))}
      </>
    );
    return { passage: p, questions: qs };
  }

  function lf2Panes(task: Lf2Task, ti: number) {
    if (task.kind === 'mc') {
      const p = task.passages.map((ps, i) => (
        <View key={i} style={{ marginBottom: t.space(8) }}>
          {task.passages.length > 1 ? <Label color={t.c.textFaint}>{`Tekst ${i + 1}`}</Label> : null}
          <PassageTitle>{ps.title}</PassageTitle>
          <PassageBlocks blocks={ps.blocks} />
        </View>
      ));
      const qs = (
        <>
          <Instruction>
            {`Læs teksten. Til hvert spørgsmål er der ${task.questions[0]?.options.length === 4 ? 'fire' : 'tre'} svarmuligheder. Vælg det rigtige svar. ${task.points} point for hvert rigtigt svar.`}
          </Instruction>
          {task.questions.map((q, i) => {
            const id = lf2ItemId(ti, i + 1);
            return track(
              id,
              <ChoiceItem
                number={i + 1}
                prompt={task.passages.length > 1 && q.passage !== undefined ? `(Tekst ${q.passage + 1}) ${q.prompt}` : q.prompt}
                options={q.options}
                value={answer(id)}
                onSelect={set(id)}
                correct={q.correct}
                alsoCorrect={q.alsoCorrect}
                {...practiceProps(id)}
              />,
            );
          })}
        </>
      );
      return { passage: p, questions: qs };
    }

    if (task.kind === 'insert') return insertPanes(task, ti);

    // Cloze: the gaps sit in the text and show what has been chosen.
    const gapLabel = (n: number) => {
      if (n === 0 && task.example) {
        const word = task.example.options[task.example.correct.charCodeAt(0) - 65];
        return <GapChip n={0} text={word} filled example />;
      }
      const id = lf2ItemId(ti, n);
      const v = answer(id);
      const word = v ? task.gaps[n - 1]?.options[v.charCodeAt(0) - 65] : undefined;
      return <GapChip n={n} text={word} filled={!!v} focused={focusItem === id} onPress={() => goToItem(id)} />;
    };
    const p = (
      <>
        <PassageTitle>{task.passage.title}</PassageTitle>
        <PassageBlocks blocks={task.passage.blocks} renderGap={gapLabel} />
      </>
    );
    const qs = (
      <>
        <Instruction>
          {`Der er fjernet ${task.gaps.length} ord eller udtryk fra teksten. Vælg det, der passer i hvert hul. Tryk på et hul i teksten for at gå til det. ${task.points} point for hvert rigtigt svar.`}
        </Instruction>
        {task.gaps.map((g, i) => {
          const id = lf2ItemId(ti, i + 1);
          return track(
            id,
            <ChoiceItem
              number={i + 1}
              options={g.options}
              value={answer(id)}
              onSelect={set(id)}
              correct={g.correct}
              alsoCorrect={g.alsoCorrect}
              inline
              highlight={focusItem === id}
              {...practiceProps(id)}
            />,
          );
        })}
      </>
    );
    return { passage: p, questions: qs };
  }

  function insertPanes(task: InsertTask, ti: number) {
    const placed = task.correct.map((_, i) => answer(lf2ItemId(ti, i + 1)));
    const p = (
      <>
        <PassageTitle>{task.passage.title}</PassageTitle>
        <PassageBlocks
          blocks={task.passage.blocks}
          renderBlockGap={(n) => {
            const id = lf2ItemId(ti, n);
            const letter = answer(id);
            const text = task.inserts.find((x) => x.letter === letter)?.text;
            return (
              <Pressable
                onPress={() => goToItem(id)}
                accessibilityRole="button"
                accessibilityLabel={`Hul ${n}${letter ? `, tekstdel ${letter}` : ', tomt'}`}
                style={{
                  borderWidth: 1.5,
                  borderStyle: letter ? 'solid' : 'dashed',
                  borderColor: focusItem === id ? t.c.accent : letter ? t.c.borderStrong : t.c.textFaint,
                  borderRadius: t.radius.md,
                  padding: t.space(3),
                  backgroundColor: letter ? t.c.surface : 'transparent',
                }}
              >
                <Label color={t.c.accent}>{letter ? `${n}  ·  ${letter}` : `${n}`}</Label>
                {text ? (
                  <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 16, lineHeight: 26, marginTop: 2 }}>
                    {text}
                  </Txt>
                ) : (
                  <Txt variant="body" color={t.c.textFaint} style={{ fontSize: 15 }}>
                    Tryk for at vælge en tekstdel
                  </Txt>
                )}
              </Pressable>
            );
          }}
        />
      </>
    );
    const letters = task.inserts.map((x) => x.letter);
    const qs = (
      <>
        <Instruction>
          {`I teksten er der fjernet ${task.correct.length} tekstdele. Her er de ${task.correct.length} tekstdele samt ${task.inserts.length - task.correct.length} ekstra, der ikke passer. Vælg et bogstav til hvert hul. Hvert bogstav må kun bruges én gang. ${task.points} point for hvert rigtigt svar.`}
        </Instruction>
        <View style={{ gap: t.space(2), marginBottom: t.space(5) }}>
          {task.inserts.map((ins) => {
            const at = placed.indexOf(ins.letter);
            return (
              <View
                key={ins.letter}
                style={{
                  flexDirection: 'row',
                  gap: t.space(3),
                  padding: t.space(3),
                  borderRadius: t.radius.md,
                  backgroundColor: t.c.surface,
                  borderWidth: 1,
                  borderColor: t.c.border,
                  opacity: at >= 0 ? 0.55 : 1,
                }}
              >
                <Txt variant="heading">{ins.letter}</Txt>
                <Txt variant="body" style={{ flex: 1, fontSize: 15, lineHeight: 22 }}>
                  {ins.text}
                </Txt>
                {at >= 0 ? <Label color={t.c.textFaint}>{`hul ${at + 1}`}</Label> : null}
              </View>
            );
          })}
        </View>
        {task.correct.map((c, i) => {
          const id = lf2ItemId(ti, i + 1);
          const used = new Set(placed.filter((l, j) => l && j !== i));
          return track(
            id,
            <InsertPicker
              gap={i + 1}
              letters={letters}
              value={answer(id)}
              usedElsewhere={used}
              onSelect={set(id)}
              correct={c}
              highlight={focusItem === id}
              {...practiceProps(id)}
            />,
          );
        })}
      </>
    );
    return { passage: p, questions: qs };
  }

  return (
    <ReadingLayout
      top={top}
      passage={passage}
      questions={questions}
      passageRef={passageRef}
      questionsRef={questionsRef}
      pane={pane}
      onPaneChange={setPane}
      questionsBadge={`${answered}/${ids.length}`}
      cover={paused && remaining !== null ? <PausedPanel remaining={remaining} onResume={() => resumeDraft(paper.id, part)} /> : undefined}
    />
  );
}

/** What stands in for the paper while the clock is stopped. */
function PausedPanel({ remaining, onResume }: { remaining: number; onResume: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: t.space(6) }}>
      <Card tone="sunken" style={{ width: '100%', maxWidth: 440, padding: t.space(6), gap: t.space(3) }}>
        <Txt variant="title">{`Paused — the clock is stopped at ${formatClock(remaining)}`}</Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ lineHeight: 22 }}>
          The paper is hidden while the clock is stopped, so a break doesn’t become extra reading time. Your answers are
          saved, and it stays paused if you leave — pick up where you were whenever you’re ready.
        </Txt>
        <Button label="Resume" onPress={onResume} style={{ marginTop: t.space(2) }} />
      </Card>
    </View>
  );
}

function Instruction({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 15, lineHeight: 22, marginBottom: t.space(4) }}>
      {children}
    </Txt>
  );
}

/** A numbered hole in a cloze text, showing the word chosen for it. */
function GapChip({
  n,
  text,
  filled,
  focused,
  example,
  onPress,
}: {
  n: number;
  text?: string;
  filled: boolean;
  focused?: boolean;
  example?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Text
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={withFont({
        fontWeight: '700',
        color: example ? t.c.textMuted : filled ? t.c.text : t.c.accent,
        backgroundColor: focused ? t.c.accentSoft : filled ? t.c.surfaceSunken : t.c.accentSoft,
        textDecorationLine: filled ? 'none' : 'underline',
      })}
    >
      {` (${n}) ${text ?? '……'} `}
    </Text>
  );
}
