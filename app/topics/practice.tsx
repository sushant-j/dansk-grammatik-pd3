import { Link, Stack } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../src/ui/Screen';
import { PRACTICE_TOPICS } from '../../src/content/topics';
import { Card, Label, Txt } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';

/**
 * The practice-topic index. Kept as a separate route (not folded into the
 * archive search) so it is never one filter-tap away from being mistaken for
 * a topic that has actually been examined — these are written in the exam's
 * pattern, for subjects the real archive hasn't covered yet, and every screen
 * they appear on says so.
 */
export default function PracticeTopics() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Practice topics' }} />
      <Screen
        contentContainerStyle={{
          padding: t.space(4),
          paddingBottom: insets.bottom + t.space(8),
          gap: t.space(3),
        }}
      >
        <View>
          <Txt variant="display" style={{ fontSize: 26 }}>
            Practice topics
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
            Not real exam tasks. Written in the official pattern — cause, consequence, pros/cons, opinion — on subjects the archive does not cover yet, so you can practise more broadly than what has already been asked.
          </Txt>
        </View>

        {PRACTICE_TOPICS.map((topic) => (
          <Link key={topic.id} href={`/topics/practice/${topic.id}`} asChild>
            <Pressable>
              <Card>
                <Label color={t.c.textFaint}>ØVELSE</Label>
                <Txt variant="heading" style={{ marginTop: t.space(1.5) }}>
                  {topic.title}
                </Txt>
                <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                  {topic.scenario.join(' · ')}
                </Txt>
              </Card>
            </Pressable>
          </Link>
        ))}
      </Screen>
    </>
  );
}
