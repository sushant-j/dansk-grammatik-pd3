import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { RULES, type RuleId } from '../../src/grammar/rules';
import { summarize, useProfile } from '../../src/profile/store';
import { useOverview } from '../../src/profile/useOverview';
import { buildStudyPlan } from '../../src/profile/studyplan';
import { computeStreak, useActivity } from '../../src/profile/activity';
import { useSettings } from '../../src/profile/settings';
import { Screen } from '../../src/ui/Screen';
import { ExamCountdown } from '../../src/ui/ExamCountdown';
import { SchemaStrip } from '../../src/ui/SchemaStrip';
import { Button, Card, Label, ListGroup, ListRow, Txt, s } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';

/**
 * Today — one answer to "what do I do now?".
 *
 * The screen is deliberately short: how far away the exam is, the single most
 * useful thing to practise next, and a few other open gaps. Everything else
 * (every trainer, the exam material, the full grammar map) has its own tab,
 * so nothing here competes with the next step.
 */
export default function Today() {
  const router = useRouter();
  const t = useTheme();
  const stats = useProfile((st) => st.stats);
  const targetExam = useSettings((st) => st.targetExam);
  const examDate = useSettings((st) => st.examDate);
  const { domains, overview } = useOverview();

  const summary = useMemo(() => summarize(stats), [stats]);
  const plan = useMemo(() => buildStudyPlan(examDate, overview), [examDate, overview]);
  const activeDays = useActivity((st) => st.activeDays);
  const streak = useMemo(() => computeStreak(activeDays), [activeDays]);

  // The app-wide widest gap drives the headline. When it is in the word-order
  // map we drill to the exact rule (and can draw its slots); when it is in
  // another trainer we hand off to that trainer instead.
  const widest = overview.widestGap;
  const wordOrderGap = summary.openGaps[0] ?? summary.refreshing[0];
  const focus = widest?.key === 'grammar' && wordOrderGap ? wordOrderGap : undefined;
  const alsoOpen = domains.filter((d) => d.attention > 0 && d.key !== widest?.key).slice(0, 3);

  return (
    <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: t.space(10), gap: t.space(6) }}>
      {/* ── Exam distance ──────────────────────────────────────────── */}
      <ExamCountdown plan={plan} examDate={examDate} targetExam={targetExam} />

      {/* ── Next up ────────────────────────────────────────────────── */}
      {focus ? (
        <NextUp
          label={focus.needsRefresh ? 'Next up: refresh this rule' : 'Next up: your widest gap'}
          ruleId={focus.ruleId}
          action="Practise this rule"
          onPress={() => router.push('/train')}
        />
      ) : widest ? (
        <Card style={{ padding: t.space(5) }}>
          <Label color={t.c.accent}>Next up: your widest gap</Label>
          <Txt variant="title" style={{ marginTop: t.space(2) }}>
            {widest.label}
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
            {widest.attention} {widest.attention === 1 ? 'rule is' : 'rules are'} still open here — your
            weakest area across the app right now.
          </Txt>
          <Button
            label={widest.attention === 1 ? 'Review this rule' : 'Review these rules'}
            onPress={() => router.push(widest.route as never)}
            style={{ marginTop: t.space(5) }}
          />
        </Card>
      ) : overview.started ? (
        <Card tone="success" style={{ padding: t.space(5) }}>
          <Label color={t.c.success}>All caught up</Label>
          <Txt variant="title" style={{ marginTop: t.space(2) }}>
            Nothing is open right now
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
            Everything you have practised is solid. Pick a trainer you haven't started yet.
          </Txt>
          <Button label="See all trainers" tone="ghost" onPress={() => router.push('/practise')} style={{ marginTop: t.space(5) }} />
        </Card>
      ) : (
        <NextUp
          label="Start here"
          ruleId="v2-inversion"
          note="Six rules cause almost every word-order mistake at PD3. Everything else hangs off this one."
          action="Start practising"
          onPress={() => router.push('/train')}
        />
      )}

      {/* ── Other open gaps ────────────────────────────────────────── */}
      {alsoOpen.length > 0 ? (
        <ListGroup title="Also open">
          {alsoOpen.map((d) => (
            <ListRow
              key={d.key}
              title={d.label}
              meta={`${d.attention} to review`}
              metaColor={t.c.warning}
              onPress={() => router.push(d.route as never)}
            />
          ))}
        </ListGroup>
      ) : null}

      {/* ── Streak ─────────────────────────────────────────────────── */}
      <ListGroup>
        <ListRow
          title={streak.current > 0 ? `${streak.current}-day streak` : 'No streak yet'}
          detail={
            streak.current === 0
              ? 'Answer one question today to start one.'
              : streak.activeToday
                ? 'You have practised today.'
                : 'Practise anything today to keep it going.'
          }
          meta={overview.started ? `${overview.totalSolid} of ${overview.totalItems} solid` : undefined}
          onPress={() => router.push('/progress')}
        />
      </ListGroup>
    </Screen>
  );
}

function NextUp({
  label,
  ruleId,
  note,
  action,
  onPress,
}: {
  label: string;
  ruleId: RuleId;
  note?: string;
  action: string;
  onPress: () => void;
}) {
  const t = useTheme();
  const router = useRouter();
  const r = RULES[ruleId];
  return (
    <Card style={{ padding: t.space(5) }}>
      <Label color={t.c.accent}>{label}</Label>
      <View style={{ marginTop: t.space(4) }}>
        <SchemaStrip fields={r.fields} />
      </View>
      <Txt variant="title" style={{ marginTop: t.space(4) }}>
        {r.da}
      </Txt>
      <Txt variant="body" color={t.c.textMuted} style={{ fontStyle: 'italic', marginTop: 2 }}>
        {r.en}
      </Txt>
      <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2) }}>
        {note ?? r.statement}
      </Txt>
      {/* Side by side when there is room; stacked on narrow phones. */}
      <View style={[s.wrap, { gap: t.space(2), marginTop: t.space(5) }]}>
        <Button label={action} onPress={onPress} style={{ flexGrow: 1, minWidth: 190 }} />
        <Button
          label="Read the rule"
          tone="ghost"
          onPress={() => router.push(`/rule/${ruleId}` as never)}
          style={{ flexGrow: 1 }}
        />
      </View>
    </Card>
  );
}
