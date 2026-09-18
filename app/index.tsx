import { Link, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../src/ui/Screen';
import { RULES, type Exam, type RuleId } from '../src/grammar/rules';
import { allYears, TOPICS } from '../src/content/topics';
import { VOCABULARY } from '../src/content/vocabulary';
import {
  ruleProgress,
  summarize,
  useProfile,
  type MasteryLevel,
  type RuleProgress,
} from '../src/profile/store';
import { useVocabProfile } from '../src/profile/vocabStore';
import { useNounProfile } from '../src/profile/nounStore';
import { useAdjectiveProfile } from '../src/profile/adjectiveStore';
import { useVerbProfile } from '../src/profile/verbStore';
import { useCommaProfile } from '../src/profile/commaStore';
import { useSpellingProfile } from '../src/profile/spellingStore';
import { crossDomainReview, summarizeOverview } from '../src/profile/overview';
import { buildStudyPlan, type Readiness } from '../src/profile/studyplan';
import { EXAM_LABELS, useSettings } from '../src/profile/settings';
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
  const targetExam = useSettings((st) => st.targetExam);

  // Every trainer's mastery, rolled up so "what to do next" reflects the whole
  // app rather than just the word-order map. See profile/overview.ts.
  const vocabStats = useVocabProfile((st) => st.stats);
  const nounStats = useNounProfile((st) => st.stats);
  const adjectiveStats = useAdjectiveProfile((st) => st.stats);
  const verbStats = useVerbProfile((st) => st.stats);
  const commaStats = useCommaProfile((st) => st.stats);
  const spellingStats = useSpellingProfile((st) => st.stats);

  const overview = useMemo(() => {
    const domains = crossDomainReview({
      grammar: stats,
      verbs: verbStats,
      nouns: nounStats,
      adjectives: adjectiveStats,
      comma: commaStats,
      spelling: spellingStats,
      vocab: vocabStats,
    });
    return summarizeOverview(domains);
  }, [stats, verbStats, nounStats, adjectiveStats, commaStats, spellingStats, vocabStats]);

  const progress = useMemo(() => {
    const base = ruleProgress(stats);
    if (!targetExam) return base;
    // A bias, not a filter — see settings.ts. Exam-relevant rules sort first;
    // nothing drops off the map.
    return [...base].sort((a, b) => {
      const aMatch = RULES[a.ruleId].exams.includes(targetExam) ? 0 : 1;
      const bMatch = RULES[b.ruleId].exams.includes(targetExam) ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [stats, targetExam]);
  const summary = useMemo(() => summarize(stats), [stats]);

  // The app-wide widest gap drives the headline card. When that gap is in the
  // word-order map, we keep the rich per-rule detail (drilling to the exact
  // rule); when it is in another trainer, we hand off to that trainer honestly
  // instead of pretending the priority is word order.
  const widest = overview.widestGap;
  const wordOrderGap = summary.openGaps[0] ?? summary.refreshing[0];
  const grammarIsWidest = widest?.key === 'grammar' && !!wordOrderGap;
  const focus = grammarIsWidest ? wordOrderGap : undefined;

  // Exam countdown → paced study plan. Only shown once a date is set.
  const examDate = useSettings((st) => st.examDate);
  const plan = useMemo(() => buildStudyPlan(examDate, overview), [examDate, overview]);

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
        <View style={s.rowBetween}>
          <Txt variant="display">Din grammatik</Txt>
          <Link href="/settings" asChild>
            <Pressable
              style={{
                borderWidth: 1,
                borderColor: t.c.border,
                borderRadius: 999,
                paddingHorizontal: t.space(3),
                paddingVertical: t.space(1.5),
              }}
            >
              <Txt variant="label" color={t.c.textMuted}>
                {targetExam ? EXAM_LABELS[targetExam] : 'ALLE'}
              </Txt>
            </Pressable>
          </Link>
        </View>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {overview.started
            ? `${overview.totalSolid} of ${overview.totalItems} solid across every trainer. No streaks here — just what you know and what is still open.`
            : 'Danish grammar, taught the way Danish schools teach it: with the sætningsskema. Start anywhere.'}
        </Txt>
      </View>

      {/* ── Exam countdown / study plan ─────────────────────────────────
          Only when a date is set. The pace is arithmetic the learner can
          check (things not yet solid ÷ weeks left), never a claim of passing. */}
      {plan.readiness !== 'no-date' && (
        <Pressable onPress={() => router.push('/settings')}>
          <Card tone={readinessTone(plan.readiness)}>
            <View style={s.rowBetween}>
              <Label color={readinessColor(plan.readiness, t)}>
                {plan.readiness === 'past'
                  ? 'Exam date passed'
                  : plan.daysLeft === 0
                    ? 'Exam is today'
                    : `${plan.daysLeft} ${plan.daysLeft === 1 ? 'day' : 'days'} to exam`}
              </Label>
              <Txt variant="label" color={t.c.textFaint}>
                {readinessLabel(plan.readiness)}
              </Txt>
            </View>
            <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
              {plan.message}
            </Txt>
          </Card>
        </Pressable>
      )}

      {/* ── What to do next ─────────────────────────────────────────────
          App-wide: the headline follows the widest gap wherever it is. Three
          shapes — a rich word-order rule card, a hand-off to another trainer,
          or (nothing open) a start / caught-up state. */}
      {focus ? (
        <Card tone="accent">
          <Label color={t.c.accent}>
            {focus.needsRefresh ? 'Needs a refresh' : 'Your widest gap'}
          </Label>
          <Txt variant="title" style={{ marginTop: t.space(2) }}>
            {RULES[focus.ruleId].da}
          </Txt>
          <Txt variant="body" color={t.c.textFaint} style={{ marginTop: 2, fontStyle: 'italic' }}>
            {RULES[focus.ruleId].en}
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
            {RULES[focus.ruleId].statement}
          </Txt>
          <Button
            label="Close this gap"
            onPress={() => router.push('/train')}
            style={{ marginTop: t.space(4) }}
          />
        </Card>
      ) : widest ? (
        <Card tone="accent">
          <Label color={t.c.accent}>Your widest gap</Label>
          <Txt variant="title" style={{ marginTop: t.space(2) }}>
            {widest.label}
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
            {widest.attention} {widest.attention === 1 ? 'rule' : 'rules'} still open here —
            your weakest spot across the whole app right now.
          </Txt>
          <Button
            label="Close this gap"
            onPress={() => router.push(widest.route as never)}
            style={{ marginTop: t.space(4) }}
          />
        </Card>
      ) : overview.started ? (
        <Card tone="success">
          <Label color={t.c.success}>All caught up</Label>
          <Txt variant="title" style={{ marginTop: t.space(2) }}>
            Nothing open right now
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
            Every rule you have practised is solid. Keep one warm, or open a trainer you have not
            started yet — the map below shows what is still unseen.
          </Txt>
        </Card>
      ) : (
        <Card tone="surface">
          <Label color={t.c.textFaint}>Start here</Label>
          <Txt variant="title" style={{ marginTop: t.space(2) }}>
            Verbet på plads nummer to (V2)
          </Txt>
          <Txt variant="body" color={t.c.textFaint} style={{ marginTop: 2, fontStyle: 'italic' }}>
            The finite verb sits in slot two
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
            Six rules govern almost every word-order error at PD3 level. This is the one
            everything else hangs off.
          </Txt>
          <Button
            label="Begin training"
            onPress={() => router.push('/train')}
            style={{ marginTop: t.space(4) }}
          />
        </Card>
      )}

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

      {/* ── En/et and double definiteness ────────────────────────────── */}
      <Pressable onPress={() => router.push('/nouns')}>
        <Card>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Label>Køn og bestemthed</Label>
              <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
                En-ord og et-ord
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                Gender, the definite suffix, and double definiteness — "den røde bil", never
                "den røde bilen".
              </Txt>
            </View>
            <Txt variant="title" color={t.c.textFaint}>
              →
            </Txt>
          </View>
        </Card>
      </Pressable>

      {/* ── Adjective agreement ──────────────────────────────────────── */}
      <Pressable onPress={() => router.push('/adjectives')}>
        <Card>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Label>Bøjning</Label>
              <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
                Adjektivets former
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                Base, -t, or -e — "en rød bil", "et rødt hus", "de røde biler". The same fact
                about the noun that decided its own suffix now decides the adjective's.
              </Txt>
            </View>
            <Txt variant="title" color={t.c.textFaint}>
              →
            </Txt>
          </View>
        </Card>
      </Pressable>

      {/* ── Tense: weak/strong verbs, er vs. har ─────────────────────── */}
      <Pressable onPress={() => router.push('/verbs')}>
        <Card>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Label>Tid</Label>
              <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
                Datid og førnutid
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                "Gik", not "gåede" — and "han ER gået" but "hun HAR set". Weak verbs take a
                suffix, strong verbs change shape, and the auxiliary tracks meaning.
              </Txt>
            </View>
            <Txt variant="title" color={t.c.textFaint}>
              →
            </Txt>
          </View>
        </Card>
      </Pressable>

      {/* ── Comma rules ───────────────────────────────────────────────── */}
      <Pressable onPress={() => router.push('/comma')}>
        <Card>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Label>Tegnsætning</Label>
              <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
                Kommaregler
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                Comma before "men", never before "og" — and no comma before the last item in a
                list. Full sentences, not single words: read the whole thing before choosing.
              </Txt>
            </View>
            <Txt variant="title" color={t.c.textFaint}>
              →
            </Txt>
          </View>
        </Card>
      </Pressable>

      {/* ── FVU spelling ─────────────────────────────────────────────── */}
      <Pressable onPress={() => router.push('/spelling')}>
        <Card>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Label>Stavning · FVU</Label>
              <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
                Stavning
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                "Hund", not "hun" — a different failure mode from every other module here: sound
                not matching spelling, not a grammar choice.
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
        <Label>Grammar map{targetExam ? ` · sorted for ${EXAM_LABELS[targetExam]}` : ' · PD3 word order'}</Label>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
          Each rule fills as you demonstrate it across different sentences — and fades if you
          leave it alone, because knowing a rule once is not the same as owning it.
        </Txt>
      </View>

      <View style={{ gap: t.space(2.5) }}>
        {progress.map((p) => (
          <RuleRow key={p.ruleId} p={p} targetExam={targetExam} />
        ))}
      </View>

      <Card tone="sunken">
        <Label>Coming next</Label>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2) }}>
          AI-reviewed letters with rule-linked corrections.
        </Txt>
      </Card>
    </Screen>
  );
}

