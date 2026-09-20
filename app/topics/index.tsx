import { Link, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  allYears,
  OFFICIAL_SESSIONS,
  PRACTICE_TOPICS,
  TOPICS,
  type Topic,
} from '../../src/content/topics';
import { ScreenColumn } from '../../src/ui/Screen';
import { Card, Label, Txt, s } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';

/**
 * The archive search screen — "what was actually asked, and when".
 *
 * This exists because every other PD3 resource treats topics as a flat list.
 * A candidate preparing for a specific sitting wants the opposite question
 * answered: has this come up before, how recently, and how often. Filtering by
 * year and free-text search over both title and question text is what makes
 * that answerable instead of just browsable.
 */

type Row =
  | { kind: 'topic'; topic: Topic }
  | { kind: 'official'; year: number; term: 'S' | 'V'; label: string; title: string; scenes: [string, string] };

export default function TopicsIndex() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const years = useMemo(() => allYears(), []);

  const rows: Row[] = useMemo(() => {
    const officialRows: Row[] = OFFICIAL_SESSIONS.flatMap((sess) =>
      sess.emner.map((e) => ({
        kind: 'official' as const,
        year: sess.year,
        term: sess.term,
        label: e.label,
        title: e.title,
        scenes: e.scenes,
      })),
    );
    const archiveRows: Row[] = TOPICS.map((topic) => ({ kind: 'topic' as const, topic }));
    return [...officialRows, ...archiveRows].sort((a, b) => {
      const ya = a.kind === 'topic' ? a.topic.year : a.year;
      const yb = b.kind === 'topic' ? b.topic.year : b.year;
      if (ya !== yb) return yb - ya;
      const ta = a.kind === 'topic' ? a.topic.term : a.term;
      const tb = b.kind === 'topic' ? b.topic.term : b.term;
      return ta === tb ? 0 : ta === 'V' ? -1 : 1;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const year = r.kind === 'topic' ? r.topic.year : r.year;
      if (yearFilter !== null && year !== yearFilter) return false;
      if (!q) return true;
      if (r.kind === 'official') {
        return (
          r.title.toLowerCase().includes(q) ||
          r.scenes.some((s2) => s2.toLowerCase().includes(q))
        );
      }
      return (
        r.topic.title.toLowerCase().includes(q) ||
        r.topic.questions.some(
          (qq) => qq.q.toLowerCase().includes(q) || qq.a.toLowerCase().includes(q),
        )
      );
    });
  }, [rows, query, yearFilter]);

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <ScreenColumn>
      <View style={{ padding: t.space(4), paddingBottom: t.space(2), gap: t.space(3) }}>
        <View>
          <Txt variant="display" style={{ fontSize: 26 }}>
            Topic archive
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
            {TOPICS.length} real exam topics, 2011–2020, plus the most recent official ones. Search to see what has already been asked.
          </Txt>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search topic, question or word…"
          placeholderTextColor={t.c.textFaint}
          style={{
            backgroundColor: t.c.surface,
            borderWidth: 1,
            borderColor: t.c.border,
            borderRadius: t.radius.md,
            paddingVertical: t.space(3),
            paddingHorizontal: t.space(3.5),
            color: t.c.text,
            fontSize: 15,
          }}
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...years]}
          keyExtractor={(y) => String(y)}
          contentContainerStyle={{ gap: t.space(2) }}
          renderItem={({ item: y }) => (
            <Pressable
              onPress={() => setYearFilter(y)}
              style={{
                borderWidth: 1,
                borderColor: yearFilter === y ? t.c.accent : t.c.border,
                backgroundColor: yearFilter === y ? t.c.accentSoft : t.c.surface,
                borderRadius: 999,
                paddingVertical: t.space(1.5),
                paddingHorizontal: t.space(3),
              }}
            >
              <Txt variant="chip" color={yearFilter === y ? t.c.accent : t.c.textMuted}>
                {y === null ? 'All years' : y}
              </Txt>
            </Pressable>
          )}
        />

        <Txt variant="label" color={t.c.textFaint}>
          {filtered.length} RESULTAT{filtered.length === 1 ? '' : 'ER'}
        </Txt>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => (r.kind === 'topic' ? r.topic.id : `off-${r.year}-${r.term}-${r.label}`)}
        contentContainerStyle={{
          paddingHorizontal: t.space(4),
          paddingBottom: insets.bottom + t.space(8),
          gap: t.space(2.5),
        }}
        renderItem={({ item }) => <TopicRow row={item} />}
        ListEmptyComponent={
          <Card tone="sunken" style={{ marginTop: t.space(4) }}>
            <Txt variant="body" color={t.c.textMuted}>
              Ingen emner matcher "{query}". Prøv et andet ord, eller ryd årsfilteret.
            </Txt>
          </Card>
        }
        ListFooterComponent={
          <Pressable onPress={() => router.push('/topics/practice')} style={{ marginTop: t.space(2) }}>
            <Card tone="accent">
              <Label color={t.c.accent}>{PRACTICE_TOPICS.length} PRACTICE TOPICS</Label>
              <Txt variant="heading" style={{ marginTop: t.space(2) }}>
                Topics the archive does not cover yet
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
                Written in the exam’s own pattern (cause, consequence, pros/cons, opinion) on subjects like politics, inequality and parenthood — to keep you sharp on areas the archive does not cover yet.
              </Txt>
            </Card>
          </Pressable>
        }
      />
      </ScreenColumn>
    </View>
  );
}

function TopicRow({ row }: { row: Row }) {
  const t = useTheme();

  if (row.kind === 'official') {
    return (
      <Card tone="sunken">
        <View style={s.rowBetween}>
          <Label>
            {row.year}-{row.term} · Topic {row.label}
          </Label>
          <Label color={t.c.textFaint}>OFFICIAL</Label>
        </View>
        <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
          {row.title}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {row.scenes.join(' · ')}
        </Txt>
        <Txt variant="body" color={t.c.textFaint} style={{ marginTop: t.space(1.5), fontSize: 12 }}>
          Exam sheet with no printed answer key — the examiner builds questions from the pictures.
        </Txt>
      </Card>
    );
  }

  const topic = row.topic;
  return (
    <Link href={`/topics/${topic.id}`} asChild>
      <Pressable>
        <Card>
          <View style={s.rowBetween}>
            <Label>
              {topic.year}-{topic.term}
              {topic.label ? ` · Topic ${topic.label}` : ''}
            </Label>
            <Label color={t.c.textFaint}>{topic.questions.length} QUESTIONS</Label>
          </View>
          <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
            {topic.title}
          </Txt>
          <Txt variant="body" color={t.c.textMuted} numberOfLines={2} style={{ marginTop: t.space(1) }}>
            {topic.questions[0]?.q}
          </Txt>
        </Card>
      </Pressable>
    </Link>
  );
}
