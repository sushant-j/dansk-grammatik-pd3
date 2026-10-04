import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { bestTotal, useAttempts } from '../../src/exam/attemptStore';
import { gradeFor } from '../../src/exam/grade';
import { usePaperIndex, type IndexedPaper } from '../../src/exam/papers';
import { Button, Card, ListGroup, ListRow, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';
import { useTheme } from '../../src/ui/theme';

const sessionOrder = (p: IndexedPaper) =>
  p.source.kind === 'official' ? p.source.year * 2 + (p.source.term === 'winter' ? 1 : 0) : 0;

/** Every reading paper: simulated ones, then official ones newest first, split by format. */
export default function ReadingPapers() {
  const t = useTheme();
  const router = useRouter();
  const { papers, state, retry } = usePaperIndex();
  const attempts = useAttempts((st) => st.attempts);

  const simulated = papers.filter((p) => p.source.kind === 'simulated');
  const examLevel = simulated.filter((p) => p.source.kind === 'simulated' && p.source.level === 'exam');
  const warmups = simulated.filter((p) => !examLevel.includes(p));
  const official = papers.filter((p) => p.source.kind === 'official').sort((a, b) => sessionOrder(b) - sessionOrder(a));
  const current = official.filter((p) => p.format === 'current');
  const older = official.filter((p) => p.format !== 'current');

  const row = (p: IndexedPaper) => {
    const best = bestTotal(attempts, p.id);
    return (
      <ListRow
        key={p.id}
        title={p.title}
        detail={`${p.lf1Theme} · ${p.lf2Titles.join(' · ')}`}
        meta={best ? `${best.points}/${best.max} · ${gradeFor(p.gradeTable, best.points)}` : undefined}
        metaColor={t.c.textMuted}
        onPress={() => router.push({ pathname: '/exam/[paperId]', params: { paperId: p.id } } as never)}
      />
    );
  };

  return (
    <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: t.space(12), gap: t.space(5) }}>
      <View>
        <Txt variant="display" style={{ fontSize: 28, lineHeight: 34 }}>
          Reading papers
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5), lineHeight: 22 }}>
          Læseforståelse 1 and 2, with the text on one side and the questions on the other. Sit a part as a timed exam,
          or practise and check answers as you go.
        </Txt>
      </View>

      {simulated.length ? (
        <View style={{ gap: t.space(2) }}>
          {examLevel.length ? <ListGroup title="Simulated papers · exam level">{examLevel.map(row)}</ListGroup> : null}
          {warmups.length ? <ListGroup title="Simulated papers · warm-up">{warmups.map(row)}</ListGroup> : null}
          <Txt variant="label" color={t.c.textFaint} style={{ paddingHorizontal: t.space(1) }}>
            Written for this app in today’s format, modelled on the official papers. Not official papers. Exam-level
            papers match the official texts and questions in difficulty; warm-ups are easier.
          </Txt>
        </View>
      ) : null}

      {current.length ? <ListGroup title="Official papers · today’s format">{current.map(row)}</ListGroup> : null}

      {older.length ? (
        <View style={{ gap: t.space(2) }}>
          <ListGroup title="Official papers · before Nov 2022">{older.map(row)}</ListGroup>
          <Txt variant="label" color={t.c.textFaint} style={{ paddingHorizontal: t.space(1) }}>
            Læseforståelse 1 is the same as today. Læseforståelse 2 had seven 2A questions and no paragraph task; its gap
            text is today’s Delprøve 3. Scored out of 37.
          </Txt>
        </View>
      ) : null}

      {state === 'loading' && !official.length ? <ActivityIndicator color={t.c.textMuted} /> : null}
      {state === 'offline' ? (
        <Card tone="sunken">
          <Txt variant="body" style={{ lineHeight: 22 }}>
            The official papers couldn’t be loaded. They come from your account, so you need to be online the first
            time you open them.
          </Txt>
          <Button label="Try again" tone="ghost" onPress={retry} style={{ marginTop: t.space(3) }} />
        </Card>
      ) : null}
    </Screen>
  );
}
