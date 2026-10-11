import React, { useState } from 'react';
import { Pressable, View, type TextInput, type ViewStyle } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { fieldsFor, type FieldId } from '../grammar/fields';
import type { TypedFields } from '../grammar/typedAnswer';
import type { Exercise, Placement } from '../grammar/types';
import type { FieldHueKey } from '../theme';
import { AnswerInput, type Selection } from './AnswerInput';
import { Label, Txt, s } from './primitives';
import { useTheme } from './theme';

/**
 * The sætningsskema: one row per field, or one column per field.
 *
 * Rows on a phone, where the textbook's seven columns would collapse to
 * unreadable slivers; the vertical order still carries the information that
 * matters — top to bottom IS left to right in the sentence. On a wide screen,
 * the textbook's columns after all (`columns`): the board then takes one line
 * instead of a whole screen, and the task, the board and the feedback all fit
 * in view together. The live preview above the board reads the arrangement
 * back as a sentence either way.
 *
 * Two ways to answer (see `AnswerMode` in settings). Typing: each field is a
 * text box, closer to what the exam asks and quick with a keyboard. Tapping:
 * tap a word in the tray, then its field — quicker on a phone, where the
 * keyboard would cover half the board. Never drag: moving a word across seven
 * narrow targets is a dexterity test, not a grammar test, and unusable with a
 * screen reader. Once checked, each field shows its words as chips, so errors
 * can be marked on the words.
 */

/** Narrowest a column may be before the board breaks onto two lines. */
const MIN_COLUMN_WIDTH = 180;

export interface SchemaBoardProps {
  exercise: Exercise;
  /** Typed words into text boxes, or tapped a word and then its field. */
  mode: 'tap' | 'type';
  /** What has been typed into each field. */
  typed: TypedFields;
  onType: (field: FieldId, text: string) => void;
  /** Tapping: the word picked up from the tray, if any. */
  selectedToken?: string | null;
  onPlace?: (field: FieldId) => void;
  onRemove?: (tokenId: string) => void;
  /** Where the words are: tapped there, or the typed words resolved to tokens. */
  placement: Placement;
  inputRef?: (field: FieldId, el: TextInput | null) => void;
  onFocusField?: (field: FieldId) => void;
  onSelect?: (field: FieldId, sel: Selection) => void;
  /** Return pressed in a field: move on to the next, or check after the last. */
  onSubmitField?: (field: FieldId) => void;
  /** Fields to highlight — set while showing a diagnosis. */
  highlight?: FieldId[];
  /** Tokens to mark as implicated in an error. */
  errorTokens?: string[];
  /** Swaps the text boxes for the checked words. */
  locked?: boolean;
  /** Reveals the answer key alongside the learner's attempt. */
  revealSolution?: boolean;
  /** Fields side by side, left to right, as the textbook draws the schema — for a wide screen. */
  columns?: boolean;
}

