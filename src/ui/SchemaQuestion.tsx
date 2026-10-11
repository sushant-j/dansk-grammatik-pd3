import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { evaluate, renderSentence, trayTokens } from '../grammar/analyze';
import { fieldsFor, type FieldId } from '../grammar/fields';
import { RULES } from '../grammar/rules';
import { placementFromTyped, type TypedFields } from '../grammar/typedAnswer';
import type { Evaluation, Exercise, Placement } from '../grammar/types';
import { DanishKeys, insertAt, type Selection } from './AnswerInput';
import { LevelBadge } from './LevelBadge';
import { ModeSwitch } from './ModeSwitch';
import { SchemaBoard, TapTray, WordTray } from './SchemaBoard';
import { Button, Card, Label, Txt, s } from './primitives';
import { useTheme } from './theme';
import { useAnswerMode, useWide } from './useWide';

/**
 * One word-order exercise on the schema board: type or tap the words into
 * their fields (see `AnswerMode`), check, read
 * the diagnosis. Checking never just says "wrong": it names the rule, explains
 * the mechanism, and links to the full rule card.
 *
 * Holds its own board state, so give it a `key` per exercise. The caller
 * records the answer (`onChecked`) and decides what Next does.
 */
export function SchemaQuestion({
  exercise,
  onChecked,
  onNext,
  nextLabel = 'Next sentence',
  allowRetry = true,
  tag,
}: {
  exercise: Exercise;
  /** Called once per check, with the rules actually broken. */
  onChecked: (evaluation: Evaluation, violated: string[]) => void;
  onNext: () => void;
  nextLabel?: string;
  /** Offer "Try this sentence again" after a wrong answer (not in a scored session). */
  allowRetry?: boolean;
  /** An extra chip above the task, e.g. "Review · …". */
  tag?: string;
}) {
  const t = useTheme();
  const router = useRouter();
  const { wide, onLayout } = useWide();
  const { mode, switchMode } = useAnswerMode(wide);
  const tap = mode === 'tap';

  // Each mode keeps its own answer, so switching mid-sentence loses nothing.
  const [typed, setTyped] = useState<TypedFields>({});
  const [tapPlacement, setTapPlacement] = useState<Placement>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [revealed, setRevealed] = useState(false);
  // Where the æ ø å keys type: the field last focused, at its cursor.
  const [focused, setFocused] = useState<FieldId | null>(null);
  const selections = useRef<Partial<Record<FieldId, Selection>>>({});
  const inputs = useRef<Partial<Record<FieldId, TextInput | null>>>({});

  const fields = fieldsFor(exercise.clause);
  const fromTyped = useMemo(() => placementFromTyped(exercise, typed), [exercise, typed]);
  const placement = tap ? tapPlacement : fromTyped.placement;
  const unknown = tap ? [] : fromTyped.unknown;
  const missing = useMemo(
    () => (tap ? trayTokens(exercise, tapPlacement) : fromTyped.missing),
    [tap, exercise, tapPlacement, fromTyped],
  );
  const usedIds = useMemo(() => new Set(Object.values(placement).flat()), [placement]);
  const ready = !unknown.length && !missing.length;
  const preview = renderSentence(exercise, placement);

  const type = useCallback((field: FieldId, text: string) => {
    setTyped((cur) => ({ ...cur, [field]: text }));
  }, []);

  const place = useCallback(
    (field: FieldId) => {
      if (!selected) return;
      setTapPlacement((p) => {
        const next: Placement = { ...p };
        for (const key of Object.keys(next) as FieldId[]) {
          next[key] = (next[key] ?? []).filter((id) => id !== selected);
        }
        next[field] = [...(next[field] ?? []), selected];
        return next;
      });
      setSelected(null);
    },
    [selected],
  );

  const remove = useCallback((tokenId: string) => {
    setTapPlacement((p) => {
      const next: Placement = { ...p };
      for (const key of Object.keys(next) as FieldId[]) {
        next[key] = (next[key] ?? []).filter((id) => id !== tokenId);
      }
      return next;
    });
    setSelected(null);
  }, []);

  const check = useCallback(() => {
    if (!ready) return;
    const evaluation = evaluate(exercise, placement);
    setResult(evaluation);
    onChecked(evaluation, [...new Set(evaluation.diagnoses.map((d) => d.ruleId))]);
  }, [exercise, placement, ready, onChecked]);

  const submitField = useCallback(
    (field: FieldId) => {
      const i = fields.findIndex((f) => f.id === field);
      const next = fields[i + 1];
      if (next) inputs.current[next.id]?.focus();
      else check();
    },
    [fields, check],
  );

  const insert = useCallback(
    (ch: string) => {
      const field = focused ?? fields[0].id;
      const next = insertAt(typed[field] ?? '', selections.current[field], ch);
      type(field, next.value);
      selections.current[field] = next.sel;
      const el = inputs.current[field];
      el?.focus();
      requestAnimationFrame(() => el?.setSelection?.(next.sel.start, next.sel.end));
    },
    [focused, fields, typed, type],
  );

  const highlight = result?.diagnoses.flatMap((d) => d.fields) ?? [];
  const errorTokens = result?.diagnoses.flatMap((d) => d.tokenIds) ?? [];

  // ── The parts, laid out below: stacked on a phone; on a wide screen the
  // task beside its preview, the board as columns, and the words (or the
  // feedback) beside the controls (or the diagnoses), so nothing that matters
  // to the current step is below the fold.

  const task = (
    <Card tone="sunken" style={wide ? { flex: 1 } : undefined}>
      <View style={s.rowBetween}>
        <Label>
          {exercise.clause === 'helsætning' ? 'Main clause' : 'Subordinate clause'} ·{' '}
          {exercise.exams.join(' · ')}
        </Label>
        <LevelBadge level={exercise.level} />
      </View>
      <Txt variant="title" style={{ marginTop: t.space(2.5) }}>
        {exercise.gloss}
      </Txt>
      <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
        {`${tap ? 'Place' : 'Write'} each word in its field. The schema order, ${
          wide ? 'left to right' : 'top to bottom'
        }, is the sentence order.`}
      </Txt>
    </Card>
  );

  const readsAs = (
    <View
      style={{
        borderLeftWidth: 3,
        borderLeftColor: preview ? t.c.accent : t.c.border,
        paddingLeft: t.space(3),
        paddingVertical: t.space(1),
        ...(wide ? { flex: 1, justifyContent: 'center' as const } : null),
      }}
    >
      <Label>Reads as</Label>
      <Txt
        variant="title"
        color={preview ? t.c.text : t.c.textFaint}
        style={{ marginTop: t.space(1), fontSize: 19 }}
      >
        {preview || '…'}
      </Txt>
    </View>
  );

  const board = (
    <SchemaBoard
      exercise={exercise}
      mode={mode}
      typed={typed}
      onType={type}
      selectedToken={selected}
      onPlace={place}
      onRemove={remove}
      placement={placement}
      inputRef={(field, el) => {
        inputs.current[field] = el;
      }}
      onFocusField={setFocused}
      onSelect={(field, sel) => {
        selections.current[field] = sel;
      }}
      onSubmitField={submitField}
      highlight={highlight}
      errorTokens={errorTokens}
      locked={!!result}
      revealSolution={revealed}
      columns={wide}
    />
  );

  const words = tap ? (
    <View style={{ gap: t.space(2), ...(wide ? { flex: 1 } : null) }}>
      <Label>{selected ? 'Now tap a field above' : 'Tap a word, then tap its field'}</Label>
      <TapTray
        exercise={exercise}
        tokenIds={missing.map((x) => x.id)}
        selected={selected}
        onSelect={(id) => setSelected((cur) => (cur === id ? null : id))}
      />
    </View>
  ) : (
    <View style={{ gap: t.space(2), ...(wide ? { flex: 1 } : null) }}>
      <View style={[s.rowBetween, { flexWrap: 'wrap', gap: t.space(2) }]}>
        <Label>The words to use</Label>
        {wide ? null : <DanishKeys onInsert={insert} />}
      </View>
      <WordTray exercise={exercise} usedIds={usedIds} />
      {unknown.length ? (
        <Txt variant="body" color={t.c.warning}>
          {`Not one of the words: ${unknown.join(', ')}`}
        </Txt>
      ) : null}
    </View>
  );

  const checkButton = (
    <Button
      label={
        ready
          ? 'Check my answer'
          : unknown.length
            ? 'Some words are not in the list'
            : `${tap ? 'Place' : 'Write'} ${missing.length} more word${missing.length === 1 ? '' : 's'}`
      }
      disabled={!ready}
      onPress={check}
    />
  );

  // No entering animation on the feedback. It is the most important thing on
  // the screen, and reanimated's entering transitions do not reliably settle
  // to full opacity on web — a half-faded explanation is far worse than no
  // flourish.
  const verdict = result ? (
    result.correct ? (
      <Card tone="success">
        <Label color={t.c.success}>
          {result.viaAlternative ? 'Correct — and a valid alternative' : 'Correct'}
        </Label>
        <Txt variant="heading" style={{ marginTop: t.space(2) }}>
          {renderSentence(exercise, placement)}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2) }}>
          {result.viaAlternative
            ? 'Danish allows more than one order here, and you found one of them. ' + exercise.takeaway
            : exercise.takeaway}
        </Txt>
      </Card>
    ) : (
      <Card tone="warning">
        <Label color={t.c.warning}>
          Not yet · {Math.round(result.accuracy * 100)}% of words in the right field
        </Label>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2) }}>
          Your arrangement reads as “{renderSentence(exercise, placement) || '…'}”
        </Txt>
      </Card>
    )
  ) : null;

  const diagnoses = result?.correct
    ? []
    : (result?.diagnoses ?? []).map((d, i) => (
        <Card key={i}>
          <Label color={d.severity === 'error' ? t.c.accent : t.c.textFaint}>{RULES[d.ruleId].da}</Label>
          <Txt variant="body" style={{ marginTop: t.space(2) }}>
            {d.message}
          </Txt>
          <Button
            tone="ghost"
            label={`Read the rule: ${RULES[d.ruleId].da}`}
            onPress={() => router.push(`/rule/${d.ruleId}` as never)}
            style={{ marginTop: t.space(3) }}
          />
        </Card>
      ));

  const actions = result ? (
    <View style={{ gap: t.space(2) }}>
      {!result.correct && !revealed && (
        <Button tone="ghost" label="Show me the answer" onPress={() => setRevealed(true)} />
      )}
      {!result.correct && allowRetry && (
        <Button
          tone="ghost"
          label="Try this sentence again"
          onPress={() => {
            setTyped({});
            setTapPlacement({});
            setSelected(null);
            setResult(null);
            setRevealed(false);
          }}
        />
      )}
      <Button tone={result.correct ? 'success' : 'primary'} label={nextLabel} onPress={onNext} />
    </View>
  ) : null;

  const legend = (
    <Card tone="sunken">
      <Label>The schema for this clause type</Label>
      <View style={{ marginTop: t.space(2.5), gap: t.space(1.5) }}>
        {fieldsFor(exercise.clause).map((f) => (
          <View key={f.id} style={s.row}>
            <Txt variant="heading" color={t.field(f.id as never)} style={{ width: 24 }}>
              {f.abbr}
            </Txt>
            <Txt variant="body" color={t.c.textMuted} style={{ flex: 1, fontSize: 13 }}>
              <Txt variant="body" style={{ fontSize: 13, fontWeight: '600' }}>
                {f.name}
              </Txt>
              {' — ' + f.hint}
            </Txt>
          </View>
        ))}
      </View>
    </Card>
  );

  const tagChip = tag ? (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: t.c.surfaceSunken,
        borderRadius: t.radius.md,
        paddingHorizontal: t.space(2.5),
        paddingVertical: t.space(1),
      }}
    >
      <Txt variant="label" color={t.c.textMuted}>
        {tag}
      </Txt>
    </View>
  ) : null;

  if (!wide) {
    return (
      <View onLayout={onLayout} style={{ gap: t.space(4) }}>
        {tagChip}
        {task}
        {readsAs}
        {board}
        {!result && words}
        {result ? (
          <View style={{ gap: t.space(3) }}>
            {verdict}
            {diagnoses}
            {actions}
          </View>
        ) : (
          <>
            {checkButton}
            <ModeSwitch mode={mode} onSwitch={switchMode} />
          </>
        )}
        {legend}
      </View>
    );
  }

  return (
    <View onLayout={onLayout} style={{ gap: t.space(4) }}>
      {tagChip}
      <View style={{ flexDirection: 'row', gap: t.space(5), alignItems: 'stretch' }}>
        {task}
        {readsAs}
      </View>
      {board}
      {result ? (
        <View style={{ flexDirection: 'row', gap: t.space(5), alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: t.space(3) }}>
            {verdict}
            {actions}
          </View>
          <View style={{ flex: 1, gap: t.space(3) }}>{diagnoses}</View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: t.space(5), alignItems: 'flex-start' }}>
          {words}
          <View style={{ width: 280, gap: t.space(3) }}>
            {tap ? null : <DanishKeys onInsert={insert} />}
            {checkButton}
            <ModeSwitch mode={mode} onSwitch={switchMode} />
          </View>
        </View>
      )}
      {legend}
    </View>
  );
}
