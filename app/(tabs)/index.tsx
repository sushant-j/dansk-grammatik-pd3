import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { WORLDS, worldTitle, type PathUnit, type PathWorld } from '../../src/path/curriculum';
import type { PathState } from '../../src/path/progress';
import { usePathState } from '../../src/path/store';
import { Screen } from '../../src/ui/Screen';
import {
  CrackChip,
  NodeDot,
  Stars,
  checkpointDot,
  lessonCaption,
  lessonDot,
} from '../../src/ui/PathParts';
import { Card, Label, StrengthBar, Txt, s } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';

/**
 * Path — every grammar rule in the app, in the order to learn it.
 *
 * The header says where the learner stands (their niveau on the path, lessons
 * passed, stars); below it each niveau is a world of themed units, and each
 * unit a line of lessons ending in a checkpoint. Every row opens the lesson
 * sheet — locked ones too, so a learner can always see what a lesson needs
 * and read its rule.
 */
export default function PathScreen() {
  const t = useTheme();
  const router = useRouter();
  const state = usePathState();

  // The current world starts open; the rest start folded. Within the current
  // world, finished units start folded so the open work is what shows.
  const [openWorlds, setOpenWorlds] = useState<Record<number, boolean>>({});
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const worldOpen = (w: PathWorld) => openWorlds[w.index] ?? w.index === state.currentWorld;
  const unitOpen = (u: PathUnit) => openUnits[u.id] ?? (u.worldIndex === state.currentWorld && !state.units[u.id].complete);

  const current = WORLDS[state.currentWorld];
  const cw = state.worlds[state.currentWorld];

  return (
    <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: t.space(10), gap: t.space(4) }}>
      {/* ── Where you stand ─────────────────────────────────────────── */}
      <Card>
        <View style={[s.rowBetween, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Label>On the path</Label>
            <Txt variant="title">{worldTitle(current)}</Txt>
          </View>
          <Pressable
            onPress={() => router.push('/rules' as never)}
            accessibilityRole="link"
            hitSlop={8}
            style={[s.row, { gap: 6, paddingVertical: 4 }]}
          >
            <Ionicons name="book-outline" size={18} color={t.c.accent} />
            <Txt variant="label" color={t.c.accent} style={{ fontSize: 14, fontWeight: '600' }}>
              Rule book
            </Txt>
          </Pressable>
        </View>

        <View style={[s.row, { gap: t.space(6), marginTop: t.space(3) }]}>
          <Stat value={`${state.lessonsDone}`} of={`/ ${state.lessonsTotal}`} label="lessons passed" />
          <Stat value={`${state.stars}`} of={`/ ${state.maxStars}`} label="stars" star />
          {state.cracked ? <Stat value={`${state.cracked}`} label="to repair" accent /> : null}
        </View>

        <View style={{ marginTop: t.space(3), gap: t.space(1.5) }}>
          <StrengthBar value={cw.lessonsTotal ? cw.lessonsDone / cw.lessonsTotal : 0} color={t.c.success} />
          <Txt variant="label" color={t.c.textMuted}>
            Niveau {state.currentWorld + 1}: {cw.lessonsDone} of {cw.lessonsTotal} lessons · {cw.checkpointsDone} of{' '}
            {cw.checkpointsTotal} checkpoints
          </Txt>
        </View>
      </Card>

      {/* ── Worlds ──────────────────────────────────────────────────── */}
      {WORLDS.map((w) => (
        <WorldSection
          key={w.index}
          world={w}
          state={state}
          open={worldOpen(w)}
          onToggle={() => setOpenWorlds((o) => ({ ...o, [w.index]: !worldOpen(w) }))}
          unitOpen={unitOpen}
          onToggleUnit={(u) => setOpenUnits((o) => ({ ...o, [u.id]: !unitOpen(u) }))}
        />
      ))}
    </Screen>
  );
}

