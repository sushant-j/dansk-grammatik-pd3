import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  drillRuleProgress,
  nextDrillQuestion,
  summarizeDrill,
  type DrillQuestion,
} from '../../src/drills/drillExercise';
import { useDrillProfile } from '../../src/drills/drillStore';
import { drillDomain, isDrillDomainKey, type DrillDomain } from '../../src/drills/registry';
import { levelLabel } from '../../src/profile/mastery';
import { currentLevelNow } from '../../src/profile/levelStore';
import { LevelBadge, LevelUpNotice } from '../../src/ui/LevelBadge';
import { ChoiceQuestion } from '../../src/ui/ChoiceQuestion';
import { TrainerScreen } from '../../src/ui/RulesPane';
import { Button, Card, Label, StrengthBar, Txt, s } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';

/**
 * One screen for every grammar-drill domain (see src/drills/registry.ts).
 *
 * Two states. The topic list comes first, because a drill domain has up to
 * ten topics and a learner often arrives wanting one in particular ("I always
 * mix up for and fordi"); "Mixed practice" is there for when they don't, and
 * serves the weakest topic first. The question view follows comma.tsx: the
 * sentence with its gap, the options, then Correct / Not quite with the
 * item's own English explanation. The topic list stays reachable from every
 * question, and the rules pane always holds the whole domain's topics with
 * the current one marked.
 */
export default function DrillScreen() {
  const { domain: key, topic } = useLocalSearchParams<{ domain: string; topic?: string }>();
  const t = useTheme();
  const router = useRouter();

  // Hooks that depend on a real domain live in DrillTrainer, so an unknown or
  // empty domain can bail out here without breaking the order of hooks.
  const domain = isDrillDomainKey(key) ? drillDomain(key) : undefined;
  if (!domain || domain.items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bg, padding: t.space(4), gap: t.space(3) }}>
        <Stack.Screen options={{ title: domain?.label ?? 'Drill' }} />
        <Txt variant="title">{domain ? `${domain.label} is on its way` : 'Unknown drill'}</Txt>
        <Txt variant="body" color={t.c.textMuted}>
          {domain
            ? 'The exercises for this trainer are still being written. Pick another one for now.'
            : 'This drill does not exist — it may have come from an old link.'}
        </Txt>
        <Button tone="ghost" label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  return <DrillTrainer key={domain.key} domain={domain} initialTopic={topic} />;
}

/** The topic list, or practice: of one topic, or mixed (`topicId` null) weakest first. */
type Mode = { kind: 'list' } | { kind: 'practice'; topicId: string | null };

function DrillTrainer({ domain, initialTopic }: { domain: DrillDomain; initialTopic?: string }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const stats = useDrillProfile((st) => st.stats[domain.key]);
  const record = useDrillProfile((st) => st.record);

  const serve = useCallback(
    (topicId: string | null, lastId?: string) =>
      nextDrillQuestion(
        domain,
        useDrillProfile.getState().stats[domain.key],
        lastId,
        Date.now(),
        currentLevelNow(domain.key),
        { topicId: topicId ?? undefined },
      ),
    [domain],
  );

  const validTopic = initialTopic && domain.rules.some((r) => r.id === initialTopic) ? initialTopic : undefined;
  const [mode, setMode] = useState<Mode>(() =>
    validTopic ? { kind: 'practice', topicId: validTopic } : { kind: 'list' },
  );
  const [question, setQuestion] = useState<DrillQuestion | null>(() => (validTopic ? serve(validTopic) : null));
  const [picked, setPicked] = useState<number | null>(null);

  const start = useCallback(
    (topicId: string | null) => {
      setMode({ kind: 'practice', topicId });
      setQuestion(serve(topicId));
      setPicked(null);
    },
    [serve],
  );

  const choose = useCallback(
    (i: number) => {
      if (picked !== null || !question) return;
      setPicked(i);
      record(domain.key, question.item, i === question.correctIndex);
    },
    [picked, question, record, domain.key],
  );

  const advance = useCallback(() => {
    if (mode.kind !== 'practice') return;
    setQuestion(serve(mode.topicId, question?.item.id));
    setPicked(null);
  }, [mode, question, serve]);

  const backToList = useCallback(() => {
    setMode({ kind: 'list' });
    setQuestion(null);
    setPicked(null);
  }, []);

  const inPractice = mode.kind === 'practice';

  return (
    <TrainerScreen
      rules={domain.rules}
      activeRuleId={inPractice ? question?.ruleId : undefined}
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      <Stack.Screen options={{ title: domain.label }} />
      <LevelUpNotice domain={domain.key} />
      {inPractice ? (
        <QuestionView
          domain={domain}
          question={question}
          picked={picked}
          onChoose={choose}
          onNext={advance}
          onBack={backToList}
        />
      ) : (
        <TopicList domain={domain} stats={stats} onStart={start} />
      )}
    </TrainerScreen>
  );
}

