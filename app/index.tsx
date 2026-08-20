import { Link, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../src/ui/Screen';
import { RULES, type RuleId } from '../src/grammar/rules';
import { allYears, TOPICS } from '../src/content/topics';
import { VOCABULARY } from '../src/content/vocabulary';
import {
  ruleProgress,
  summarize,
  useProfile,
  type MasteryLevel,
  type RuleProgress,
} from '../src/profile/store';
import { Button, Card, Divider, Label, StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';

/**
 * Home is the grammar map, not a streak dashboard.
 *
 * The organising promise: you can see exactly which rules you own and which
 * are still open, and the app tells you what to do about it. Nothing here
 * counts consecutive days, and nothing is lost by taking a week off — a decayed
 * rule simply asks for a refresh.
 */
export default function Home() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const stats = useProfile((st) => st.stats);

  const progress = useMemo(() => ruleProgress(stats), [stats]);
  const summary = useMemo(() => summarize(stats), [stats]);
  const started = progress.some((p) => p.attempts > 0);

  const focus = summary.openGaps[0] ?? summary.refreshing[0];

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      {/* ── Orientation ────────────────────────────────────────────── */}
      <View>
        <Txt variant="display">Din grammatik</Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {started
            ? `${summary.solid} of ${summary.total} rules solid. No streaks here — just what you know and what is still open.`
            : 'Danish word order, taught the way Danish schools teach it: with the sætningsskema. Start anywhere.'}
        </Txt>
      </View>

      {/* ── What to do next ────────────────────────────────────────── */}
      <Card tone={focus ? 'accent' : 'surface'}>
        <Label color={focus ? t.c.accent : t.c.textFaint}>
          {focus ? (focus.needsRefresh ? 'Needs a refresh' : 'Your widest gap') : 'Start here'}
        </Label>
        <Txt variant="title" style={{ marginTop: t.space(2) }}>
          {focus ? RULES[focus.ruleId].en : 'The verb sits in slot two'}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
          {focus
            ? RULES[focus.ruleId].statement
            : 'Six rules govern almost every word-order error at PD3 level. This is the one everything else hangs off.'}
        </Txt>
        <Button
          label={focus ? 'Close this gap' : 'Begin training'}
          onPress={() => router.push('/train')}
          style={{ marginTop: t.space(4) }}
        />
      </Card>

      {/* ── Writing studio ─────────────────────────────────────────── */}
      <Pressable onPress={() => router.push('/write')}>
        <Card>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Label>Skriftlig fremstilling</Label>
              <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
                Writing studio
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                Write a letter or a topic piece and have the word order checked rule by rule.
              </Txt>
            </View>
            <Txt variant="title" color={t.c.textFaint}>
              →
            </Txt>
          </View>
        </Card>
      </Pressable>

      {/* ── Oral exam topic archive ────────────────────────────────── */}
      <Pressable onPress={() => router.push('/topics')}>
        <Card>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Label>Mundtlig kommunikation</Label>
              <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
                Emnearkiv, {Math.min(...allYears())}–{Math.max(...allYears())}
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                {TOPICS.length} rigtige eksamensemner med modelsvar. Søg hvad der er blevet
                spurgt om, og hvornår.
              </Txt>
            </View>
            <Txt variant="title" color={t.c.textFaint}>
              →
            </Txt>
          </View>
        </Card>
      </Pressable>

      {/* ── Vocabulary flashcards ─────────────────────────────────── */}
      <Pressable onPress={() => router.push('/vocab')}>
        <Card>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Label>Svære ord</Label>
              <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
                Ordforråd
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                {VOCABULARY.length} argumenterende ord og vendinger, hver med et eksempel fra en
                rigtig eksamensbesvarelse.
              </Txt>
            </View>
            <Txt variant="title" color={t.c.textFaint}>
              →
            </Txt>
          </View>
        </Card>
      </Pressable>

      <Divider />

      {/* ── The map ────────────────────────────────────────────────── */}
      <View>
        <Label>Grammar map · PD3 word order</Label>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
          Each rule fills as you demonstrate it across different sentences — and fades if you
          leave it alone, because knowing a rule once is not the same as owning it.
        </Txt>
      </View>

      <View style={{ gap: t.space(2.5) }}>
        {progress.map((p) => (
          <RuleRow key={p.ruleId} p={p} />
        ))}
      </View>

      <Card tone="sunken">
        <Label>Coming next</Label>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2) }}>
          En/et and definiteness · adjective agreement · the tense system · komma rules ·
          AI-reviewed letters with rule-linked corrections.
        </Txt>
      </Card>
    </Screen>
  );
}

function RuleRow({ p }: { p: RuleProgress }) {
  const t = useTheme();
  const r = RULES[p.ruleId];
  const color = levelColor(p.level, t);

  return (
    <Link href={`/rule/${p.ruleId}` as never} asChild>
      <Pressable>
        <Card style={{ padding: t.space(3.5) }}>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Txt variant="heading" numberOfLines={1}>
                {r.en}
              </Txt>
              <Txt variant="body" color={t.c.textFaint} style={{ fontSize: 13, marginTop: 2 }}>
                {r.da}
              </Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt variant="label" color={color}>
                {labelFor(p)}
              </Txt>
              <Txt variant="body" color={t.c.textFaint} style={{ fontSize: 12, marginTop: 2 }}>
                {p.attempts ? `${p.attempts} attempt${p.attempts === 1 ? '' : 's'}` : r.cefr}
              </Txt>
            </View>
          </View>
          <View style={{ marginTop: t.space(3) }}>
            <StrengthBar value={p.strength} color={color} />
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

function labelFor(p: RuleProgress): string {
  if (p.needsRefresh) return 'REFRESH';
  return p.level.toUpperCase();
}

function levelColor(level: MasteryLevel, t: ReturnType<typeof useTheme>): string {
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

export type { RuleId };
