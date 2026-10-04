import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../src/ui/Screen';
import { fieldsFor } from '../../src/grammar/fields';
import { RULES, type RuleId } from '../../src/grammar/rules';
import { ruleProgress, useProfile } from '../../src/profile/store';
import { Button, Card, Divider, Label, StrengthBar, Txt, s } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';

/**
 * The rule card — the destination every piece of feedback points at.
 *
 * Structure is deliberate: the rule, then why learners get it wrong, then
 * minimal contrasting pairs. The wrong/right pair is the highest-value element
 * on the page, so it is not buried under prose.
 */
export default function RuleCard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stats = useProfile((st) => st.stats);

  const r = RULES[id as RuleId];

  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bg, padding: t.space(4) }}>
        <Txt variant="title">Unknown rule</Txt>
        <Button tone="ghost" label="Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const p = ruleProgress(stats).find((x) => x.ruleId === r.id)!;
  // Fields this rule constrains, in schema order, for the mini-diagram.
  const helFields = fieldsFor('helsætning');
  const ledFields = fieldsFor('ledsætning');
  const showsBothSchemas = r.id === 'ikke-regel';
  // 'konjunktional' exists only in the subordinate schema. A rule that
  // constrains it (e.g. 'relative-clause') must be diagrammed against
  // ledsætning, not the helsætning default — showing it against helsætning
  // would highlight nothing there and silently mislead the learner about
  // which schema the rule even applies to. Every other rule's fields exist in
  // both schemas or are helsætning-only, so helsætning stays the right default.
  const singleSchemaFields = r.fields.includes('konjunktional') ? ledFields : helFields;

  return (
    <>
      <Stack.Screen options={{ title: r.da }} />
      <Screen
        contentContainerStyle={{
          padding: t.space(4),
          paddingBottom: insets.bottom + t.space(8),
          gap: t.space(4),
        }}
      >
        {/* Danish term leads; the English gloss is a brief caption under it,
            never the headline — mixing which language is "primary" from
            screen to screen is exactly the confusion this layout avoids. */}
        <View>
          <Txt variant="display" style={{ fontSize: 28 }}>
            {r.da}
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1), fontStyle: 'italic' }}>
            {r.en}
          </Txt>
          <Txt variant="title" style={{ marginTop: t.space(3), fontSize: 20 }}>
            {r.statement}
          </Txt>
          <View style={[s.row, { gap: t.space(2), marginTop: t.space(3) }]}>
            <Pill text={r.cefr} />
            {r.exams.map((e) => (
              <Pill key={e} text={e} />
            ))}
          </View>
        </View>

        {/* Mastery */}
        <Card tone="sunken">
          <View style={s.rowBetween}>
            <Label>Your mastery</Label>
            <Txt variant="label" color={t.c.textMuted}>
              {p.attempts ? `${p.attempts} attempt${p.attempts === 1 ? '' : 's'}` : 'Not practised yet'}
            </Txt>
          </View>
          <View style={{ marginTop: t.space(2.5) }}>
            <StrengthBar
              value={p.strength}
              color={p.strength >= 0.7 ? t.c.success : p.strength >= 0.4 ? t.c.warning : t.c.accent}
            />
          </View>
        </Card>

        {/* Explanation */}
        <View>
          <Label>How it works</Label>
          <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 23 }}>
            {r.explanation}
          </Txt>
        </View>

        {/* Schema diagram */}
        <Card>
          <Label>In the schema</Label>
          {showsBothSchemas ? (
            <View style={{ gap: t.space(3), marginTop: t.space(3) }}>
              <SchemaStrip
                title="Helsætning — adverb AFTER the verb"
                fields={helFields.map((f) => f.abbr)}
                ids={helFields.map((f) => f.id)}
                emphasise={['finitVerbum', 'centraladverbial']}
                example="Jeg  kan  ikke  komme"
              />
              <SchemaStrip
                title="Ledsætning — adverb BEFORE the verb"
                fields={ledFields.map((f) => f.abbr)}
                ids={ledFields.map((f) => f.id)}
                emphasise={['centraladverbial', 'finitVerbum']}
                example="fordi  jeg  ikke  kan  komme"
              />
            </View>
          ) : (
            <View style={{ marginTop: t.space(3) }}>
              <SchemaStrip
                title={singleSchemaFields === ledFields ? 'Ledsætning' : 'Helsætning'}
                fields={singleSchemaFields.map((f) => f.abbr)}
                ids={singleSchemaFields.map((f) => f.id)}
                emphasise={r.fields}
              />
            </View>
          )}
        </Card>

        {/* Why it's hard */}
        <Card tone="warning">
          <Label color={t.c.warning}>Why this one is hard</Label>
          <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 23 }}>
            {r.whyHard}
          </Txt>
        </Card>

        <Divider />

        {/* Examples */}
        <Label>Contrasting pairs</Label>
        {r.examples.map((ex, i) => (
          <Card key={i}>
            {ex.wrong ? (
              <View style={{ marginBottom: t.space(2.5) }}>
                <View style={[s.row, { gap: t.space(2) }]}>
                  <Txt variant="heading" color={t.c.accent}>
                    ✕
                  </Txt>
                  <Txt
                    variant="body"
                    color={t.c.textMuted}
                    style={{ flex: 1, textDecorationLine: 'line-through' }}
                  >
                    {ex.wrong}
                  </Txt>
                </View>
              </View>
            ) : null}
            <View style={[s.row, { gap: t.space(2) }]}>
              <Txt variant="heading" color={t.c.success}>
                ✓
              </Txt>
              <Txt variant="heading" style={{ flex: 1 }}>
                {ex.right}
              </Txt>
            </View>
            <Txt
              variant="body"
              color={t.c.textMuted}
              style={{ marginTop: t.space(2.5), fontSize: 14 }}
            >
              {ex.note}
            </Txt>
          </Card>
        ))}

        <Button label="Practise this" onPress={() => router.push('/train')} />
      </Screen>
    </>
  );
}

function Pill({ text }: { text: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.c.border,
        borderRadius: 999,
        paddingHorizontal: t.space(2.5),
        paddingVertical: t.space(1),
      }}
    >
      <Txt variant="label" color={t.c.textMuted}>
        {text}
      </Txt>
    </View>
  );
}

/** A compact left-to-right rendering of the schema, with fields emphasised. */
function SchemaStrip({
  title,
  fields,
  ids,
  emphasise,
  example,
}: {
  title: string;
  fields: string[];
  ids: string[];
  emphasise: string[];
  example?: string;
}) {
  const t = useTheme();
  return (
    <View>
      <Txt variant="label" color={t.c.textMuted}>
        {title}
      </Txt>
      <View style={[s.row, { gap: 4, marginTop: t.space(2) }]}>
        {fields.map((abbr, i) => {
          const on = emphasise.includes(ids[i]);
          const hue = t.field(ids[i] as never);
          return (
            <View
              key={ids[i]}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: t.space(2),
                borderRadius: t.radius.sm,
                backgroundColor: on ? hue : t.c.surfaceSunken,
                borderWidth: 1,
                borderColor: on ? hue : t.c.border,
              }}
            >
              <Txt variant="chip" color={on ? '#fff' : t.c.textFaint} style={{ fontSize: 13 }}>
                {abbr}
              </Txt>
            </View>
          );
        })}
      </View>
      {example ? (
        <Txt variant="body" color={t.c.text} style={{ marginTop: t.space(2), fontSize: 14 }}>
          {example}
        </Txt>
      ) : null}
    </View>
  );
}
