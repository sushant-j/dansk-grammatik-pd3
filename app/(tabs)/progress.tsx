import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { RULES } from '../../src/grammar/rules';
import { computeStreak, useActivity } from '../../src/profile/activity';
import { EXAM_LABELS, useSettings } from '../../src/profile/settings';
import { ruleProgress, useProfile, type MasteryLevel, type RuleProgress } from '../../src/profile/store';
import { useOverview } from '../../src/profile/useOverview';
import { levelLabel } from '../../src/profile/mastery';
import { DomainMeter, domainStatus } from '../../src/ui/DomainMeter';
import { Screen } from '../../src/ui/Screen';
import { SchemaStrip } from '../../src/ui/SchemaStrip';
import { Card, ListGroup, ListRow, StrengthBar, Txt, s } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';
import type { Theme } from '../../src/theme';

/**
 * Progress — overall mastery, the daily streak, each trainer, and the full
 * word-order grammar map (moved here from the old home screen so Today can
 * stay about the next step). Everything reads the same per-item stores the
 * trainers write, so it is always in sync.
 */
export default function Progress() {
  const t = useTheme();
  const router = useRouter();
  const { domains, overview } = useOverview();
  const stats = useProfile((st) => st.stats);
  const targetExam = useSettings((st) => st.targetExam);
  const activeDays = useActivity((st) => st.activeDays);
  const streak = useMemo(() => computeStreak(activeDays), [activeDays]);

  const pct = overview.totalItems ? Math.round((overview.totalSolid / overview.totalItems) * 100) : 0;

  // Exam-relevant rules sort first — a bias, not a filter (see settings.ts).
  const map = useMemo(() => {
    const base = ruleProgress(stats);
    if (!targetExam) return base;
    return [...base].sort(
      (a, b) =>
        (RULES[a.ruleId].exams.includes(targetExam) ? 0 : 1) -
        (RULES[b.ruleId].exams.includes(targetExam) ? 0 : 1),
    );
  }, [stats, targetExam]);

  return (
    <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: t.space(10), gap: t.space(6) }}>
      {/* ── Overall + streak ─────────────────────────────────────────── */}
      <View style={[s.row, { gap: t.space(3), alignItems: 'stretch' }]}>
        <Card style={{ flex: 1 }}>
          <Txt variant="label" color={t.c.textMuted}>
            Overall
          </Txt>
          <Txt variant="display" style={{ fontSize: 40, lineHeight: 44, marginTop: t.space(1) }}>
            {pct}%
          </Txt>
          <Txt variant="label" color={t.c.textFaint}>
            {overview.totalSolid} of {overview.totalItems} solid
          </Txt>
        </Card>
        <Card style={{ flex: 1 }}>
          <Txt variant="label" color={t.c.textMuted}>
            Streak
          </Txt>
          <Txt variant="display" style={{ fontSize: 40, lineHeight: 44, marginTop: t.space(1) }}>
            {streak.current}
          </Txt>
          <Txt variant="label" color={t.c.textFaint}>
            {streak.current === 1 ? 'day' : 'days'}, longest {streak.longest}
          </Txt>
        </Card>
      </View>
      <View style={{ gap: t.space(2), marginTop: -t.space(3) }}>
        <StrengthBar value={overview.totalItems ? overview.totalSolid / overview.totalItems : 0} color={t.c.success} />
        <Txt variant="label" color={t.c.textMuted}>
          {overview.totalAttention} open {overview.totalAttention === 1 ? 'gap' : 'gaps'}, {overview.totalUnseen} not
          started.{' '}
          {streak.current === 0
            ? 'Answer anything today to start a streak.'
            : streak.activeToday
              ? 'You have practised today.'
              : 'Practise today to keep your streak.'}
        </Txt>
      </View>

      {/* ── Per trainer ──────────────────────────────────────────────── */}
      <ListGroup title="By trainer">
        {domains.map((d) => {
          const status = domainStatus(d, t);
          return (
            <ListRow
              key={d.key}
              title={d.label}
              meta={status.text}
              metaColor={status.color}
              onPress={() => router.push(d.route as never)}
            >
              <DomainMeter d={d} />
            </ListRow>
          );
        })}
      </ListGroup>

      {/* ── Grammar map ──────────────────────────────────────────────── */}
      <View style={{ gap: t.space(2) }}>
        <ListGroup title={targetExam ? `Word-order rules, ${EXAM_LABELS[targetExam]} first` : 'Word-order rules'}>
          {map.map((p) => (
            <RuleRow key={p.ruleId} p={p} offTarget={!!targetExam && !RULES[p.ruleId].exams.includes(targetExam)} />
          ))}
        </ListGroup>
        <Txt variant="label" color={t.c.textFaint} style={{ paddingHorizontal: t.space(1) }}>
          A rule fills as you get it right in different sentences, and fades if you leave it alone.
        </Txt>
      </View>

      <Txt variant="label" color={t.c.textFaint} style={{ paddingHorizontal: t.space(1) }}>
        Progress is saved on this device. Clearing your browser data resets it.
      </Txt>
    </Screen>
  );
}

function RuleRow({ p, offTarget }: { p: RuleProgress; offTarget: boolean }) {
  const t = useTheme();
  const router = useRouter();
  const r = RULES[p.ruleId];
  const color = levelColor(p.level, t);
  return (
    <ListRow
      title={r.da}
      detail={offTarget ? `${r.en}. Not on your exam.` : r.en}
      meta={p.needsRefresh ? 'Refresh' : levelLabel(p.level)}
      metaColor={color}
      onPress={() => router.push(`/rule/${p.ruleId}` as never)}
    >
      <View style={[s.row, { gap: t.space(3), opacity: offTarget ? 0.6 : 1 }]}>
        <View style={{ width: 84 }}>
          <SchemaStrip fields={r.fields} size="sm" />
        </View>
        <View style={{ flex: 1 }}>
          <StrengthBar value={p.strength} color={color} />
        </View>
      </View>
    </ListRow>
  );
}

function levelColor(level: MasteryLevel, t: Theme): string {
  switch (level) {
    case 'mastered':
    case 'solid':
      return t.c.success;
    case 'developing':
      return t.c.warning;
    case 'shaky':
      return t.c.accent;
    default:
      return t.c.textFaint;
  }
}
