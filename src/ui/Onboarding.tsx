import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Exam } from '../grammar/rules';
import { EXAM_DESCRIPTIONS, EXAM_LABELS } from '../profile/settings';
import { Card, Label, Txt, s } from './primitives';
import { Screen } from './Screen';
import { useTheme } from './theme';

/**
 * First-open welcome — shown once, then never again (settings.onboarded).
 *
 * The app is shared with PD3, PD2, and FVU learners at once, so a newcomer's
 * very first decision should be "which exam am I here for", landing them on
 * the right focus instead of leaving them to discover the level pill on their
 * own. It stays honest to how focus actually works: picking a level tailors
 * the order, it does not hide anything, and it can be changed anytime — the
 * copy says so rather than overpromising a "mode".
 *
 * Choosing "show me everything" (null) is a first-class option, not a
 * skip-link afterthought: plenty of people learning Danish are not sitting a
 * specific exam, and nothing here should imply they must pick one.
 */

const CHOICES: Exam[] = ['PD3', 'PD2', 'FVU'];

export function Onboarding({ onPick }: { onPick: (exam: Exam | null) => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingTop: insets.top + t.space(6),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      <View>
        <Txt variant="display">Welcome to Skema</Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
          Danish grammar, taught the way Danish schools teach it — with the sætningsskema, plus
          spelling, verbs, commas and the words the exams actually use.
        </Txt>
      </View>

      <View>
        <Txt variant="title">Which exam are you preparing for?</Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          This just tailors the order and what you are shown first. Nothing is hidden, and you can
          change it anytime.
        </Txt>
      </View>

      {CHOICES.map((exam) => (
        <Pressable key={exam} onPress={() => onPick(exam)}>
          <Card>
            <View style={s.rowBetween}>
              <View style={{ flex: 1, paddingRight: t.space(3) }}>
                <Label color={t.c.accent}>{EXAM_LABELS[exam]}</Label>
                <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                  {EXAM_DESCRIPTIONS[exam]}
                </Txt>
              </View>
              <Txt variant="title" color={t.c.textFaint}>
                ›
              </Txt>
            </View>
          </Card>
        </Pressable>
      ))}

      <Pressable onPress={() => onPick(null)}>
        <Card tone="sunken">
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Txt variant="heading">Just show me everything</Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                Not sitting a specific exam, or not sure yet? Start with everything in view.
              </Txt>
            </View>
            <Txt variant="title" color={t.c.textFaint}>
              ›
            </Txt>
          </View>
        </Card>
      </Pressable>
    </Screen>
  );
}
