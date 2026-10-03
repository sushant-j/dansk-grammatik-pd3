import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXAM_GUIDES, GUIDE_ORDER, type GuideExam } from '../src/content/examGuides';
import { useSettings } from '../src/profile/settings';
import { Screen } from '../src/ui/Screen';
import { Card, Divider, Label, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';

/** Section-by-section exam guide for PD3, PD2 and FVU-dansk. */
export default function ExamGuideScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const target = useSettings((st) => st.targetExam);
  const [exam, setExam] = useState<GuideExam>(
    target === 'PD2' || target === 'FVU' ? target : 'PD3',
  );
  const guide = EXAM_GUIDES[exam];

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(10),
        gap: t.space(4),
      }}
    >
      <View style={[s.row, { gap: t.space(2) }]}>
        {GUIDE_ORDER.map((e) => (
          <Pressable
            key={e}
            onPress={() => setExam(e)}
            accessibilityRole="button"
            accessibilityState={{ selected: e === exam }}
            style={{
              flex: 1,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: e === exam ? t.c.accent : t.c.border,
              backgroundColor: e === exam ? t.c.accentSoft : t.c.surface,
              borderRadius: 999,
              paddingVertical: t.space(2),
            }}
          >
            <Txt variant="chip" color={e === exam ? t.c.accent : t.c.textMuted}>
              {e}
            </Txt>
          </Pressable>
        ))}
      </View>

      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          {guide.title}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5), lineHeight: 22 }}>
          {guide.intro}
        </Txt>
      </View>

      {guide.sections.map((sec) => (
        <Card key={sec.key}>
          <View style={s.rowBetween}>
            <Label color={t.c.accent}>{sec.title}</Label>
            <Label color={t.c.textFaint}>{sec.danish.toUpperCase()}</Label>
          </View>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
            {sec.summary}
          </Txt>

          <View style={{ marginTop: t.space(3), gap: t.space(2.5) }}>
            {sec.parts.map((p) => (
              <View key={p.name}>
                <View style={s.rowBetween}>
                  <Txt variant="heading">{p.name}</Txt>
                  {p.time ? (
                    <Txt variant="label" color={t.c.textFaint}>
                      {p.time.toUpperCase()}
                    </Txt>
                  ) : null}
                </View>
                <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1), lineHeight: 22 }}>
                  {p.what}
                </Txt>
              </View>
            ))}
          </View>

          <Divider />
          <Label>Tips</Label>
          <View style={{ marginTop: t.space(1.5), gap: t.space(1.5) }}>
            {sec.tips.map((tip, i) => (
              <Txt key={i} variant="body" color={t.c.textMuted} style={{ lineHeight: 22 }}>
                • {tip}
              </Txt>
            ))}
          </View>

          <Divider />
          <Label>Official material</Label>
          <View style={{ marginTop: t.space(1.5), gap: t.space(1) }}>
            {sec.docs.map((d) => (
              <Pressable key={d.url} onPress={() => Linking.openURL(d.url)} accessibilityRole="link">
                <Txt variant="body" color={t.c.accent} style={{ lineHeight: 24 }}>
                  ↗ {d.label}
                </Txt>
              </Pressable>
            ))}
          </View>

          {sec.route ? (
            <Pressable onPress={() => router.push(sec.route!.path as never)} style={{ marginTop: t.space(3) }}>
              <Card tone="accent">
                <Txt variant="body" color={t.c.accent} style={{ fontWeight: '600' }}>
                  {sec.route.label} →
                </Txt>
              </Card>
            </Pressable>
          ) : null}
        </Card>
      ))}

      <Card tone="sunken">
        <Label>What has been published</Label>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
          {guide.published}
        </Txt>
      </Card>
    </Screen>
  );
}