function Stat({ value, of, label, star, accent }: { value: string; of?: string; label: string; star?: boolean; accent?: boolean }) {
  const t = useTheme();
  return (
    <View>
      <View style={[s.row, { gap: 4, alignItems: 'baseline' }]}>
        {star ? <Ionicons name="star" size={16} color={t.c.warning} /> : null}
        <Txt variant="title" color={accent ? t.c.accent : t.c.text} style={{ fontSize: 20 }}>
          {value}
        </Txt>
        {of ? (
          <Txt variant="label" color={t.c.textFaint} style={{ fontSize: 14 }}>
            {of}
          </Txt>
        ) : null}
      </View>
      <Txt variant="label" color={t.c.textMuted}>
        {label}
      </Txt>
    </View>
  );
}

function WorldSection({
  world,
  state,
  open,
  onToggle,
  unitOpen,
  onToggleUnit,
}: {
  world: PathWorld;
  state: PathState;
  open: boolean;
  onToggle: () => void;
  unitOpen: (u: PathUnit) => boolean;
  onToggleUnit: (u: PathUnit) => void;
}) {
  const t = useTheme();
  const ws = state.worlds[world.index];
  const locked = !ws.open;
  const meta = locked
    ? `${world.cefr} · locked`
    : ws.complete
      ? `${world.cefr} · all checkpoints passed`
      : `${world.cefr} · ${ws.lessonsDone}/${ws.lessonsTotal} lessons · ${ws.checkpointsDone}/${ws.checkpointsTotal} checkpoints`;
  const badgeBg = ws.complete ? t.c.successSoft : locked ? t.c.surfaceSunken : t.c.accent;
  const badgeInk = ws.complete ? t.c.success : locked ? t.c.textFaint : t.c.surface;
  const prev = world.index > 0 ? state.worlds[world.index - 1] : null;

  return (
    <View
      style={{
        backgroundColor: t.c.surface,
        borderWidth: 1,
        borderColor: t.c.border,
        borderRadius: t.radius.lg,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={locked ? undefined : onToggle}
        disabled={locked}
        accessibilityRole="button"
        accessibilityState={{ expanded: open && !locked, disabled: locked }}
        style={[s.row, { gap: t.space(3), padding: t.space(4) }]}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: t.radius.md,
            backgroundColor: badgeBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="heading" color={badgeInk} style={{ fontWeight: '800' }}>
            {world.index + 1}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{worldTitle(world)}</Txt>
          <Txt variant="label" color={t.c.textMuted}>
            {meta}
          </Txt>
        </View>
        <Ionicons
          name={locked ? 'lock-closed' : open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={locked ? t.c.textFaint : t.c.textMuted}
        />
      </Pressable>

      {locked && prev ? (
        <Txt variant="label" color={t.c.textMuted} style={{ paddingHorizontal: t.space(4), paddingBottom: t.space(4), marginLeft: 52 }}>
          Opens when all {prev.checkpointsTotal} Niveau {world.index} checkpoints are passed or tested out (
          {prev.checkpointsDone} of {prev.checkpointsTotal} so far).
        </Txt>
      ) : null}

      {open && !locked ? (
        <View style={{ borderTopWidth: 1, borderTopColor: t.c.border }}>
          {world.units.map((u) => (
            <UnitSection key={u.id} unit={u} state={state} open={unitOpen(u)} onToggle={() => onToggleUnit(u)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function UnitSection({ unit, state, open, onToggle }: { unit: PathUnit; state: PathState; open: boolean; onToggle: () => void }) {
  const t = useTheme();
  const router = useRouter();
  const us = state.units[unit.id];
  const cp = state.checkpoints[unit.checkpointId];

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: t.c.surfaceSunken }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[s.row, { gap: t.space(2.5), paddingHorizontal: t.space(4), paddingVertical: t.space(3), minHeight: 48 }]}
      >
        <Txt
          variant="label"
          color={t.c.textMuted}
          style={{ flex: 1, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}
        >
          {unit.name}
        </Txt>
        {us.testedOut ? (
          <View style={{ backgroundColor: t.c.successSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Txt variant="label" color={t.c.success} style={{ fontSize: 12, fontWeight: '600' }}>
              Tested out
            </Txt>
          </View>
        ) : null}
        <Txt variant="label" color={t.c.textMuted}>
          {us.done}/{unit.lessons.length}
        </Txt>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.c.textMuted} />
      </Pressable>

      {open ? (
        <View style={{ paddingBottom: t.space(2) }}>
          {unit.lessons.map((l) => {
            const ls = state.lessons[l.id];
            const isNext = state.nextLessonId === l.id;
            const caption = lessonCaption(ls);
            const done = ls.status === 'passed' || ls.status === 'testedOut';
            return (
              <NodeRow
                key={l.id}
                dot={<NodeDot kind={lessonDot(ls, isNext)} cracked={ls.cracked} />}
                title={l.rule.da}
                caption={isNext ? `Next up · ${caption.text}` : caption.text}
                captionTone={isNext ? 'accent' : caption.tone}
                highlight={isNext}
                dimmed={ls.status === 'locked'}
                onPress={() => router.push(`/path/${l.id}` as never)}
                end={
                  ls.cracked ? (
                    <CrackChip />
                  ) : done ? (
                    <Stars count={ls.stars} />
                  ) : ls.status === 'available' ? (
                    <Txt variant="label" color={t.c.accent} style={{ fontWeight: '700' }}>
                      Start ›
                    </Txt>
                  ) : null
                }
                line
              />
            );
          })}
          <NodeRow
            dot={<NodeDot kind={checkpointDot(cp)} />}
            title={`Checkpoint · ${unit.name}`}
            caption={
              cp.status === 'passed'
                ? `Passed · best ${cp.best?.best ?? 0}/${cp.best?.total ?? 0}`
                : cp.ready
                  ? 'All lessons done – take the final check'
                  : 'After the lessons – or test out now'
            }
            captionTone={cp.status === 'passed' ? 'muted' : cp.ready ? 'accent' : 'muted'}
            dimmed={cp.status === 'locked'}
            onPress={() => router.push(`/path/${unit.checkpointId}` as never)}
            end={
              cp.status === 'available' ? (
                <Txt variant="label" color={t.c.accent} style={{ fontWeight: '600' }}>
                  {cp.ready ? 'Start ›' : 'Test out ›'}
                </Txt>
              ) : null
            }
          />
        </View>
      ) : null}
    </View>
  );
}

function NodeRow({
  dot,
  title,
  caption,
  captionTone,
  end,
  onPress,
  line = false,
  highlight = false,
  dimmed = false,
}: {
  dot: React.ReactNode;
  title: string;
  caption: string;
  captionTone: 'muted' | 'accent' | 'faint';
  end?: React.ReactNode;
  onPress: () => void;
  /** Draw the connector down to the next node. */
  line?: boolean;
  highlight?: boolean;
  dimmed?: boolean;
}) {
  const t = useTheme();
  const captionColor = captionTone === 'accent' ? t.c.accent : captionTone === 'faint' ? t.c.textFaint : t.c.textMuted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${caption}`}
      style={({ pressed }) => [
        { flexDirection: 'row', gap: t.space(3), paddingHorizontal: t.space(4), minHeight: 60 },
        highlight && { backgroundColor: t.c.accentSoft },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={{ width: 36, alignItems: 'center' }}>
        <View style={{ marginTop: 10 }}>{dot}</View>
        {line ? <View style={{ width: 2, flex: 1, minHeight: 10, backgroundColor: t.c.border }} /> : null}
      </View>
      <View style={{ flex: 1, paddingVertical: t.space(3), gap: 2 }}>
        <Txt variant="body" color={dimmed ? t.c.textMuted : t.c.text} style={{ fontWeight: '600', lineHeight: 21 }}>
          {title}
        </Txt>
        <Txt variant="label" color={captionColor} style={captionTone === 'accent' ? { fontWeight: '600' } : undefined}>
          {caption}
        </Txt>
      </View>
      {end ? <View style={{ justifyContent: 'center' }}>{end}</View> : null}
    </Pressable>
  );
}
