import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import type { Lf1Question } from '../../content/exams/types';
import { matchesKey } from '../../exam/grade';
import { Label, Txt, s, withFont } from '../primitives';
import { useTheme } from '../theme';

export const letterOf = (i: number) => String.fromCharCode(65 + i);

/** What a checked practice item looks like: right/wrong plus what the key says. */
function Verdict({ ok, children }: { ok: boolean; children?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        marginTop: t.space(2),
        padding: t.space(2.5),
        borderRadius: t.radius.sm,
        backgroundColor: ok ? t.c.successSoft : t.c.warningSoft,
      }}
    >
      <Label color={ok ? t.c.success : t.c.warning}>{ok ? 'Correct' : 'Not quite'}</Label>
      {children ? (
        <Txt variant="body" style={{ fontSize: 15, lineHeight: 21, marginTop: 2 }}>
          {children}
        </Txt>
      ) : null}
    </View>
  );
}

function CheckButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        marginTop: t.space(2),
        paddingHorizontal: t.space(3),
        paddingVertical: t.space(1.5),
        borderRadius: 999,
        borderWidth: 1,
        borderColor: t.c.borderStrong,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Txt variant="label" color={t.c.text}>
        Check
      </Txt>
    </Pressable>
  );
}

/** Practice-mode affordance: a Check button, then the verdict once checked. */
export interface PracticeProps {
  practice: boolean;
  checked: boolean;
  onCheck: () => void;
}

export function ItemCard({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.c.surface,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: highlight ? t.c.accent : t.c.border,
        padding: t.space(3.5),
      }}
    >
      {children}
    </View>
  );
}

// ── Læseforståelse 1: short written answers ────────────────────────────────

