import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_LESSONS, WORLDS, lessonById, worldTitle } from '../src/path/curriculum';
import { usePathState } from '../src/path/store';
import { NodeDot, Stars, lessonDot } from '../src/ui/PathParts';
import { Screen } from '../src/ui/Screen';
import { Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';

/**
 * The rule book: every grammar rule in the app on one page, in the order of
 * the path, searchable. Any rule card opens from here, locked or not — the
 * path gates the scored lessons, never the reading.
 */
export default function RuleBook() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const state = usePathState();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    return new Set(
      ALL_LESSONS.filter((l) =>
        [l.rule.da, l.rule.en, l.rule.familyLabel, ...l.requires.map((id) => lessonById(id)?.rule.da ?? '')]
          .join(' ')
          .toLowerCase()
          .includes(q),
      ).map((l) => l.id),
    );
  }, [q]);
  const shown = matches ? matches.size : ALL_LESSONS.length;

  return (
    <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: insets.bottom + t.space(10), gap: t.space(4) }}>
      <View style={{ gap: t.space(1.5) }}>
        <Txt variant="display" style={{ fontSize: 28 }}>
          Rule book
        </Txt>
        <Txt variant="body" color={t.c.textMuted}>
          Every rule in the order of the path. Any rule card can be read, even while its lesson is locked.
        </Txt>
      </View>

      <View
        style={[
          s.row,
          {
            gap: t.space(2.5),
            backgroundColor: t.c.surface,
            borderWidth: 1,
            borderColor: t.c.border,
            borderRadius: t.radius.md,
            paddingHorizontal: t.space(3),
          },
        ]}
      >
        <Ionicons name="search" size={18} color={t.c.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search, e.g. komma, passiv, sin"
          placeholderTextColor={t.c.textFaint}
          accessibilityLabel="Search rules"
          autoCorrect={false}
          autoCapitalize="none"
          style={{ flex: 1, minHeight: 46, fontSize: 16, color: t.c.text, fontFamily: t.fontFamily.regular }}
        />
      </View>
      <Txt variant="label" color={t.c.textMuted}>
        {matches
          ? `${shown} of ${ALL_LESSONS.length} rules match`
          : `${ALL_LESSONS.length} rules · ${state.lessonsDone} passed`}
      </Txt>

      {WORLDS.map((w) => {
        const units = w.units
          .map((u) => ({ u, lessons: u.lessons.filter((l) => !matches || matches.has(l.id)) }))
          .filter((x) => x.lessons.length);
        if (!units.length) return null;
        return (
          <View key={w.index} style={{ gap: t.space(2.5) }}>
            <View style={[s.rowBetween, { alignItems: 'baseline' }]}>
              <Txt variant="title" style={{ fontSize: 20 }}>
                {worldTitle(w)}
              </Txt>
              <Txt variant="label" color={t.c.textMuted}>
                {w.cefr}
              </Txt>
            </View>
            {units.map(({ u, lessons }) => (
              <View
                key={u.id}
                style={{
                  backgroundColor: t.c.surface,
                  borderWidth: 1,
                  borderColor: t.c.border,
                  borderRadius: t.radius.lg,
                  overflow: 'hidden',
                }}
              >
                <View style={[s.rowBetween, { paddingHorizontal: t.space(3.5), paddingVertical: t.space(2.5) }]}>
                  <Txt
                    variant="label"
                    color={t.c.textMuted}
                    style={{ flex: 1, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}
                  >
                    {u.name}
                  </Txt>
                  <Txt variant="label" color={t.c.textFaint}>
                    {u.lessons.length} rules
                  </Txt>
                </View>
                {lessons.map((l) => {
                  const ls = state.lessons[l.id];
                  const builds = l.requires.map((id) => lessonById(id)?.rule.da ?? id);
                  return (
                    <Pressable
                      key={l.id}
                      onPress={() => router.push(`/rule/${l.id}` as never)}
                      accessibilityRole="link"
                      style={({ pressed }) => [
                        s.row,
                        {
                          gap: t.space(3),
                          paddingHorizontal: t.space(3.5),
                          paddingVertical: t.space(2.5),
                          minHeight: 48,
                          borderTopWidth: 1,
                          borderTopColor: t.c.surfaceSunken,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <NodeDot kind={lessonDot(ls, state.nextLessonId === l.id)} cracked={ls.cracked} size={26} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Txt variant="body" style={{ fontWeight: '600', fontSize: 15, lineHeight: 20 }}>
                          {l.rule.da}
                        </Txt>
                        <Txt variant="label" color={t.c.textMuted} style={{ fontSize: 12 }}>
                          {builds.length ? `${l.rule.familyLabel} · builds on ${builds.join(', ')}` : l.rule.familyLabel}
                        </Txt>
                      </View>
                      {ls.stars ? <Stars count={ls.stars} size={13} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        );
      })}

      {matches && shown === 0 ? (
        <Txt variant="body" color={t.c.textMuted} style={{ textAlign: 'center', paddingVertical: t.space(8) }}>
          No rule matches “{query}”.
        </Txt>
      ) : null}
    </Screen>
  );
}
