import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { fontFamilyFor } from '../theme';
import { useTheme } from './theme';

/**
 * Resolve a text style to the right font file. Each weight of the app face is
 * its own family on native, so fontWeight/fontStyle are folded into
 * fontFamily and then dropped — otherwise web would fake-bold a bold file.
 */
export function withFont(style: StyleProp<TextStyle>): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  const { fontWeight, fontStyle, ...rest } = flat;
  return { ...rest, fontFamily: fontFamilyFor(fontWeight, fontStyle === 'italic') };
}

export function Card({
  children,
  style,
  tone = 'surface',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'sunken' | 'accent' | 'success' | 'warning';
}) {
  const t = useTheme();
  const bg =
    tone === 'sunken'
      ? t.c.surfaceSunken
      : tone === 'accent'
        ? t.c.accentSoft
        : tone === 'success'
          ? t.c.successSoft
          : tone === 'warning'
            ? t.c.warningSoft
            : t.c.surface;
  const border =
    tone === 'accent'
      ? t.c.accent
      : tone === 'success'
        ? t.c.success
        : tone === 'warning'
          ? t.c.warning
          : t.c.border;

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: t.radius.lg,
          borderWidth: 1,
          borderColor: tone === 'surface' || tone === 'sunken' ? border : border + '55',
          padding: t.space(4),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Txt({
  children,
  variant = 'body',
  color,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  variant?: keyof ReturnType<typeof useTheme>['font'];
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={withFont([t.font[variant] as TextStyle, { color: color ?? t.c.text }, style])}
    >
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'ghost' | 'success';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg =
    tone === 'ghost' ? 'transparent' : tone === 'success' ? t.c.success : t.c.accent;
  const fg = tone === 'ghost' ? t.c.text : '#fff';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: t.radius.md,
          borderWidth: tone === 'ghost' ? 1 : 0,
          borderColor: t.c.borderStrong,
          paddingVertical: t.space(3.5),
          paddingHorizontal: t.space(5),
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={withFont({ color: fg, fontSize: 16, fontWeight: '700' })}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Small sentence-case section label. */
export function Label({ children, color }: { children: React.ReactNode; color?: string }) {
  const t = useTheme();
  return <Text style={withFont([t.font.label, { color: color ?? t.c.textMuted }])}>{children}</Text>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.c.border, marginVertical: t.space(4) }} />;
}

/** Horizontal strength meter used across the grammar map. */
export function StrengthBar({ value, color }: { value: number; color: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor: t.c.surfaceSunken,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          // A sliver for any progress at all, but truly empty at zero so an
          // untouched trainer doesn't look like it has started.
          width: value > 0 ? `${Math.max(3, Math.min(100, value * 100))}%` : 0,
          height: '100%',
          backgroundColor: color,
          borderRadius: 3,
        }}
      />
    </View>
  );
}

export const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});

/**
 * A grouped list: one sheet, rows divided by hairlines. Used for hub screens
 * (Practise, Exam, Progress) so a list of destinations reads as one list, not
 * a stack of separate cards competing for attention.
 */
export function ListGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  const t = useTheme();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: t.space(2) }}>
      {title ? (
        <Txt variant="heading" color={t.c.textMuted} style={{ paddingHorizontal: t.space(1) }}>
          {title}
        </Txt>
      ) : null}
      <View
        style={{
          backgroundColor: t.c.surface,
          borderRadius: t.radius.lg,
          borderWidth: 1,
          borderColor: t.c.border,
          overflow: 'hidden',
        }}
      >
        {rows.map((row, i) => (
          <View key={i} style={i > 0 ? { borderTopWidth: 1, borderTopColor: t.c.border } : undefined}>
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

/** A tappable row in a ListGroup: title, optional detail line, optional trailing meta. */
export function ListRow({
  title,
  detail,
  meta,
  metaColor,
  onPress,
  children,
  accessibilityLabel,
}: {
  title: string;
  detail?: string;
  meta?: string;
  metaColor?: string;
  onPress: () => void;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: t.space(4),
        paddingVertical: t.space(3.5),
        backgroundColor: pressed ? t.c.surfaceSunken : 'transparent',
      })}
    >
      <View style={[s.row, { gap: t.space(3) }]}>
        <View style={{ flex: 1 }}>
          <Txt variant="heading">{title}</Txt>
          {detail ? (
            <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 14, lineHeight: 20, marginTop: 2 }}>
              {detail}
            </Txt>
          ) : null}
        </View>
        {meta ? (
          <Txt variant="label" color={metaColor ?? t.c.textFaint}>
            {meta}
          </Txt>
        ) : null}
        <Txt variant="title" color={t.c.textFaint} style={{ fontSize: 20, lineHeight: 22 }}>
          ›
        </Txt>
      </View>
      {children ? <View style={{ marginTop: t.space(2.5) }}>{children}</View> : null}
    </Pressable>
  );
}
