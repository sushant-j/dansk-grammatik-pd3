import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Exam } from '../src/grammar/rules';
import { EXAM_DESCRIPTIONS, EXAM_LABELS, useSettings } from '../src/profile/settings';
import { Card, Label, Txt, s } from '../src/ui/primitives';
import { Screen } from '../src/ui/Screen';
import { useTheme } from '../src/ui/theme';

const EXAMS: Exam[] = ['PD2', 'PD3', 'FVU'];

/**
 * The exam-target picker.
 *
 * Deliberately not framed as "which mode are you in" — nothing switches off.
 * Picking PD2 does not remove PD3-only rules from the map; it just sorts them
 * to the bottom and de-emphasises them in what the trainer serves next. The
 * screen says this explicitly, because the natural (wrong) assumption is that
 * this is a content filter.
 */
export default function Settings() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const targetExam = useSettings((st) => st.targetExam);
  const setTargetExam = useSettings((st) => st.setTargetExam);

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          Dit eksamensfokus
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          This does not hide anything. Every rule stays on the map regardless of what you pick —
          this only changes what gets sorted to the top and what the trainer leans toward next.
        </Txt>
      </View>

      <Pressable onPress={() => setTargetExam(null)}>
        <Card tone={targetExam === null ? 'accent' : 'surface'}>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Txt variant="heading">Intet fokus</Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                See everything in the order it naturally comes up. The default.
              </Txt>
            </View>
            {targetExam === null ? (
              <Txt variant="title" color={t.c.accent}>
                ✓
              </Txt>
            ) : null}
          </View>
        </Card>
      </Pressable>

      {EXAMS.map((exam) => (
        <Pressable key={exam} onPress={() => setTargetExam(exam)}>
          <Card tone={targetExam === exam ? 'accent' : 'surface'}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1, paddingRight: t.space(3) }}>
                <Label color={targetExam === exam ? t.c.accent : t.c.textFaint}>
                  {EXAM_LABELS[exam]}
                </Label>
                <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                  {EXAM_DESCRIPTIONS[exam]}
                </Txt>
              </View>
              {targetExam === exam ? (
                <Txt variant="title" color={t.c.accent}>
                  ✓
                </Txt>
              ) : null}
            </View>
          </Card>
        </Pressable>
      ))}

      <Card tone="sunken">
        <Label>What this actually changes</Label>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
          The grammar map sorts rules tagged for your exam to the top. The sætningsskema trainer
          leans toward exercises tagged for your exam when it picks what to serve next — but it
          will still occasionally give you something outside that tag, because a rule you are
          shaky on is still worth practising.
        </Txt>
      </Card>
    </Screen>
  );
}
