import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { View } from 'react-native';
import { lessonById } from '../path/curriculum';
import type { CheckpointState, LessonState } from '../path/progress';
import { LESSON_SIZE } from '../path/session';
import { Txt } from './primitives';
import { useTheme } from './theme';

/**
 * The small pieces every path screen shares: a node's dot, its stars, and the
 * one-line caption that says where it stands.
 *
 * Colour follows the app's rule that red marks the one thing to do next:
 * an open lesson gets a red ring, passed is green, locked is grey, and stars
 * use the warning hue so they never compete with the next step.
 */

export type DotKind = 'passed' | 'testedOut' | 'next' | 'available' | 'locked' | 'checkpoint' | 'checkpointPassed';

export function NodeDot({ kind, cracked = false, size = 36 }: { kind: DotKind; cracked?: boolean; size?: number }) {
  const t = useTheme();
  const icon = Math.round(size * 0.5);
  const base = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  switch (kind) {
    case 'passed':
    case 'checkpointPassed':
      return (
        <View
          style={[
            base,
            { backgroundColor: t.c.success },
            cracked && { borderWidth: 3, borderColor: t.c.accentSoft },
          ]}
        >
          <Ionicons name={kind === 'checkpointPassed' ? 'flag' : 'checkmark'} size={icon} color={t.c.surface} />
        </View>
      );
    case 'testedOut':
      return (
        <View style={[base, { borderWidth: 2, borderColor: t.c.success, backgroundColor: t.c.surface }]}>
          <Ionicons name="checkmark" size={icon} color={t.c.success} />
        </View>
      );
    case 'next':
      return (
        <View style={[base, { borderWidth: 3, borderColor: t.c.accent, backgroundColor: t.c.surface }]}>
          <View style={{ width: size / 3, height: size / 3, borderRadius: size / 6, backgroundColor: t.c.accent }} />
        </View>
      );
    case 'available':
      return <View style={[base, { borderWidth: 2, borderColor: t.c.accent, backgroundColor: t.c.surface }]} />;
    case 'checkpoint':
      return (
        <View style={[base, { borderWidth: 2, borderStyle: 'dashed', borderColor: t.c.borderStrong, backgroundColor: t.c.surface }]}>
          <Ionicons name="flag-outline" size={icon} color={t.c.textMuted} />
        </View>
      );
    case 'locked':
    default:
      return (
        <View style={[base, { backgroundColor: t.c.surfaceSunken }]}>
          <Ionicons name="lock-closed" size={Math.round(icon * 0.85)} color={t.c.textFaint} />
        </View>
      );
  }
}

export function Stars({ count, size = 15 }: { count: number; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 1 }} accessibilityLabel={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Ionicons key={i} name="star" size={size} color={i < count ? t.c.warning : t.c.border} />
      ))}
    </View>
  );
}

export function lessonDot(s: LessonState, isNext: boolean): DotKind {
  if (s.status === 'passed') return 'passed';
  if (s.status === 'testedOut') return 'testedOut';
  if (s.status === 'available') return isNext ? 'next' : 'available';
  return 'locked';
}

export function checkpointDot(s: CheckpointState): DotKind {
  if (s.status === 'passed') return 'checkpointPassed';
  if (s.status === 'available') return 'checkpoint';
  return 'locked';
}

/** One line under a lesson's name: what it needs, or how it went. */
export function lessonCaption(s: LessonState): { text: string; tone: 'muted' | 'accent' | 'faint' } {
  if (s.cracked) return { text: 'Faded since you passed it – a quick repair', tone: 'accent' };
  if (s.status === 'passed' && s.best) return { text: `Passed · best ${s.best.best}/${s.best.total}`, tone: 'muted' };
  if (s.status === 'testedOut') return { text: 'Tested out · play it for more stars', tone: 'muted' };
  if (s.status === 'available') return { text: `${LESSON_SIZE} questions`, tone: 'accent' };
  if (s.waitingFor.length) {
    const names = s.waitingFor.map((id) => lessonById(id)?.rule.da ?? id);
    return { text: `Needs: ${names.join(', ')}`, tone: 'faint' };
  }
  return { text: 'Opens with this niveau', tone: 'faint' };
}

export function CrackChip() {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: t.c.accentSoft,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Ionicons name="flash" size={12} color={t.c.accent} />
      <Txt variant="label" color={t.c.accent} style={{ fontSize: 12, fontWeight: '700' }}>
        Repair
      </Txt>
    </View>
  );
}
