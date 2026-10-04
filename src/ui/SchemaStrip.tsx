import React from 'react';
import { View } from 'react-native';
import { HELSAETNING_FIELDS, LEDSAETNING_FIELDS, type FieldId } from '../grammar/fields';
import type { FieldHueKey } from '../theme';
import { Txt } from './primitives';
import { useTheme } from './theme';

/**
 * The sætningsskema as a single row of slots, with the fields a rule governs
 * lit in their own hue and the rest left as empty outlines. It is the app's
 * signature: the same slot colours the trainer and rule cards use, so "the
 * blue one" means the finite verb everywhere — including on the home screen.
 *
 * A rule that involves the subordinator is drawn on the subordinate-clause
 * topology; everything else on the main clause.
 */
export function SchemaStrip({ fields, size = 'lg' }: { fields: FieldId[]; size?: 'sm' | 'lg' }) {
  const t = useTheme();
  const topology = fields.includes('konjunktional') ? LEDSAETNING_FIELDS : HELSAETNING_FIELDS;
  const lit = new Set(fields);
  const h = size === 'lg' ? 44 : 18;
  const gap = size === 'lg' ? 4 : 2;

  return (
    <View
      style={{ flexDirection: 'row', gap }}
      accessibilityLabel={`Sentence schema, ${topology.filter((f) => lit.has(f.id)).map((f) => f.name).join(', ')} highlighted`}
    >
      {topology.map((f) => {
        const on = lit.has(f.id);
        const hue = t.field(f.id as FieldHueKey);
        return (
          <View
            key={f.id}
            style={{
              flex: f.id === 'forfelt' || f.id === 'konjunktional' ? 1.4 : 1,
              height: h,
              borderRadius: size === 'lg' ? t.radius.sm : 3,
              borderWidth: on ? 0 : 1,
              borderColor: t.c.borderStrong,
              backgroundColor: on ? hue : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {size === 'lg' ? (
              <Txt
                variant="heading"
                color={on ? (t.mode === 'dark' ? '#111317' : '#FFFFFF') : t.c.textFaint}
                style={{ fontSize: 16 }}
              >
                {f.abbr}
              </Txt>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
