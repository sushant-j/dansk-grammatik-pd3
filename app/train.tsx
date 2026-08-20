import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../src/ui/Screen';
import { evaluate, renderSentence, trayTokens } from '../src/grammar/analyze';
import { fieldsFor, type FieldId } from '../src/grammar/fields';
import { RULES } from '../src/grammar/rules';
import type { Evaluation, Exercise, Placement } from '../src/grammar/types';
import { nextExercise, useProfile } from '../src/profile/store';
import { SchemaBoard, WordTray } from '../src/ui/SchemaBoard';
import { Button, Card, Label, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';

/**
 * The trainer.
 *
 * One exercise at a time, chosen by the learner model rather than by a fixed
 * lesson order, so the sentence in front of you is the one your profile says
 * you need. Checking never just says "wrong": it names the rule, explains the
 * mechanism, and links to the full rule card.
 */
export default function Train() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const stats = useProfile((st) => st.stats);
  const seen = useProfile((st) => st.seen);
  const record = useProfile((st) => st.record);

  const [exercise, setExercise] = useState<Exercise>(() => nextExercise(stats, seen));
  const [placement, setPlacement] = useState<Placement>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [revealed, setRevealed] = useState(false);

  const tray = useMemo(() => trayTokens(exercise, placement), [exercise, placement]);
  const allPlaced = tray.length === 0;
  const preview = renderSentence(exercise, placement);

  const place = useCallback(
    (field: FieldId) => {
      if (!selected) return;
      setPlacement((p) => {
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
    setPlacement((p) => {
      const next: Placement = { ...p };
      for (const key of Object.keys(next) as FieldId[]) {
        next[key] = (next[key] ?? []).filter((id) => id !== tokenId);
      }
      return next;
    });
    setSelected(null);
  }, []);

  const check = useCallback(() => {
    const evaluation = evaluate(exercise, placement);
    setResult(evaluation);
    const violated = [...new Set(evaluation.diagnoses.map((d) => d.ruleId))];
    record(exercise, evaluation.correct, violated);
  }, [exercise, placement, record]);

  const advance = useCallback(() => {
    const nxt = nextExercise(
      useProfile.getState().stats,
      useProfile.getState().seen,
      exercise.id,
    );
    setExercise(nxt);
    setPlacement({});
    setSelected(null);
    setResult(null);
    setRevealed(false);
  }, [exercise.id]);

  const highlight = result?.diagnoses.flatMap((d) => d.fields) ?? [];
  const errorTokens = result?.diagnoses.flatMap((d) => d.tokenIds) ?? [];

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(10),
        gap: t.space(4),
      }}
    >
      {/* ── Task ───────────────────────────────────────────────────── */}
      <Card tone="sunken">
        <View style={s.rowBetween}>
          <Label>
            {exercise.clause === 'helsætning' ? 'Main clause' : 'Subordinate clause'} ·{' '}
            {exercise.cefr}
          </Label>
          <Label>{exercise.exams.join(' · ')}</Label>
        </View>
        <Txt variant="title" style={{ marginTop: t.space(2.5) }}>
          {exercise.gloss}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
          Place every word in its field. The schema order, top to bottom, is the sentence order.
        </Txt>
      </Card>

      {/* ── Live sentence preview ─────────────────────────────────── */}
      <View
        style={{
          borderLeftWidth: 3,
          borderLeftColor: preview ? t.c.accent : t.c.border,
          paddingLeft: t.space(3),
          paddingVertical: t.space(1),
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

      {/* ── Board ──────────────────────────────────────────────────── */}
      <SchemaBoard
        exercise={exercise}
        placement={placement}
        selectedToken={selected}
        onPlace={place}
        onRemove={remove}
        highlight={highlight}
        errorTokens={errorTokens}
        locked={!!result}
        revealSolution={revealed}
      />

      {/* ── Tray ───────────────────────────────────────────────────── */}
      {!result && (
        <View style={{ gap: t.space(2) }}>
          <Label>
            {selected ? 'Now tap a field above' : 'Tap a word, then tap its field'}
          </Label>
          <WordTray
            exercise={exercise}
            tokenIds={tray.map((x) => x.id)}
            selected={selected}
            onSelect={(id) => setSelected((cur) => (cur === id ? null : id))}
          />
        </View>
      )}

      {/* ── Feedback ───────────────────────────────────────────────── */}
      {/* No entering animation on this block. Feedback is the most important
          thing on the screen, and reanimated's entering transitions do not
          reliably settle to full opacity on web — a half-faded explanation is
          far worse than no flourish. */}
      {result ? (
        <View style={{ gap: t.space(3) }}>
          {result.correct ? (
            <Card tone="success">
              <Label color={t.c.success}>
                {result.viaAlternative ? 'Correct — and a valid alternative' : 'Correct'}
              </Label>
              <Txt variant="heading" style={{ marginTop: t.space(2) }}>
                {renderSentence(exercise, placement)}
              </Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2) }}>
                {result.viaAlternative
                  ? 'Danish allows more than one order here, and you found one of them. ' +
                    exercise.takeaway
                  : exercise.takeaway}
              </Txt>
            </Card>
          ) : (
            <>
              <Card tone="warning">
                <Label color={t.c.warning}>
                  Not yet · {Math.round(result.accuracy * 100)}% of words in the right field
                </Label>
                <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2) }}>
                  Your arrangement reads as “{renderSentence(exercise, placement) || '…'}”
                </Txt>
              </Card>

              {result.diagnoses.map((d, i) => (
                <Card key={i}>
                  <View style={s.rowBetween}>
                    <Label color={d.severity === 'error' ? t.c.accent : t.c.textFaint}>
                      {RULES[d.ruleId].da}
                    </Label>
                  </View>
                  <Txt variant="body" style={{ marginTop: t.space(2) }}>
                    {d.message}
                  </Txt>
                  <Button
                    tone="ghost"
                    label={`Read the rule: ${RULES[d.ruleId].en}`}
                    onPress={() => router.push(`/rule/${d.ruleId}` as never)}
                    style={{ marginTop: t.space(3) }}
                  />
                </Card>
              ))}
            </>
          )}

          <View style={{ gap: t.space(2) }}>
            {!result.correct && !revealed && (
              <Button tone="ghost" label="Show me the answer" onPress={() => setRevealed(true)} />
            )}
            {!result.correct && (
              <Button
                tone="ghost"
                label="Try this sentence again"
                onPress={() => {
                  setPlacement({});
                  setResult(null);
                  setRevealed(false);
                }}
              />
            )}
            <Button
              tone={result.correct ? 'success' : 'primary'}
              label="Next sentence"
              onPress={advance}
            />
          </View>
        </View>
      ) : (
        <Button
          label={allPlaced ? 'Check my answer' : `Place ${tray.length} more word${tray.length === 1 ? '' : 's'}`}
          disabled={!allPlaced}
          onPress={check}
        />
      )}

      {/* ── Schema legend ──────────────────────────────────────────── */}
      <Card tone="sunken">
        <Label>The schema for this clause type</Label>
        <View style={{ marginTop: t.space(2.5), gap: t.space(1.5) }}>
          {fieldsFor(exercise.clause).map((f) => (
            <View key={f.id} style={s.row}>
              <Txt
                variant="heading"
                color={t.field(f.id as never)}
                style={{ width: 24 }}
              >
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
    </Screen>
  );
}
