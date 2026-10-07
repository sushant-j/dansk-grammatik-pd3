import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WORLDS, lessonById, unitById, unitForCheckpoint, worldTitle, type PathLesson, type PathUnit } from '../../src/path/curriculum';
import type { PathState } from '../../src/path/progress';
import {
  CHECKPOINT_PASS_SHARE,
  CHECKPOINT_SIZE,
  LESSON_PASS_SHARE,
  LESSON_SIZE,
  REPAIR_SIZE,
  passMark,
  reviewSources,
} from '../../src/path/session';
import { usePathState } from '../../src/path/store';
import { NodeDot, Stars, lessonCaption, lessonDot } from '../../src/ui/PathParts';
import { Screen } from '../../src/ui/Screen';
import { Button, Card, Label, Txt, s } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';

/**
 * The lesson sheet: what a lesson (or checkpoint) covers, what it builds on,
 * how it is passed, and the button that starts it.
 *
 * Reachable for locked nodes too — the rule is never hidden, only the scored
 * session is — so "Needs: …" always comes with a way to read ahead.
 */
export default function LessonSheet() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const t = useTheme();
  const router = useRouter();
  const state = usePathState();

  const lesson = lessonById(nodeId);
  const cpUnit = unitForCheckpoint(nodeId);
  if (lesson) return <LessonView lesson={lesson} state={state} />;
  if (cpUnit) return <CheckpointView unit={cpUnit} state={state} />;
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, padding: t.space(4), gap: t.space(3) }}>
      <Txt variant="title">Unknown lesson</Txt>
      <Button tone="ghost" label="Back to the path" onPress={() => router.back()} />
    </View>
  );
}

function SheetScreen({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <>
      <Stack.Screen options={{ title }} />
      <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: insets.bottom + t.space(8), gap: t.space(4) }}>
        {children}
      </Screen>
    </>
  );
}

function Facts({ items }: { items: [string, string][] }) {
  const t = useTheme();
  return (
    <View style={[s.row, { gap: t.space(2) }]}>
      {items.map(([k, v]) => (
        <View
          key={k}
          style={{ flex: 1, backgroundColor: t.c.surfaceSunken, borderRadius: t.radius.md, padding: t.space(3), gap: 2 }}
        >
          <Txt variant="label" color={t.c.textMuted}>
            {k}
          </Txt>
          <Txt variant="heading">{v}</Txt>
        </View>
      ))}
    </View>
  );
}

function LessonView({ lesson, state }: { lesson: PathLesson; state: PathState }) {
  const t = useTheme();
  const router = useRouter();
  const ls = state.lessons[lesson.id];
  const unit = unitById(lesson.unitId)!;
  const position = unit.lessons.findIndex((l) => l.id === lesson.id) + 1;
  const rule = lesson.rule;
  const example = rule.examples.find((e) => e.wrong) ?? rule.examples[0];
  const builds = reviewSources(lesson);
  const locked = ls.status === 'locked';
  const caption = lessonCaption(ls);

  return (
    <SheetScreen title={rule.da}>
      <Txt variant="label" color={t.c.textMuted}>
        {worldTitle(WORLDS[lesson.worldIndex])} · {unit.name} · lesson {position} of {unit.lessons.length}
      </Txt>

      <View style={{ gap: t.space(1) }}>
        <Txt variant="display" style={{ fontSize: 28, lineHeight: 32 }}>
          {rule.da}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ fontStyle: 'italic' }}>
          {rule.en}
        </Txt>
      </View>

      <Card>
        <Txt variant="heading" style={{ lineHeight: 24 }}>
          {rule.statement}
        </Txt>
        {example ? (
          <View style={{ marginTop: t.space(3), gap: t.space(1.5) }}>
            {example.wrong ? (
              <Txt variant="body" color={t.c.textMuted} style={{ textDecorationLine: 'line-through' }}>
                ✕ {example.wrong}
              </Txt>
            ) : null}
            <Txt variant="body" style={{ fontWeight: '600' }}>
              ✓ {example.right}
            </Txt>
            <Txt variant="label" color={t.c.textMuted}>
              {example.note}
            </Txt>
          </View>
        ) : null}
      </Card>

      {builds.length ? (
        <View style={{ gap: t.space(2) }}>
          <Label>{lesson.requires.length ? 'Builds on' : 'Reviews'}</Label>
          {builds.map((id) => {
            const other = lessonById(id)!;
            const os = state.lessons[id];
            return (
              <Card key={id} style={{ paddingVertical: t.space(3) }}>
                <View style={[s.row, { gap: t.space(3) }]}>
                  <NodeDot kind={lessonDot(os, false)} size={28} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="body" style={{ fontWeight: '600' }}>
                      {other.rule.da}
                    </Txt>
                    <Txt variant="label" color={t.c.textMuted}>
                      {builds.length === 1 ? `2 of the ${LESSON_SIZE} questions review this` : 'Reviewed in this lesson'}
                    </Txt>
                  </View>
                  {os.stars ? <Stars count={os.stars} size={13} /> : null}
                </View>
              </Card>
            );
          })}
        </View>
      ) : null}

      <Facts
        items={[
          ['Questions', `${LESSON_SIZE}`],
          ['To pass', `${passMark(LESSON_SIZE, LESSON_PASS_SHARE)} right`],
          ['Your best', ls.best ? `${ls.best.best}/${ls.best.total}` : '–'],
        ]}
      />
      <Txt variant="label" color={t.c.textMuted}>
        6/8 = 1 star · 7/8 = 2 stars · 8/8 = 3 stars. Playing again can only add stars.
      </Txt>

      {locked ? (
        <Card tone="sunken">
          <Label>Locked</Label>
          <Txt variant="body" style={{ marginTop: t.space(1.5) }}>
            {caption.text}
          </Txt>
        </Card>
      ) : null}

      <View style={{ gap: t.space(2) }}>
        {ls.cracked ? (
          <Button
            label={`Repair · ${REPAIR_SIZE} questions`}
            onPress={() => router.push(`/path/run/${lesson.id}?mode=repair` as never)}
          />
        ) : null}
        {!locked ? (
          <Button
            tone={ls.cracked ? 'ghost' : 'primary'}
            label={ls.status === 'available' ? `Start lesson · ${LESSON_SIZE} questions` : ls.stars < 3 ? 'Play again for more stars' : 'Play again'}
            onPress={() => router.push(`/path/run/${lesson.id}?mode=lesson` as never)}
          />
        ) : null}
        <Button tone="ghost" label="Read the full rule card" onPress={() => router.push(`/rule/${lesson.id}` as never)} />
      </View>
    </SheetScreen>
  );
}

