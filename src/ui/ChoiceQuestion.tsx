import React from 'react';
import { Pressable, View } from 'react-native';
import type { Level } from '../content/levels';
import { GAP, NO_WORD, optionLabel, splitPrompt } from '../drills/drillExercise';
import { LevelBadge } from './LevelBadge';
import { Button, Card, Label, Txt, s } from './primitives';
import { useTheme } from './theme';

/**
 * A multiple-choice question: the prompt, the options, then Correct / Not
 * quite with the explanation and a Next button.
 *
 * A prompt with a `___` gap (the drills) is shown as a sentence to complete:
 * until an answer is given the gap is a visible blank; after, it shows the
 * word that was picked — green when right, struck through beside the right
 * one when not — so the finished sentence can be read as a whole. A "no
 * word" answer shows as nothing, never as the literal "(ingen)". Any other
 * prompt is shown as it is.
 */
export function ChoiceQuestion({
  label,
  level,
  tag,
  prompt,
  options,
  correctIndex,
  picked,
  onChoose,
  explanation,
  explanationEn,
  onNext,
  nextLabel = 'Next',
}: {
  /** Small caption above the prompt: the rule or topic. */
  label: string;
  level?: Level;
  /** An extra chip above the card, e.g. "Review · …". */
  tag?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  picked: number | null;
  onChoose: (i: number) => void;
  explanation: string;
  explanationEn?: string;
  onNext: () => void;
  nextLabel?: string;
}) {
  const t = useTheme();
  const revealed = picked !== null;
  const right = picked === correctIndex;
  const answer = options[correctIndex];
  const pickedOption = picked !== null ? options[picked] : undefined;
  const hasGap = prompt.includes(GAP);

  // The gap closes up only when nothing is left to show in it: "no word" was
  // the answer and the learner picked it.
  const closed = revealed && right && answer === NO_WORD;
  const { before, after } = splitPrompt(prompt, closed ? NO_WORD : undefined);

  const word = (text: string, ok: boolean) => (
    <Txt
      variant="title"
      color={ok ? t.c.success : t.c.textFaint}
      style={{ textDecorationLine: ok ? 'underline' : 'line-through' }}
    >
      {text}
    </Txt>
  );
  const gap = !revealed ? (
    <Txt variant="title" color={t.c.accent}>
      _____
    </Txt>
  ) : closed ? null : right ? (
    word(answer, true)
  ) : answer === NO_WORD ? (
    word(pickedOption ?? '', false)
  ) : pickedOption === NO_WORD ? (
    word(answer, true)
  ) : (
    <>
      {word(pickedOption ?? '', false)} {word(answer, true)}
    </>
  );

  return (
    <>
      {tag ? (
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
      ) : null}

      <Card tone="sunken">
        <View style={[s.rowBetween, { alignItems: 'flex-start', gap: t.space(3) }]}>
          <View style={{ flex: 1 }}>
            <Label>{label}</Label>
          </View>
          {level ? <LevelBadge level={level} /> : null}
        </View>
        <Txt variant="title" style={{ marginTop: t.space(2) }}>
          {hasGap ? (
            <>
              {before}
              {gap}
              {after}
            </>
          ) : (
            prompt
          )}
        </Txt>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space(2.5) }}>
        {options.map((opt, i) => {
          const isCorrect = i === correctIndex;
          const isPicked = i === picked;

          const bg = !revealed ? t.c.surface : isCorrect ? t.c.successSoft : isPicked ? t.c.accentSoft : t.c.surface;
          const border = !revealed ? t.c.border : isCorrect ? t.c.success : isPicked ? t.c.accent : t.c.border;

          return (
            <Pressable
              key={`${i}-${opt}`}
              onPress={() => onChoose(i)}
              disabled={revealed}
              accessibilityRole="button"
              // Short options sit two or three to a row; a long one takes the row.
              style={{ flexGrow: 1, flexBasis: 140, maxWidth: '100%' }}
            >
              <View
                style={{
                  backgroundColor: bg,
                  borderWidth: 1.5,
                  borderColor: border,
                  borderRadius: t.radius.md,
                  paddingVertical: t.space(3.5),
                  paddingHorizontal: t.space(4),
                }}
              >
                <Txt
                  variant="heading"
                  color={revealed && isCorrect ? t.c.success : t.c.text}
                  style={{ fontSize: 17, lineHeight: 24 }}
                >
                  {optionLabel(opt)}
                </Txt>
              </View>
            </Pressable>
          );
        })}
      </View>

      {revealed ? (
        <View style={{ gap: t.space(3) }}>
          <Card tone={right ? 'success' : 'warning'}>
            <Label color={right ? t.c.success : t.c.warning}>{right ? 'Correct' : 'Not quite'}</Label>
            <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 22 }}>
              {explanation}
            </Txt>
            {explanationEn ? (
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
                {explanationEn}
              </Txt>
            ) : null}
          </Card>
          <Button label={nextLabel} onPress={onNext} />
        </View>
      ) : null}
    </>
  );
}
