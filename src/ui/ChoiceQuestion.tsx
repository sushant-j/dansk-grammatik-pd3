import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import type { Level } from '../content/levels';
import { GAP, NO_WORD, optionLabel, splitPrompt } from '../drills/drillExercise';
import { commaSentenceSeed, matchOption, normalizeTyped, sameSentence } from '../grammar/typedAnswer';
import { AnswerInput, DanishKeys, insertAt, type Selection } from './AnswerInput';
import { LevelBadge } from './LevelBadge';
import { Button, Card, Label, Txt, s } from './primitives';
import { useTheme } from './theme';
import { ModeSwitch } from './ModeSwitch';
import { useAnswerMode, useWide } from './useWide';

/**
 * A question answered by typing: the prompt, a text box, then Correct / Not
 * quite with the explanation and a Next button.
 *
 * The question still carries options and a correct index — the builders and
 * the stores speak in those — and what is typed is matched back to an option
 * (case and spacing forgiven, æ/ø/å not). Typing something that is none of
 * the options is simply wrong, reported to `onChoose` as index -1.
 *
 * A prompt with a `___` gap is shown as a sentence to complete: the gap fills
 * in as the learner types; after checking it shows the answer given — green
 * when right, struck through beside the right one when not — so the finished
 * sentence can be read as a whole. Where the gap may need no word at all, an
 * "No word" button answers that, since an empty box can't be submitted; a
 * "no word" answer shows as nothing, never as the literal "(ingen)".
 *
 * `showOptions` lists the candidate words under the box, for prompts that
 * don't themselves name the word to write ("Jeg har aldrig ___ i Norge").
 *
 * `mode="sentence"` is the comma exercise: the box holds the whole sentence
 * with its commas taken out, and the learner puts them back.
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
  showOptions = false,
  mode = 'word',
}: {
  /** Small caption above the prompt: the rule or topic. */
  label: string;
  level?: Level;
  /** An extra chip above the card, e.g. "Review · …". */
  tag?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  /** The option answered, -1 for a typed answer that is none of them, null before checking. */
  picked: number | null;
  onChoose: (i: number) => void;
  explanation: string;
  explanationEn?: string;
  onNext: () => void;
  nextLabel?: string;
  showOptions?: boolean;
  mode?: 'word' | 'sentence';
}) {
  const t = useTheme();
  const { wide, onLayout } = useWide();
  const { mode: answerMode, switchMode } = useAnswerMode(wide);
  const tap = answerMode === 'tap';
  const answer = options[correctIndex];
  const sentence = mode === 'sentence';
  const seed = sentence ? commaSentenceSeed(answer) : '';

  const [typed, setTyped] = useState(seed);
  const [sel, setSel] = useState<Selection | undefined>(undefined);
  const input = useRef<TextInput>(null);

  // A screen that keeps this mounted across questions gets a fresh box for each.
  const questionKey = `${prompt}\u0000${options.join('\u0000')}`;
  useEffect(() => {
    setTyped(seed);
    setSel(undefined);
  }, [questionKey, seed]);

  const revealed = picked !== null;
  const right = picked === correctIndex;
  const pickedOption = picked !== null && picked >= 0 ? options[picked] : undefined;
  // What the learner gave, as it should read: the option they matched, or their own words.
  const given = pickedOption ?? typed.trim();
  const hasGap = !sentence && prompt.includes(GAP);
  const allowsNoWord = options.includes(NO_WORD);
  const canCheck = sentence ? normalizeTyped(typed) !== '' : typed.trim() !== '';

  const check = () => {
    if (revealed || !canCheck) return;
    if (sentence) {
      onChoose(options.findIndex((o) => sameSentence(typed, o)));
    } else {
      // "(ingen)" is answered with its own button, never by typing it.
      onChoose(matchOption(typed, options.map((o) => (o === NO_WORD ? '' : o))));
    }
  };

  const insert = (ch: string) => {
    const next = insertAt(typed, sel, ch);
    setTyped(next.value);
    setSel(next.sel);
    input.current?.focus();
    // Put the cursor just after the inserted letter, not at the end.
    requestAnimationFrame(() => input.current?.setSelection?.(next.sel.start, next.sel.end));
  };

  // The gap closes up only when nothing is left to show in it: "no word" was
  // the answer and the learner gave it.
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
    <Txt variant="title" color={t.c.accent} style={{ textDecorationLine: 'underline' }}>
      {typed.trim() || '_____'}
    </Txt>
  ) : closed ? null : right ? (
    word(answer, true)
  ) : answer === NO_WORD ? (
    word(given, false)
  ) : pickedOption === NO_WORD ? (
    word(answer, true)
  ) : (
    <>
      {word(given, false)} {word(answer, true)}
    </>
  );

  // Verdict, why, and Next. On a wide screen it sits beside the question, so
  // the answer and its explanation are read together without scrolling.
  const feedback = revealed ? (
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
  ) : null;

  const question = (
    <>
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

      {tap ? (
        <>
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
                  // Short options sit two or three to a row; a long one (a comma sentence) takes the row.
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
        </>
      ) : (
        <View style={{ gap: t.space(2.5) }}>
          {showOptions && !sentence ? (
            <Txt variant="body" color={t.c.textMuted}>
              <Txt variant="label" color={t.c.textMuted}>
                {'Words:  '}
              </Txt>
              {options.filter((o) => o !== NO_WORD).join('  ·  ')}
            </Txt>
          ) : null}

          <AnswerInput
            ref={input}
            value={typed}
            onChangeText={setTyped}
            onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
            onSubmitEditing={sentence ? undefined : check}
            submitBehavior={sentence ? undefined : 'submit'}
            returnKeyType={sentence ? 'default' : 'done'}
            multiline={sentence}
            locked={revealed}
            tone={revealed ? (right ? 'success' : 'warning') : undefined}
            placeholder={sentence ? undefined : 'Type your answer'}
            accessibilityLabel={sentence ? 'The sentence, with commas' : 'Your answer'}
            autoFocus
          />

          {!revealed ? (
            <View style={[s.rowBetween, { flexWrap: 'wrap', gap: t.space(2.5) }]}>
              {sentence ? <View /> : <DanishKeys onInsert={insert} />}
              <View style={{ flexDirection: 'row', gap: t.space(2.5) }}>
                {allowsNoWord ? (
                  <Button label="No word" tone="ghost" onPress={() => onChoose(options.indexOf(NO_WORD))} />
                ) : null}
                <Button label="Check" onPress={check} disabled={!canCheck} />
              </View>
            </View>
          ) : null}

          {revealed && sentence && !right ? (
            <Txt variant="body" style={{ lineHeight: 22 }}>
              <Txt variant="label" color={t.c.success}>
                {'Correct sentence:  '}
              </Txt>
              {answer}
            </Txt>
          ) : null}
        </View>
      )}

      {!revealed ? <ModeSwitch mode={answerMode} onSwitch={switchMode} /> : null}
    </>
  );

  return (
    <View onLayout={onLayout} style={{ gap: t.space(4) }}>
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

      {wide ? (
        <View style={{ flexDirection: 'row', gap: t.space(5), alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: t.space(4) }}>{question}</View>
          <View style={{ flex: 1 }}>{feedback}</View>
        </View>
      ) : (
        <>
          {question}
          {feedback}
        </>
      )}
    </View>
  );
}
