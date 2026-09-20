import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../src/ui/Screen';
import { Card, Label, StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';
import { crossDomainReview, summarizeOverview, type DomainReview } from '../src/profile/overview';
import { computeStreak, useActivity } from '../src/profile/activity';
import { useProfile } from '../src/profile/store';
import { useVocabProfile } from '../src/profile/vocabStore';
import { useNounProfile } from '../src/profile/nounStore';
import { useAdjectiveProfile } from '../src/profile/adjectiveStore';
import { useVerbProfile } from '../src/profile/verbStore';
import { useCommaProfile } from '../src/profile/commaStore';
import { useSpellingProfile } from '../src/profile/spellingStore';

/**
 * The progress page — overall mastery, the daily streak, and per-trainer
 * progress, all read from the same per-item stores everything else uses (so
 * it is always in sync) plus the activity store for the streak. Everything
 * here already persists in the browser via each store's AsyncStorage.
 */
export default function Progress() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const grammar = useProfile((st) => st.stats);
  const vocab = useVocabProfile((st) => st.stats);
  const nouns = useNounProfile((st) => st.stats);
  const adjectives = useAdjectiveProfile((st) => st.stats);
  const verbs = useVerbProfile((st) => st.stats);
  const comma = useCommaProfile((st) => st.stats);
  const spelling = useSpellingProfile((st) => st.stats);
  const activeDays = useActivity((st) => st.activeDays);

  const domains = useMemo(
    () => crossDomainReview({ grammar, verbs, nouns, adjectives, comma, spelling, vocab }),
    [grammar, verbs, nouns, adjectives, comma, spelling, vocab],
  );
  const overview = useMemo(() => summarizeOverview(domains), [domains]);
  const streak = useMemo(() => computeStreak(activeDays), [activeDays]);

  const pct = overview.totalItems ? Math.round((overview.totalSolid / overview.totalItems) * 100) : 0;

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      {/* ── Overall ──────────────────────────────────────────────────── */}
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          Your progress
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          Everything is saved on this device, in this browser. Clear your site data and it resets.
        </Txt>
      </View>

      <Card tone="sunken">
        <View style={s.rowBetween}>
          <Label>Overall mastery</Label>
          <Txt variant="label" color={t.c.textMuted}>
            {overview.totalSolid} / {overview.totalItems} solid
          </Txt>
        </View>
        <Txt variant="display" style={{ fontSize: 40, marginTop: t.space(2) }}>
          {pct}%
        </Txt>
        <View style={{ marginTop: t.space(2) }}>
          <StrengthBar value={overview.totalItems ? overview.totalSolid / overview.totalItems : 0} color={t.c.success} />
        </View>
        <View style={[s.row, { gap: t.space(4), marginTop: t.space(3) }]}>
          <Stat label="Open gaps" value={overview.totalAttention} color={t.c.accent} t={t} />
          <Stat label="Not started" value={overview.totalUnseen} color={t.c.textFaint} t={t} />
          <Stat label="Solid" value={overview.totalSolid} color={t.c.success} t={t} />
        </View>
      </Card>

      {/* ── Streak ───────────────────────────────────────────────────── */}
      <Card tone={streak.current > 0 ? 'accent' : 'surface'}>
        <Label color={streak.current > 0 ? t.c.accent : t.c.textFaint}>Daily streak</Label>
        <View style={[s.row, { alignItems: 'flex-end', gap: t.space(2), marginTop: t.space(2) }]}>
          <Txt variant="display" style={{ fontSize: 40 }}>
            {streak.current}
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginBottom: t.space(2) }}>
            {streak.current === 1 ? 'day' : 'days'} in a row
          </Txt>
        </View>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1), lineHeight: 22 }}>
          {streak.current === 0
            ? 'Answer anything today to start a streak.'
            : streak.activeToday
              ? 'Practised today — nice. Come back tomorrow to extend it.'
              : 'Practise anything today to keep the streak alive.'}
        </Txt>
        <View style={[s.row, { gap: t.space(4), marginTop: t.space(3) }]}>
          <Stat label="Longest" value={streak.longest} color={t.c.text} t={t} />
          <Stat label="Days practised" value={streak.totalDays} color={t.c.text} t={t} />
        </View>
      </Card>

      {/* ── Per trainer ──────────────────────────────────────────────── */}
      <View>
        <Label>By trainer</Label>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
          How far each area has come — solid out of total, with any open gaps flagged.
        </Txt>
      </View>

      <View style={{ gap: t.space(2.5) }}>
        {domains.map((d) => (
          <DomainRow key={d.key} d={d} t={t} />
        ))}
      </View>
    </Screen>
  );
}

function Stat({
  label,
  value,
  color,
  t,
}: {
  label: string;
  value: number;
  color: string;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View>
      <Txt variant="title" color={color}>
        {value}
      </Txt>
      <Txt variant="label" color={t.c.textFaint}>
        {label}
      </Txt>
    </View>
  );
}

function DomainRow({ d, t }: { d: DomainReview; t: ReturnType<typeof useTheme> }) {
  const frac = d.total ? d.solid / d.total : 0;
  const color = frac >= 0.7 ? t.c.success : frac >= 0.4 ? t.c.warning : t.c.accent;
  const status = !d.started
    ? 'Not started'
    : d.attention > 0
      ? `${d.attention} to review`
      : 'All solid';
  return (
    <Card style={{ padding: t.space(3.5) }}>
      <View style={s.rowBetween}>
        <Txt variant="heading" numberOfLines={1} style={{ flex: 1, paddingRight: t.space(3) }}>
          {d.label}
        </Txt>
        <Txt variant="label" color={d.started && d.attention === 0 ? t.c.success : t.c.textMuted}>
          {status}
        </Txt>
      </View>
      <View style={[s.rowBetween, { marginTop: t.space(2.5), gap: t.space(3) }]}>
        <View style={{ flex: 1 }}>
          <StrengthBar value={frac} color={color} />
        </View>
        <Txt variant="body" color={t.c.textFaint} style={{ fontSize: 12 }}>
          {d.solid}/{d.total}
        </Txt>
      </View>
    </Card>
  );
}
