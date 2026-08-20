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
import { useTheme } from './theme';

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
      style={[t.font[variant] as TextStyle, { color: color ?? t.c.text }, style]}
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
        <Text style={{ color: fg, fontSize: 15, fontWeight: '700' }}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Small uppercase field/section label. */
export function Label({ children, color }: { children: React.ReactNode; color?: string }) {
  const t = useTheme();
  return (
    <Text style={[t.font.label, { color: color ?? t.c.textFaint, textTransform: 'uppercase' }]}>
      {children}
    </Text>
  );
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
          width: `${Math.max(3, Math.min(100, value * 100))}%`,
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
