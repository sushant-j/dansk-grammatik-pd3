import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { fieldsFor, type FieldId } from '../grammar/fields';
import type { Exercise, Placement } from '../grammar/types';
import type { FieldHueKey } from '../theme';
import { Label, Txt, s } from './primitives';
import { useTheme } from './theme';

/**
 * The sætningsskema, rendered as one row per field.
 *
 * Rows rather than the textbook's columns: on a phone, seven columns collapse
 * to unreadable slivers, and the vertical order still carries the information
 * that matters — top to bottom IS left to right in the sentence. The live
 * preview above the board closes that loop by reading the arrangement back as
 * a sentence.
 *
 * Placement is tap-to-place, not drag. Dragging a word across seven narrow
 * targets on a 390pt screen is a dexterity test, not a grammar test, and it is
 * unusable with a screen reader.
 */

export interface SchemaBoardProps {
  exercise: Exercise;
  placement: Placement;
  /** Token currently picked up from the tray, if any. */
  selectedToken: string | null;
  onPlace: (field: FieldId) => void;
  onRemove: (tokenId: string) => void;
  /** Fields to highlight — set while showing a diagnosis. */
  highlight?: FieldId[];
  /** Tokens to mark as implicated in an error. */
  errorTokens?: string[];
  /** Locks interaction once the answer is checked. */
  locked?: boolean;
  /** Reveals the answer key alongside the learner's attempt. */
  revealSolution?: boolean;
}

export function SchemaBoard({
  exercise,
  placement,
  selectedToken,
  onPlace,
  onRemove,
  highlight = [],
  errorTokens = [],
  locked = false,
  revealSolution = false,
}: SchemaBoardProps) {
  const t = useTheme();
  const fields = fieldsFor(exercise.clause);

  return (
    <View style={{ gap: t.space(2) }}>
      {fields.map((f) => {
        const hue = t.field(f.id as FieldHueKey);
        const ids = placement[f.id] ?? [];
        const isHighlighted = highlight.includes(f.id);
        const canAccept = !locked && selectedToken !== null && ids.length < f.capacity;
        const solutionIds = revealSolution ? (exercise.solution[f.id] ?? []) : [];
        const differs =
          revealSolution &&
          (solutionIds.join(',') !== ids.join(','));

        return (
          <Animated.View
            key={f.id}
            layout={LinearTransition.duration(220)}
            style={{
              flexDirection: 'row',
              alignItems: 'stretch',
              borderRadius: t.radius.md,
              overflow: 'hidden',
              borderWidth: isHighlighted ? 2 : 1,
              borderColor: isHighlighted ? hue : t.c.border,
              backgroundColor: isHighlighted ? hue + '12' : t.c.surface,
            }}
          >
            {/* Field identity rail — the colour is the mnemonic. */}
            <View
              style={{
                width: 62,
                backgroundColor: hue + (t.mode === 'dark' ? '26' : '16'),
                borderRightWidth: 1,
                borderRightColor: hue + '33',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: t.space(2.5),
              }}
            >
              <Txt variant="title" color={hue} style={{ lineHeight: 24 }}>
                {f.abbr}
              </Txt>
            </View>

            {/* Slot.
                While a word is picked up, the whole slot is the drop target and
                the chips inside are inert; with nothing picked up, the slot is
                inert and the chips are the buttons. Never both at once — a
                pressable inside a pressable is an invalid nested button and
                traps screen-reader focus. */}
            <SlotContainer
              pressable={canAccept}
              onPress={() => onPlace(f.id)}
              label={`${f.name}. ${f.gloss}. ${
                ids.length
                  ? 'Contains ' + ids.map((i) => tokenText(exercise, i)).join(', ')
                  : 'Empty'
              }${canAccept ? '. Tap to place the selected word here' : ''}`}
              style={{
                flex: 1,
                paddingVertical: t.space(2.5),
                paddingHorizontal: t.space(3),
                justifyContent: 'center',
                backgroundColor: canAccept ? hue + '0E' : 'transparent',
              }}
            >
              <View style={[s.rowBetween, { marginBottom: ids.length ? t.space(1.5) : 0 }]}>
                <Label color={hue}>{f.name}</Label>
                {canAccept ? (
                  <Txt variant="label" color={hue}>
                    TAP TO PLACE
                  </Txt>
                ) : null}
              </View>

              {ids.length ? (
                <View style={[s.wrap, { gap: t.space(1.5) }]}>
                  {ids.map((id) => (
                    <PlacedChip
                      key={id}
                      label={tokenText(exercise, id)}
                      hue={hue}
                      error={errorTokens.includes(id)}
                      /* Inert while the slot itself is the drop target. */
                      locked={locked || canAccept}
                      onPress={() => !locked && onRemove(id)}
                    />
                  ))}
                </View>
              ) : (
                <Txt variant="body" color={t.c.textFaint} style={{ fontSize: 13 }}>
                  {f.optional ? f.gloss + ' — may stay empty' : f.gloss}
                </Txt>
              )}

              {differs ? (
                <View style={{ marginTop: t.space(1.5) }}>
                  <Txt variant="label" color={t.c.success}>
                    {solutionIds.length
                      ? 'ANSWER: ' + solutionIds.map((i) => tokenText(exercise, i)).join(' ')
                      : 'ANSWER: EMPTY'}
                  </Txt>
                </View>
              ) : null}
            </SlotContainer>
          </Animated.View>
        );
      })}
    </View>
  );
}