export function SchemaBoard({
  exercise,
  mode,
  typed,
  onType,
  selectedToken,
  onPlace,
  onRemove,
  placement,
  inputRef,
  onFocusField,
  onSelect,
  onSubmitField,
  highlight = [],
  errorTokens = [],
  locked = false,
  revealSolution = false,
  columns = false,
}: SchemaBoardProps) {
  const t = useTheme();
  const fields = fieldsFor(exercise.clause);
  const tap = mode === 'tap';

  // Columns: all fields on one line when each gets a readable width, else
  // two lines of equal boxes (4 + 3) — never slivers a chip spills out of.
  const [boardWidth, setBoardWidth] = useState(0);
  const gap = t.space(1.5);
  const perLine =
    (boardWidth - gap * (fields.length - 1)) / fields.length >= MIN_COLUMN_WIDTH
      ? fields.length
      : Math.ceil(fields.length / 2);
  const columnWidth = boardWidth ? (boardWidth - gap * (perLine - 1)) / perLine : 0;

  return (
    <View
      onLayout={columns ? (e) => setBoardWidth(e.nativeEvent.layout.width) : undefined}
      style={columns ? { flexDirection: 'row', flexWrap: 'wrap', gap } : { gap: t.space(2) }}
    >
      {fields.map((f, i) => {
        const hue = t.field(f.id as FieldHueKey);
        const ids = placement[f.id] ?? [];
        const isHighlighted = highlight.includes(f.id);
        const canAccept = tap && !locked && selectedToken != null && ids.length < f.capacity;
        const solutionIds = revealSolution ? (exercise.solution[f.id] ?? []) : [];
        const differs =
          revealSolution &&
          (solutionIds.join(',') !== ids.join(','));

        return (
          <Animated.View
            key={f.id}
            layout={LinearTransition.duration(220)}
            style={{
              flexDirection: columns ? 'column' : 'row',
              alignItems: 'stretch',
              ...(columns ? (columnWidth ? { width: columnWidth } : { flex: 1, minWidth: 0 }) : null),
              borderRadius: t.radius.md,
              overflow: 'hidden',
              borderWidth: isHighlighted ? 2 : 1,
              borderColor: isHighlighted ? hue : t.c.border,
              backgroundColor: isHighlighted ? hue + '12' : t.c.surface,
            }}
          >
            {/* Field identity — the colour is the mnemonic. A rail on the
                left of a row; the head of a column, with the name and gloss. */}
            {columns ? (
              <View
                style={{
                  backgroundColor: hue + (t.mode === 'dark' ? '26' : '16'),
                  borderBottomWidth: 1,
                  borderBottomColor: hue + '33',
                  paddingVertical: t.space(1.5),
                  paddingHorizontal: t.space(2),
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space(1.5) }}>
                  <Txt variant="heading" color={hue}>
                    {f.abbr}
                  </Txt>
                  <Txt variant="label" color={hue} style={{ flexShrink: 1 }} numberOfLines={1}>
                    {f.name}
                  </Txt>
                </View>
                <Txt variant="label" color={t.c.textFaint} style={{ fontSize: 12, lineHeight: 15 }} numberOfLines={1}>
                  {f.optional ? f.gloss + ' · optional' : f.gloss}
                </Txt>
              </View>
            ) : (
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
            )}

            {/* Slot. Typing: a text box. Tapping: while a word is picked up
                the whole slot is the drop target and the chips inside are
                inert; with nothing picked up the slot is inert and the chips
                are the buttons — never both, since a pressable inside a
                pressable is an invalid nested button and traps screen-reader
                focus. Once checked: the words given, as chips, so errors can
                be marked on them. */}
            <SlotContainer
              pressable={canAccept}
              onPress={() => onPlace?.(f.id)}
              label={`${f.name}. ${f.gloss}. ${
                ids.length ? 'Contains ' + ids.map((id) => tokenText(exercise, id)).join(', ') : 'Empty'
              }${canAccept ? '. Tap to place the selected word here' : ''}`}
              style={{
                flex: 1,
                paddingVertical: columns ? t.space(2) : t.space(2.5),
                paddingHorizontal: columns ? t.space(2) : t.space(3),
                justifyContent: columns ? 'flex-start' : 'center',
                backgroundColor: canAccept ? hue + '0E' : 'transparent',
              }}
            >
              {columns ? null : (
                <View style={[s.rowBetween, { marginBottom: tap && !locked && !ids.length && !canAccept ? 0 : t.space(1.5) }]}>
                  <Label color={hue}>{f.name}</Label>
                  {canAccept ? (
                    <Txt variant="label" color={hue}>
                      TAP TO PLACE
                    </Txt>
                  ) : null}
                </View>
              )}

              {!locked && !tap ? (
                <AnswerInput
                  ref={(el) => inputRef?.(f.id, el)}
                  value={typed[f.id] ?? ''}
                  onChangeText={(text) => onType(f.id, text)}
                  onFocus={() => onFocusField?.(f.id)}
                  onSelectionChange={(e) => onSelect?.(f.id, e.nativeEvent.selection)}
                  onSubmitEditing={() => onSubmitField?.(f.id)}
                  submitBehavior={i === fields.length - 1 ? 'blurAndSubmit' : 'submit'}
                  returnKeyType={i === fields.length - 1 ? 'done' : 'next'}
                  placeholder={columns ? undefined : f.optional ? f.gloss + ' — may stay empty' : f.gloss}
                  accessibilityLabel={`${f.name}. ${f.gloss}`}
                  style={{ paddingVertical: t.space(2), paddingHorizontal: columns ? t.space(2) : t.space(3), fontSize: 16 }}
                />
              ) : ids.length ? (
                <View style={[s.wrap, { gap: t.space(1.5) }]}>
                  {ids.map((id) => (
                    <PlacedChip
                      key={id}
                      label={tokenText(exercise, id)}
                      hue={hue}
                      error={errorTokens.includes(id)}
                      // Tap a placed word to send it back — not while the slot itself is the target.
                      onPress={tap && !locked && !canAccept ? () => onRemove?.(id) : undefined}
                    />
                  ))}
                </View>
              ) : (
                <Txt variant="body" color={canAccept ? hue : t.c.textFaint} style={{ fontSize: 13 }}>
                  {columns ? (canAccept ? 'Tap to place' : '—') : f.optional ? f.gloss + ' — may stay empty' : f.gloss}
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

function PlacedChip({
  label,
  hue,
  error,
  onPress,
}: {
  label: string;
  hue: string;
  error?: boolean;
  /** Set when the chip can be tapped back to the tray. */
  onPress?: () => void;
}) {
  const t = useTheme();
  const box = {
        backgroundColor: error ? t.c.accentSoft : hue,
        borderWidth: error ? 1.5 : 0,
        borderColor: t.c.accent,
        borderRadius: t.radius.sm,
        paddingVertical: t.space(1.5),
        paddingHorizontal: t.space(2.5),
    // A long chip ("hvis det regner") wraps inside a narrow column, not past its edge.
    maxWidth: '100%' as const,
  };
  const text = (
    <Txt variant="chip" color={error ? t.c.accent : '#fff'} style={{ flexShrink: 1 }}>
      {label}
    </Txt>
  );

  // Without onPress a plain View, not a disabled button: a disabled <button>
  // still nests inside the slot's button on web and is announced as a control
  // the learner cannot use.
  if (!onPress) {
    return (
      <Animated.View entering={FadeIn.duration(160)} style={box}>
        {text}
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={FadeIn.duration(160)} style={{ maxWidth: '100%' }}>
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
  style: ViewStyle;
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

/** Tapping: the words not yet placed. Tap one to pick it up, then tap its field. */
export function TapTray({
  exercise,
  tokenIds,
  selected,
  onSelect,
}: {
  exercise: Exercise;
  tokenIds: string[];
  selected: string | null;
  onSelect: (id: string) => void;
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
          Every word is placed. Check your answer.
        </Txt>
      </View>
    );
  }

  return (
    <View style={[s.wrap, { gap: t.space(2) }]}>
      {tokenIds.map((id) => {
        const isSel = selected === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: isSel }}
            accessibilityLabel={`${tokenText(exercise, id)}${isSel ? ', selected' : ', tap to pick up'}`}
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
  );
}

/**
 * The sentence's words, beneath the board: a reference to type from, not
 * buttons. A word fades once it has been typed into a field.
 */
export function WordTray({ exercise, usedIds }: { exercise: Exercise; usedIds: Set<string> }) {
  const t = useTheme();
  return (
    <View style={[s.wrap, { gap: t.space(2) }]}>
      {exercise.tokens.map((tok) => {
        const used = usedIds.has(tok.id);
        return (
          <View
            key={tok.id}
            accessibilityLabel={`${tok.text}${used ? ', used' : ''}`}
            style={{
              backgroundColor: used ? 'transparent' : t.c.surface,
              borderWidth: 1.5,
              borderStyle: used ? 'dashed' : 'solid',
              borderColor: used ? t.c.border : t.c.borderStrong,
              borderRadius: t.radius.md,
              paddingVertical: t.space(2),
              paddingHorizontal: t.space(3),
            }}
          >
            <Txt
              variant="chip"
              color={used ? t.c.textFaint : t.c.text}
              style={{ textDecorationLine: used ? 'line-through' : 'none' }}
            >
              {tok.text}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

function tokenText(ex: Exercise, id: string): string {
  return ex.tokens.find((t) => t.id === id)?.text ?? id;
}
