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
      <Stack.Screen options={{ title: 'Øvelsesemner' }} />
      <Screen
        contentContainerStyle={{
          padding: t.space(4),
          paddingBottom: insets.bottom + t.space(8),
          gap: t.space(3),
        }}
      >
        <View>
          <Txt variant="display" style={{ fontSize: 26 }}>
            Øvelsesemner
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
            Ikke rigtige eksamensopgaver. Skrevet i det officielle mønster — årsag,
            konsekvens, fordele/ulemper, holdning — om emner arkivet endnu ikke dækker, så du
            kan øve dig bredere end det, der allerede har været spurgt om.
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