/**
 * Renders as a Pressable only when it is actually actionable, and as a plain
 * View otherwise, so the tree never nests one button inside another.
 */
function SlotContainer({
  pressable,
  onPress,
  label,
  style,
  children,
}: {
  pressable: boolean;
  onPress: () => void;
  label: string;
  style: object;
  children: React.ReactNode;
}) {
  if (!pressable) {
    return (
      <View accessibilityLabel={label} style={style}>
        {children}
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={style}>
      {children}
    </Pressable>
  );
}

function PlacedChip({
  label,
  hue,
  error,
  locked,
  onPress,
}: {
  label: string;
  hue: string;
  error?: boolean;
  locked?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const box = {
    backgroundColor: error ? t.c.accentSoft : hue,
    borderWidth: error ? 1.5 : 0,
    borderColor: t.c.accent,
    borderRadius: t.radius.sm,
    paddingVertical: t.space(1.5),
    paddingHorizontal: t.space(2.5),
  };
  const text = (
    <Txt variant="chip" color={error ? t.c.accent : '#fff'}>
      {label}
    </Txt>
  );

  // A locked chip is a plain View, not a disabled button: a disabled <button>
  // still nests inside the slot's button on web and is announced as a control
  // the learner cannot use.
  if (locked) {
    return (
      <Animated.View entering={FadeIn.duration(160)} style={box}>
        {text}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(160)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, tap to remove`}
        onPress={onPress}
        style={({ pressed }) => ({ ...box, opacity: pressed ? 0.75 : 1 })}
      >
        {text}
      </Pressable>
    </Animated.View>
  );
}

/** The unplaced words, shown as a tray beneath the board. */
export function WordTray({
  exercise,
  tokenIds,
  selected,
  onSelect,
  locked,
}: {
  exercise: Exercise;
  tokenIds: string[];
  selected: string | null;
  onSelect: (id: string) => void;
  locked?: boolean;
}) {
  const t = useTheme();

  if (!tokenIds.length) {
    return (
      <View
        style={{
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: t.c.border,
          borderRadius: t.radius.md,
          padding: t.space(4),
          alignItems: 'center',
        }}
      >
        <Txt variant="body" color={t.c.textMuted}>
          Every word is placed. Check your answer below.
        </Txt>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[s.row, { gap: t.space(2), paddingVertical: t.space(1) }]}>
        {tokenIds.map((id) => {
          const isSel = selected === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel }}
              accessibilityLabel={`${tokenText(exercise, id)}${isSel ? ', selected' : ', tap to pick up'}`}
              disabled={locked}
              onPress={() => onSelect(id)}
              style={({ pressed }) => ({
                backgroundColor: isSel ? t.c.text : t.c.surface,
                borderWidth: 1.5,
                borderColor: isSel ? t.c.text : t.c.borderStrong,
                borderRadius: t.radius.md,
                paddingVertical: t.space(2.5),
                paddingHorizontal: t.space(3.5),
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Txt variant="chip" color={isSel ? t.c.bg : t.c.text}>
                {tokenText(exercise, id)}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function tokenText(ex: Exercise, id: string): string {
  return ex.tokens.find((t) => t.id === id)?.text ?? id;
}
