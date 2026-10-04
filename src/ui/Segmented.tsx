import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Txt, s } from './primitives';
import { useTheme } from './theme';

/** A row of pills, one selected: exam switcher, Tekst | Opgaver, 2A · 2B · 3. */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  style,
  compact,
}: {
  options: { key: K; label: string; badge?: string }[];
  value: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={[s.row, { gap: t.space(2) }, style]}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: on ? t.c.accent : t.c.border,
              backgroundColor: on ? t.c.accentSoft : t.c.surface,
              borderRadius: 999,
              paddingVertical: compact ? t.space(1.5) : t.space(2),
              paddingHorizontal: t.space(2),
            }}
          >
            <Txt variant="chip" color={on ? t.c.accent : t.c.textMuted} style={compact ? { fontSize: 14 } : undefined}>
              {o.label}
              {o.badge ? <Txt variant="label" color={t.c.textFaint}>{`  ${o.badge}`}</Txt> : null}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
