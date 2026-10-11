import React from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Txt, withFont } from './primitives';
import { useTheme } from './theme';

/**
 * The text box every grammar exercise is answered in, and the æ ø å row that
 * goes with it.
 *
 * Autocorrect, autocapitalisation and the browser's spellchecker are all off:
 * each would "fix" the very form being tested — turn a wrong "spisede" into a
 * right one, or underline every Danish word in red on an English system.
 */

export type Selection = { start: number; end: number };

/** `value` with `ch` typed over the selection, and where the cursor lands after it. */
export function insertAt(value: string, sel: Selection | undefined, ch: string): { value: string; sel: Selection } {
  const start = Math.min(sel?.start ?? value.length, value.length);
  const end = Math.min(sel?.end ?? start, value.length);
  const next = value.slice(0, start) + ch + value.slice(end);
  const at = start + ch.length;
  return { value: next, sel: { start: at, end: at } };
}

export function AnswerInput({
  locked = false,
  tone,
  style,
  ref,
  ...rest
}: TextInputProps & {
  locked?: boolean;
  /** Border colour once checked: right or wrong. */
  tone?: 'success' | 'warning';
  ref?: React.Ref<TextInput>;
}) {
  const t = useTheme();
  const border = tone === 'success' ? t.c.success : tone === 'warning' ? t.c.warning : t.c.borderStrong;
  return (
    <TextInput
      ref={ref}
      editable={!locked}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="off"
      spellCheck={false}
      placeholderTextColor={t.c.textFaint}
      {...rest}
      style={[
        withFont([
          t.font.body,
          {
            color: t.c.text,
            fontSize: 17,
            borderWidth: tone ? 1.5 : 1,
            borderColor: border,
            borderRadius: t.radius.sm,
            paddingHorizontal: t.space(3),
            paddingVertical: t.space(2.5),
            backgroundColor: locked ? t.c.surfaceSunken : t.c.bg,
          },
        ]),
        style,
      ]}
    />
  );
}

/** æ ø å for learners whose keyboard has no Danish layout. */
export function DanishKeys({ onInsert, disabled }: { onInsert: (ch: string) => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: t.space(2) }}>
      {['æ', 'ø', 'å'].map((ch) => (
        <Pressable
          key={ch}
          onPress={() => onInsert(ch)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Type ${ch}`}
          // Keep focus (and the cursor) in the text box on web.
          onPointerDown={(e) => e.preventDefault()}
          style={({ pressed }) => ({
            minWidth: 40,
            alignItems: 'center',
            paddingVertical: t.space(1.5),
            borderRadius: t.radius.sm,
            borderWidth: 1,
            borderColor: t.c.border,
            backgroundColor: t.c.surface,
            opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          })}
        >
          <Txt variant="heading" style={{ fontSize: 17 }}>
            {ch}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}
