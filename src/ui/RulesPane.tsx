import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from './Screen';
import { Button, Label, Txt } from './primitives';
import { useTheme } from './theme';

/** The shape every trainer's rule catalogue shares (RULES, VERB_RULES, NOUN_RULES, …). */
export interface PaneRule {
  id: string;
  da: string;
  en: string;
  statement: string;
  explanation: string;
  examples: { wrong?: string; right: string; note: string }[];
}

/** Wide enough for the 760px practice column and the pane side by side. */
const SIDE_PANE_MIN_WIDTH = 1100;
const PANE_WIDTH = 380;

/**
 * A trainer screen with its rules a glance away.
 *
 * Practising a rule while unsure what the rule *says* turns a drill into
 * guessing, and leaving the trainer to read the rule card loses the flow. So
 * every trainer carries its full rule set, in English: on a wide window as a
 * pane beside the exercise that scrolls on its own (it stays put while the
 * exercise scrolls), on a phone behind a "Rules" button that opens it as a
 * sheet. The rule the current question tests is marked and opened.
 */
export function TrainerScreen({
  rules,
  activeRuleId,
  children,
  ...screenProps
}: ScrollViewProps & { rules: PaneRule[]; activeRuleId?: string }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (width >= SIDE_PANE_MIN_WIDTH) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: t.c.bg }}>
        <Screen {...screenProps}>{children}</Screen>
        <View style={{ width: PANE_WIDTH, borderLeftWidth: 1, borderLeftColor: t.c.border, backgroundColor: t.c.surface }}>
          <RulesList rules={rules} activeRuleId={activeRuleId} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      {/* Extra room at the end so the floating button never covers the last control. */}
      <Screen {...screenProps} contentContainerStyle={[screenProps.contentContainerStyle, { paddingBottom: insets.bottom + t.space(20) }]}>
        {children}
      </Screen>
      <Pressable
        onPress={() => setSheetOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Show the rules"
        style={({ pressed }) => ({
          position: 'absolute',
          right: t.space(4),
          bottom: insets.bottom + t.space(4),
          paddingHorizontal: t.space(4),
          paddingVertical: t.space(2.5),
          borderRadius: 999,
          backgroundColor: t.c.surface,
          borderWidth: 1,
          borderColor: t.c.borderStrong,
          opacity: pressed ? 0.8 : 1,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        })}
      >
        <Txt variant="chip" style={{ fontSize: 15 }}>
          Rules
        </Txt>
      </Pressable>
      <Modal visible={sheetOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSheetOpen(false)}>
        <View style={{ flex: 1, backgroundColor: t.c.surface, paddingTop: insets.top }}>
          <RulesList rules={rules} activeRuleId={activeRuleId} />
          <View style={{ padding: t.space(4), paddingBottom: insets.bottom + t.space(4), borderTopWidth: 1, borderTopColor: t.c.border }}>
            <Button label="Back to practice" tone="ghost" onPress={() => setSheetOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RulesList({ rules, activeRuleId }: { rules: PaneRule[]; activeRuleId?: string }) {
  const t = useTheme();
  const [open, setOpen] = useState<Set<string>>(() => new Set(activeRuleId ? [activeRuleId] : []));

  // A new question on another rule opens that rule too; ones the learner opened stay open.
  useEffect(() => {
    if (activeRuleId) setOpen((cur) => (cur.has(activeRuleId) ? cur : new Set(cur).add(activeRuleId)));
  }, [activeRuleId]);

  const toggle = (id: string) =>
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <ScrollView contentContainerStyle={{ padding: t.space(5), gap: t.space(3) }}>
      <Label color={t.c.textFaint}>THE RULES</Label>
      {rules.map((r) => {
        const active = r.id === activeRuleId;
        const expanded = open.has(r.id);
        return (
          <View
            key={r.id}
            style={{
              borderWidth: 1,
              borderColor: active ? t.c.accent : t.c.border,
              borderRadius: t.radius.md,
              backgroundColor: active ? t.c.accentSoft : t.c.bg,
            }}
          >
            <Pressable
              onPress={() => toggle(r.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              style={{ padding: t.space(3.5), gap: t.space(1) }}
            >
              {active ? <Label color={t.c.accent}>THIS QUESTION</Label> : null}
              <Txt variant="heading">{r.en}</Txt>
              <Txt variant="label" color={t.c.textFaint}>
                {r.da}
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1), fontSize: 15, lineHeight: 22 }}>
                {r.statement}
              </Txt>
              <Txt variant="label" color={t.c.accent} style={{ marginTop: t.space(1) }}>
                {expanded ? 'Show less' : 'Explanation and examples'}
              </Txt>
            </Pressable>
            {expanded ? (
              <View style={{ paddingHorizontal: t.space(3.5), paddingBottom: t.space(3.5), gap: t.space(3) }}>
                <Txt variant="body" style={{ fontSize: 15, lineHeight: 22 }}>
                  {r.explanation}
                </Txt>
                {r.examples.map((ex, i) => (
                  <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: t.c.border, paddingLeft: t.space(3), gap: 2 }}>
                    {ex.wrong ? (
                      <Txt variant="body" color={t.c.textFaint} style={{ fontSize: 15, textDecorationLine: 'line-through' }}>
                        {ex.wrong}
                      </Txt>
                    ) : null}
                    <Txt variant="body" color={t.c.success} style={{ fontSize: 15, fontWeight: '600' }}>
                      {ex.right}
                    </Txt>
                    <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 14, lineHeight: 20 }}>
                      {ex.note}
                    </Txt>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