function CheckpointView({ unit, state }: { unit: PathUnit; state: PathState }) {
  const t = useTheme();
  const router = useRouter();
  const cp = state.checkpoints[unit.checkpointId];
  const us = state.units[unit.id];
  const locked = cp.status === 'locked';
  const testOut = cp.status === 'available' && !cp.ready;

  return (
    <SheetScreen title={`Checkpoint · ${unit.name}`}>
      <Txt variant="label" color={t.c.textMuted}>
        {worldTitle(WORLDS[unit.worldIndex])} · {unit.name}
      </Txt>
      <View style={{ gap: t.space(1) }}>
        <Txt variant="display" style={{ fontSize: 28, lineHeight: 32 }}>
          {testOut ? 'Test out' : 'Checkpoint'}
        </Txt>
        <Txt variant="body" color={t.c.textMuted}>
          {cp.status === 'passed'
            ? us.testedOut
              ? 'You tested out of this unit. Its lessons count as done; play any of them for more stars.'
              : 'Passed. The unit is done.'
            : testOut
              ? `Already know this unit? Pass ${passMark(CHECKPOINT_SIZE, CHECKPOINT_PASS_SHARE)} of ${CHECKPOINT_SIZE} and every lesson in it counts as done.`
              : `${CHECKPOINT_SIZE} questions mixed from every rule in the unit. Pass it to finish the unit.`}
        </Txt>
      </View>

      <Card>
        <Label>Covers</Label>
        <View style={{ marginTop: t.space(2), gap: t.space(2) }}>
          {unit.lessons.map((l) => (
            <View key={l.id} style={[s.row, { gap: t.space(2.5) }]}>
              <NodeDot kind={lessonDot(state.lessons[l.id], false)} size={22} />
              <Txt variant="body" style={{ flex: 1 }}>
                {l.rule.da}
              </Txt>
            </View>
          ))}
        </View>
      </Card>

      <Facts
        items={[
          ['Questions', `${CHECKPOINT_SIZE}`],
          ['To pass', `${passMark(CHECKPOINT_SIZE, CHECKPOINT_PASS_SHARE)} right`],
          ['Your best', cp.best ? `${cp.best.best}/${cp.best.total}` : '–'],
        ]}
      />

      {locked ? (
        <Card tone="sunken">
          <Label>Locked</Label>
          <Txt variant="body" style={{ marginTop: t.space(1.5) }}>
            Opens with Niveau {unit.worldIndex + 1}.
          </Txt>
        </Card>
      ) : (
        <Button
          label={cp.status === 'passed' ? 'Take it again' : testOut ? `Test out · ${CHECKPOINT_SIZE} questions` : `Start checkpoint · ${CHECKPOINT_SIZE} questions`}
          tone={cp.status === 'passed' ? 'ghost' : 'primary'}
          onPress={() => router.push(`/path/run/${unit.checkpointId}?mode=checkpoint` as never)}
        />
      )}
    </SheetScreen>
  );
}