export function Lf1Item({
  q,
  value,
  onChange,
  practice,
  checked,
  onCheck,
}: { q: Lf1Question; value: string; onChange: (v: string) => void } & PracticeProps) {
  const t = useTheme();
  const ok = !!q.freePoint || matchesKey(value, q.key, q.also);
  return (
    <ItemCard>
      <Txt variant="body" style={{ lineHeight: 23 }}>
        <Txt variant="heading">{`${q.n}.  `}</Txt>
        {q.prompt}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={!checked}
        placeholder="Dit svar"
        placeholderTextColor={t.c.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={`Svar på spørgsmål ${q.n}`}
        style={withFont([
          t.font.body,
          {
            color: t.c.text,
            marginTop: t.space(2.5),
            borderWidth: 1,
            borderColor: t.c.borderStrong,
            borderRadius: t.radius.sm,
            paddingHorizontal: t.space(3),
            paddingVertical: t.space(2),
            backgroundColor: checked ? t.c.surfaceSunken : t.c.bg,
          },
        ])}
      />
      {practice && !checked ? <CheckButton onPress={onCheck} disabled={!value.trim()} /> : null}
      {practice && checked ? (
        <Verdict ok={ok}>
          {`Rettenøgle: ${q.key}`}
          {!ok ? '\nThe key is a guide — if your answer says the same thing, you can count it on the result screen.' : ''}
        </Verdict>
      ) : null}
    </ItemCard>
  );
}

// ── Lettered options (2A, 3 and the old 2B) ───────────────────────────────

export function OptionList({
  options,
  value,
  onSelect,
  correct,
  locked,
  inline,
}: {
  options: string[];
  value: string;
  onSelect: (letter: string) => void;
  /** Shown once revealed: the right letter. */
  correct?: string;
  locked?: boolean;
  /** Short options (single words) sit in a wrapping row. */
  inline?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={inline ? [s.wrap, { gap: t.space(2) }] : { gap: t.space(2) }}>
      {options.map((opt, i) => {
        const letter = letterOf(i);
        const picked = value === letter;
        const isRight = correct === letter;
        const bg = correct ? (isRight ? t.c.successSoft : picked ? t.c.accentSoft : t.c.bg) : picked ? t.c.accentSoft : t.c.bg;
        const border = correct ? (isRight ? t.c.success : picked ? t.c.accent : t.c.border) : picked ? t.c.accent : t.c.border;
        return (
          <Pressable
            key={letter}
            onPress={() => onSelect(letter)}
            disabled={locked}
            accessibilityRole="radio"
            accessibilityState={{ selected: picked }}
            accessibilityLabel={`${letter}: ${opt}`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              gap: t.space(2.5),
              alignItems: inline ? 'center' : 'flex-start',
              backgroundColor: bg,
              borderWidth: 1.5,
              borderColor: border,
              borderRadius: t.radius.sm,
              paddingVertical: t.space(2),
              paddingHorizontal: t.space(3),
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Txt variant="heading" color={picked || isRight ? t.c.text : t.c.textMuted} style={{ fontSize: 15 }}>
              {letter}
            </Txt>
            <Txt variant="body" style={inline ? { fontSize: 15, lineHeight: 21 } : { flex: 1, fontSize: 15, lineHeight: 22 }}>
              {opt}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ChoiceItem({
  number,
  prompt,
  options,
  value,
  onSelect,
  correct,
  practice,
  checked,
  onCheck,
  inline,
  highlight,
  alsoCorrect,
}: {
  alsoCorrect?: string[];
  number: number;
  prompt?: string;
  options: string[];
  value: string;
  onSelect: (letter: string) => void;
  correct: string;
  inline?: boolean;
  highlight?: boolean;
} & PracticeProps) {
  const t = useTheme();
  return (
    <ItemCard highlight={highlight}>
      <Txt variant="body" style={{ lineHeight: 23, marginBottom: t.space(2.5) }}>
        <Txt variant="heading">{prompt ? `${number}.  ` : `Hul ${number}`}</Txt>
        {prompt ?? ''}
      </Txt>
      <OptionList
        options={options}
        value={value}
        onSelect={onSelect}
        locked={checked}
        correct={practice && checked ? correct : undefined}
        inline={inline}
      />
      {practice && !checked ? <CheckButton onPress={onCheck} disabled={!value} /> : null}
      {practice && checked ? (
        <Verdict ok={value === correct || !!alsoCorrect?.includes(value)}>
          {value === correct || alsoCorrect?.includes(value)
            ? alsoCorrect?.length
              ? `Also accepted: ${[correct, ...alsoCorrect].join(', ')}.`
              : null
            : `The answer is ${[correct, ...(alsoCorrect ?? [])].join(' or ')}.`}
        </Verdict>
      ) : null}
    </ItemCard>
  );
}

// ── 2B: put the removed paragraphs back ────────────────────────────────────

export function InsertPicker({
  gap,
  letters,
  value,
  usedElsewhere,
  onSelect,
  correct,
  practice,
  checked,
  onCheck,
  highlight,
}: {
  gap: number;
  letters: string[];
  value: string;
  /** Letters already placed in other gaps: each may be used once. */
  usedElsewhere: Set<string>;
  onSelect: (letter: string) => void;
  correct: string;
  highlight?: boolean;
} & PracticeProps) {
  const t = useTheme();
  return (
    <ItemCard highlight={highlight}>
      <View style={[s.rowBetween, { marginBottom: t.space(2) }]}>
        <Txt variant="heading">{`Hul ${gap}`}</Txt>
        {value ? (
          <Pressable onPress={() => !checked && onSelect('')} accessibilityRole="button" disabled={checked}>
            <Txt variant="label" color={t.c.textFaint}>
              {checked ? '' : 'Clear'}
            </Txt>
          </Pressable>
        ) : null}
      </View>
      <View style={[s.wrap, { gap: t.space(1.5) }]}>
        {letters.map((l) => {
          const on = value === l;
          const taken = usedElsewhere.has(l);
          const reveal = practice && checked;
          const isRight = reveal && l === correct;
          return (
            <Pressable
              key={l}
              onPress={() => onSelect(on ? '' : l)}
              disabled={checked || taken}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, disabled: taken }}
              accessibilityLabel={`Tekstdel ${l}${taken ? ', already used' : ''}`}
              style={{
                minWidth: 40,
                alignItems: 'center',
                paddingVertical: t.space(1.5),
                borderRadius: t.radius.sm,
                borderWidth: 1.5,
                borderColor: isRight ? t.c.success : on ? t.c.accent : t.c.border,
                backgroundColor: isRight ? t.c.successSoft : on ? t.c.accentSoft : t.c.bg,
                opacity: taken && !on ? 0.3 : 1,
              }}
            >
              <Txt variant="heading">{l}</Txt>
            </Pressable>
          );
        })}
      </View>
      {practice && !checked ? <CheckButton onPress={onCheck} disabled={!value} /> : null}
      {practice && checked ? <Verdict ok={value === correct}>{value === correct ? null : `The answer is ${correct}.`}</Verdict> : null}
    </ItemCard>
  );
}