function TopicList({
  domain,
  stats,
  onStart,
}: {
  domain: DrillDomain;
  stats: Parameters<typeof drillRuleProgress>[1];
  onStart: (topicId: string | null) => void;
}) {
  const t = useTheme();
  const progress = drillRuleProgress(domain, stats);
  const summary = summarizeDrill(domain, stats);
  // A topic with no items yet is listed (it is in the rules pane too) but cannot be started.
  const servable = new Set(domain.items.map((i) => i.ruleId));

  return (
    <>
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          {domain.label}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {domain.blurb}
        </Txt>
        <Txt variant="label" color={t.c.textFaint} style={{ marginTop: t.space(2) }}>
          {summary.solid} of {summary.total} topics solid
        </Txt>
      </View>

      <Button label="Mixed practice — weakest first" onPress={() => onStart(null)} />

      <View style={{ gap: t.space(3) }}>
        {domain.rules.map((rule, i) => {
          const p = progress[i];
          const color = p.strength >= 0.7 ? t.c.success : p.strength >= 0.4 ? t.c.warning : t.c.accent;
          return (
            <Card key={rule.id}>
              <View style={[s.rowBetween, { alignItems: 'flex-start', gap: t.space(3) }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="heading">{rule.en}</Txt>
                  <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 14 }}>
                    {rule.da}
                  </Txt>
                </View>
                <LevelBadge level={rule.level} />
              </View>
              <View style={[s.row, { gap: t.space(3), marginTop: t.space(3) }]}>
                <View style={{ flex: 1 }}>
                  <StrengthBar value={p.strength} color={color} />
                </View>
                <Txt variant="label" color={t.c.textFaint}>
                  {p.needsRefresh ? 'Refresh' : levelLabel(p.level)}
                </Txt>
              </View>
              <Button
                tone="ghost"
                label={servable.has(rule.id) ? 'Practise' : 'Coming soon'}
                disabled={!servable.has(rule.id)}
                onPress={() => onStart(rule.id)}
                style={{ marginTop: t.space(3) }}
              />
            </Card>
          );
        })}
      </View>
    </>
  );
}

function QuestionView({
  domain,
  question,
  picked,
  onChoose,
  onNext,
  onBack,
}: {
  domain: DrillDomain;
  question: DrillQuestion | null;
  picked: number | null;
  onChoose: (i: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTheme();

  const back = (
    <Pressable onPress={onBack} accessibilityRole="link" hitSlop={8} style={{ alignSelf: 'flex-start' }}>
      <Txt variant="label" color={t.c.accent} style={{ fontSize: 15 }}>
        ← All topics
      </Txt>
    </Pressable>
  );

  if (!question) {
    return (
      <>
        {back}
        <Txt variant="body" color={t.c.textMuted}>
          No exercises here yet. Pick another topic.
        </Txt>
      </>
    );
  }

  const rule = domain.rules.find((r) => r.id === question.ruleId);

  return (
    <>
      {back}
      <ChoiceQuestion
        label={rule?.en ?? domain.label}
        level={question.item.level}
        prompt={question.item.prompt}
        options={question.options}
        correctIndex={question.correctIndex}
        picked={picked}
        onChoose={onChoose}
        explanation={question.item.explanation}
        onNext={onNext}
      />
    </>
  );
}
