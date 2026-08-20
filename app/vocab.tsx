import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../src/ui/Screen';
import { VOCABULARY, type VocabCategory } from '../src/content/vocabulary';
import { nextWord, summarizeVocab, useVocabProfile } from '../src/profile/vocabStore';
import { Button, Card, Label, StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';

const CATEGORY_LABEL: Record<VocabCategory, string> = {
  connector: 'Linkeord',
  noun: 'Substantiv',
  verb: 'Udsagnsord',
  adjective: 'Tillægsord',
  phrase: 'Fast udtryk',
};

/**
 * Vocabulary flashcards — the "hard words to memorize" module.
 *
 * Flip-and-self-grade rather than typed recall: at PD3 level the skill being
 * built is recognising and deploying a word inside a spoken argument, not
 * spelling it under pressure. Every card carries the real sentence it was
 * pulled from, because a connector or an abstract noun memorised in isolation
 * evaporates the moment the exam actually needs it in context.
 */
export default function Vocab() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const stats = useVocabProfile((s2) => s2.stats);
  const record = useVocabProfile((s2) => s2.record);

  const [word, setWord] = useState(() => nextWord(stats));
  const [flipped, setFlipped] = useState(false);

  const summary = useMemo(() => summarizeVocab(stats), [stats]);

  const grade = useCallback(
    (knewIt: boolean) => {
      record(word.id, knewIt);
      const nxt = nextWord(useVocabProfile.getState().stats, word.id);
      setWord(nxt);
      setFlipped(false);
    },
    [record, word.id],
  );

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          Ordforråd
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {summary.mastered} af {summary.total} ord sidder fast. Ingen serie at beskytte — bare
          ord, der enten sidder, eller som trænger til et gensyn.
        </Txt>
      </View>

      <View style={{ gap: t.space(1.5) }}>
        <StrengthBar value={summary.total ? summary.mastered / summary.total : 0} color={t.c.success} />
      </View>

      {/* ── The card ─────────────────────────────────────────────────── */}
      <Pressable onPress={() => setFlipped((f) => !f)}>
        <Card style={{ minHeight: 220, justifyContent: 'center' }}>
          {!flipped ? (
            <View style={{ alignItems: 'center', gap: t.space(2) }}>
              <Label color={t.c.textFaint}>{CATEGORY_LABEL[word.category]} · {word.cefr}</Label>
              <Txt variant="display" style={{ textAlign: 'center', fontSize: 26 }}>
                {word.word}
              </Txt>
              <Txt variant="body" color={t.c.textFaint} style={{ marginTop: t.space(3) }}>
                Tryk for at vende kortet
              </Txt>
            </View>
          ) : (
            <View style={{ gap: t.space(3) }}>
              <View>
                <Label color={t.c.accent}>ENGELSK</Label>
                <Txt variant="heading" style={{ marginTop: t.space(1) }}>
                  {word.glossEn}
                </Txt>
              </View>
              <View>
                <Label color={t.c.textFaint}>PÅ DANSK</Label>
                <Txt variant="body" style={{ marginTop: t.space(1), lineHeight: 22 }}>
                  {word.definitionDa}
                </Txt>
              </View>
              <View
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: t.c.border,
                  paddingLeft: t.space(3),
                }}
              >
                <Txt variant="body" style={{ lineHeight: 22, fontStyle: 'italic' }}>
                  "{word.example}"
                </Txt>
                <Txt variant="body" color={t.c.textFaint} style={{ marginTop: t.space(1), fontSize: 13 }}>
                  {word.exampleEn}
                </Txt>
              </View>
            </View>
          )}
        </Card>
      </Pressable>

      {/* ── Self-grade ───────────────────────────────────────────────── */}
      {flipped ? (
        <View style={[s.row, { gap: t.space(3) }]}>
          <Button
            label="Vidste det ikke"
            tone="ghost"
            onPress={() => grade(false)}
            style={{ flex: 1 }}
          />
          <Button
            label="Vidste det"
            tone="success"
            onPress={() => grade(true)}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <Txt variant="body" color={t.c.textFaint} style={{ textAlign: 'center' }}>
          Prøv at gætte betydningen, før du vender kortet.
        </Txt>
      )}

      <Txt variant="label" color={t.c.textFaint} style={{ textAlign: 'center' }}>
        {VOCABULARY.length} ORD I ALT · {summary.dueForReview.length} KLAR TIL GENSYN
      </Txt>
    </Screen>
  );
}