function RuleRow({ p, targetExam }: { p: RuleProgress; targetExam: Exam | null }) {
  const t = useTheme();
  const r = RULES[p.ruleId];
  const color = levelColor(p.level, t);
  const offTarget = targetExam !== null && !r.exams.includes(targetExam);

  return (
    <Link href={`/rule/${p.ruleId}` as never} asChild>
      <Pressable>
        <Card style={{ padding: t.space(3.5), opacity: offTarget ? 0.55 : 1 }}>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Txt variant="heading" numberOfLines={1}>
                {r.da}
              </Txt>
              <Txt variant="body" color={t.c.textFaint} style={{ fontSize: 13, marginTop: 2, fontStyle: 'italic' }}>
                {r.en}
              </Txt>
              {offTarget ? (
                <Txt variant="label" color={t.c.textFaint} style={{ marginTop: t.space(1.5) }}>
                  NOT ON {EXAM_LABELS[targetExam!]}
                </Txt>
              ) : null}
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

function readinessTone(r: Readiness): 'success' | 'warning' | 'accent' | 'sunken' {
  switch (r) {
    case 'ready':
    case 'on-track':
      return 'success';
    case 'tight':
      return 'warning';
    case 'behind':
      return 'accent';
    default:
      return 'sunken'; // past
  }
}

function readinessColor(r: Readiness, t: ReturnType<typeof useTheme>): string {
  switch (r) {
    case 'ready':
    case 'on-track':
      return t.c.success;
    case 'tight':
      return t.c.warning;
    case 'behind':
      return t.c.accent;
    default:
      return t.c.textFaint;
  }
}

function readinessLabel(r: Readiness): string {
  switch (r) {
    case 'ready':
      return 'KLAR';
    case 'on-track':
      return 'PÅ SPORET';
    case 'tight':
      return 'STRAMT';
    case 'behind':
      return 'BAGUD';
    default:
      return '';
  }
}

export type { RuleId };
