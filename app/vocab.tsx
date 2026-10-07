import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../src/ui/Screen';
import { splitAtForm, type VocabExample } from '../src/content/examples';
import { MAX_LEVEL, type Level } from '../src/content/levels';
import type { VocabCategory } from '../src/content/vocabulary';
import { currentLevelNow, useCurrentLevel } from '../src/profile/levelStore';
import { useVocabSession, type SessionLength } from '../src/profile/vocabSession';
import { LevelBadge, LevelUpNotice } from '../src/ui/LevelBadge';
import {
  SESSION_CATEGORIES,
  countByCategory,
  nextFromPool,
  nextWord,
  summarizeVocab,
  useVocabProfile,
} from '../src/profile/vocabStore';
import { Segmented } from '../src/ui/Segmented';
import { Button, Card, Label, StrengthBar, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';
import { cardsFor, type SetCard } from '../src/vocabSets/cards';
import { splitAtPhrase } from '../src/vocabSets/match';
import { itemsInSet, liveSets, useVocabSets } from '../src/vocabSets/store';

const CATEGORY_LABEL: Record<VocabCategory, string> = {
  connector: 'Connector',
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adjective',
  phrase: 'Phrase',
};

const CATEGORY_PLURAL: Record<VocabCategory, string> = {
  connector: 'Connectors',
  noun: 'Nouns',
  verb: 'Verbs',
  adjective: 'Adjectives',
  phrase: 'Phrases',
};

const LENGTH_OPTIONS: { key: string; label: string }[] = [
  { key: '10', label: '10' },
  { key: '20', label: '20' },
  { key: '30', label: '30' },
  { key: 'endless', label: 'Endless' },
];

/** Usage sentences shown on the back of a card; more than this is a wall of text. */
const MAX_EXAMPLES = 4;

interface Session {
  categories: VocabCategory[];
  /** A round of a small set can be shorter than any of the length options. */
  length: SessionLength | number;
  allLevels: boolean;
  /** A round of the learner's own sets instead of the deck: these sets' cards, no niveau. */
  setIds?: string[];
  /** Every word shown this round, the current card included — none repeats until these run out. */
  served: Set<string>;
  results: { word: SetCard; knewIt: boolean }[];
}

/** The cards in these of the learner's sets, read fresh from the store. */
function setPool(setIds: string[]): SetCard[] {
  const { items } = useVocabSets.getState();
  return cardsFor(setIds.flatMap((id) => itemsInSet(items, id)));
}

/**
 * Vocabulary flashcards — the hard exam words, plus every word the grammar
 * trainers use, served up to the learner's niveau.
 *
 * Flip-and-self-grade rather than typed recall: at PD3 level the skill being
 * built is recognising and deploying a word inside a spoken argument, not
 * spelling it under pressure. Practice comes in rounds of a chosen size and
 * word type, so a sitting has an end and a list of what to look at again.
 * Wherever a card has them, its back shows the word at work — the exam words'
 * own example, and a sentence for each form a bank word inflects into —
 * because a connector or an abstract noun memorised in isolation evaporates
 * the moment the exam actually needs it in context.
 */
export default function Vocab() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const stats = useVocabProfile((s2) => s2.stats);
  const record = useVocabProfile((s2) => s2.record);

  const level = useCurrentLevel('vocab');
  const [session, setSession] = useState<Session | null>(null);
  const [finished, setFinished] = useState(false);
  const [word, setWord] = useState<SetCard | null>(null);
  const [flipped, setFlipped] = useState(false);

  const summary = useMemo(() => summarizeVocab(stats, Date.now(), level), [stats, level]);

  const start = useCallback((categories: VocabCategory[], length: SessionLength, allLevels: boolean) => {
    const first = nextWord(useVocabProfile.getState().stats, undefined, Date.now(), currentLevelNow('vocab'), {
      categories,
      allLevels,
    });
    setSession({ categories, length, allLevels, served: new Set([first.id]), results: [] });
    setWord(first);
    setFlipped(false);
    setFinished(false);
  }, []);

  const startSets = useCallback((setIds: string[], length: SessionLength) => {
    const pool = setPool(setIds);
    const first = nextFromPool(useVocabProfile.getState().stats, pool);
    if (!first) return;
    // A round is never longer than the sets it draws from.
    const fitted = length === 'endless' ? length : Math.min(length, pool.length);
    setSession({ categories: [], length: fitted, allLevels: true, setIds, served: new Set([first.id]), results: [] });
    setWord(first);
    setFlipped(false);
    setFinished(false);
  }, []);

  // Arriving from a set's own screen ("Practise this set"): start a round of it straight away.
  const { sets: setsParam } = useLocalSearchParams<{ sets?: string }>();
  const hydratedSets = useVocabSets((st) => st.hydrated);
  const startedFromParam = useRef(false);
  useEffect(() => {
    if (!setsParam || !hydratedSets || startedFromParam.current) return;
    startedFromParam.current = true;
    startSets(setsParam.split(','), useVocabSession.getState().length);
  }, [setsParam, hydratedSets, startSets]);

  const backToSetup = useCallback(() => {
    setSession(null);
    setWord(null);
    setFinished(false);
  }, []);

  const endSession = useCallback(() => {
    if (session?.results.length) setFinished(true);
    else backToSetup();
  }, [session, backToSetup]);

  const grade = useCallback(
    (knewIt: boolean) => {
      if (!session || !word) return;
      record(word.id, knewIt, { ownSet: !!session.setIds });
      const results = [...session.results, { word, knewIt }];
      if (session.length !== 'endless' && results.length >= session.length) {
        setSession({ ...session, results });
        setFinished(true);
        return;
      }
      // A fixed round never repeats a card; Endless lets weak words come back, as before.
      const exclude = session.length === 'endless' ? undefined : session.served;
      const stats = useVocabProfile.getState().stats;
      const nxt = session.setIds
        ? (nextFromPool(stats, setPool(session.setIds), word.id, Date.now(), exclude) ?? word)
        : nextWord(stats, word.id, Date.now(), currentLevelNow('vocab'), {
            categories: session.categories,
            allLevels: session.allLevels,
            exclude,
          });
      setSession({ ...session, results, served: new Set(session.served).add(nxt.id) });
      setWord(nxt);
      setFlipped(false);
    },
    [record, session, word],
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
          Vocabulary
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {summary.mastered} of {summary.total} words are solid — the rest either stick or are due for another look.
        </Txt>
      </View>

      <View style={{ gap: t.space(1.5) }}>
        <StrengthBar value={summary.total ? summary.mastered / summary.total : 0} color={t.c.success} />
      </View>

      <LevelUpNotice domain="vocab" />

      {!session ? (
        <SessionSetup level={level} onStart={start} onStartSets={startSets} />
      ) : finished ? (
        <SessionSummary
          session={session}
          onAgain={() =>
            session.setIds
              ? startSets(session.setIds, useVocabSession.getState().length)
              : start(session.categories, session.length as SessionLength, session.allLevels)
          }
          onChange={backToSetup}
        />
      ) : word ? (
        <>
          {/* ── Round progress ─────────────────────────────────────────── */}
          <View style={{ gap: t.space(1.5) }}>
            <View style={s.rowBetween}>
              <Txt variant="label" color={t.c.textMuted}>
                {session.length === 'endless'
                  ? `Card ${session.results.length + 1}`
                  : `${session.results.length + 1} / ${session.length}`}
              </Txt>
              <Button
                label="End session"
                tone="ghost"
                onPress={endSession}
                style={{ paddingVertical: t.space(1.5), paddingHorizontal: t.space(3) }}
              />
            </View>
            {session.length !== 'endless' ? (
              <StrengthBar value={session.results.length / session.length} color={t.c.accent} />
            ) : null}
          </View>

          {/* ── The card ─────────────────────────────────────────────────── */}
          <Pressable onPress={() => setFlipped((f) => !f)}>
            <Card style={{ minHeight: 220, justifyContent: 'center' }}>
              {!flipped ? (
                <View style={{ alignItems: 'center', gap: t.space(2) }}>
                  <View style={[s.row, { gap: t.space(2) }]}>
                    <Label color={t.c.textFaint}>{word.own ? 'My word' : CATEGORY_LABEL[word.category]}</Label>
                    {word.own ? null : <LevelBadge level={word.level} />}
                  </View>
                  <Txt variant="display" style={{ textAlign: 'center', fontSize: 26 }}>
                    {word.word}
                  </Txt>
                  <Txt variant="body" color={t.c.textFaint} style={{ marginTop: t.space(3) }}>
                    Tap to flip the card
                  </Txt>
                </View>
              ) : (
                <CardBack word={word} />
              )}
            </Card>
          </Pressable>

          {/* ── Self-grade ───────────────────────────────────────────────── */}
          {flipped ? (
            <View style={[s.row, { gap: t.space(3) }]}>
              <Button
                label="Didn’t know it"
                tone="ghost"
                onPress={() => grade(false)}
                style={{ flex: 1 }}
              />
              <Button
                label="Knew it"
                tone="success"
                onPress={() => grade(true)}
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <Txt variant="body" color={t.c.textFaint} style={{ textAlign: 'center' }}>
              Try to guess the meaning before you flip the card.
            </Txt>
          )}
        </>
      ) : null}

      <Txt variant="label" color={t.c.textFaint} style={{ textAlign: 'center' }}>
        {summary.total} WORDS UP TO NIVEAU {level} · {summary.dueForReview.length} DUE FOR REVIEW
      </Txt>
    </Screen>
  );
}

/**
 * Pick the round: the deck (which word types, which levels) or the learner's
 * own sets, and how many cards. Remembered for next time, except the source.
 */
function SessionSetup({
  level,
  onStart,
  onStartSets,
}: {
  level: Level;
  onStart: (categories: VocabCategory[], length: SessionLength, allLevels: boolean) => void;
  onStartSets: (setIds: string[], length: SessionLength) => void;
}) {
  const t = useTheme();
  const allSets = useVocabSets((st) => st.sets);
  const setItems = useVocabSets((st) => st.items);
  const sets = useMemo(
    () => liveSets(allSets).map((x) => ({ ...x, count: cardsFor(itemsInSet(setItems, x.id)).length })),
    [allSets, setItems],
  );
  const [source, setSource] = useState<'deck' | 'sets'>('deck');
  // Every set to begin with: the usual wish is "my words", not one list of them.
  const [picked, setPicked] = useState<string[]>(() => sets.map((x) => x.id));
  const chosen = picked.filter((id) => sets.some((x) => x.id === id && x.count > 0));
  const categories = useVocabSession((st) => st.categories);
  const length = useVocabSession((st) => st.length);
  const setCategories = useVocabSession((st) => st.setCategories);
  const setLength = useVocabSession((st) => st.setLength);
  const allLevels = useVocabSession((st) => st.allLevels);
  const setAllLevels = useVocabSession((st) => st.setAllLevels);

  const counts = useMemo(() => countByCategory(allLevels ? MAX_LEVEL : level), [allLevels, level]);
  const available = categories.reduce((n, c) => n + counts[c], 0);

  const toggle = (c: VocabCategory) =>
    setCategories(categories.includes(c) ? categories.filter((x) => x !== c) : [...categories, c]);

  const lengthPicker = (
    <View style={{ gap: t.space(2) }}>
      <Label color={t.c.textFaint}>CARDS PER ROUND</Label>
      <Segmented
        compact
        options={LENGTH_OPTIONS}
        value={String(length)}
        onChange={(k) => setLength(k === 'endless' ? 'endless' : (Number(k) as SessionLength))}
      />
    </View>
  );

  const sourcePicker = sets.length ? (
    <View style={{ gap: t.space(2) }}>
      <Label color={t.c.textFaint}>PRACTISE</Label>
      <Segmented
        compact
        options={[
          { key: 'deck', label: 'Deck' },
          { key: 'sets', label: 'My sets' },
        ]}
        value={source}
        onChange={(k) => setSource(k === 'sets' ? 'sets' : 'deck')}
      />
    </View>
  ) : null;

  if (source === 'sets' && sets.length) {
    return (
      <Card style={{ gap: t.space(4) }}>
        {sourcePicker}
        <View style={{ gap: t.space(2) }}>
          <Label color={t.c.textFaint}>SETS</Label>
          <View style={[s.wrap, { gap: t.space(2) }]}>
            {sets.map((x) => (
              <ToggleChip
                key={x.id}
                label={x.name}
                count={x.count}
                on={chosen.includes(x.id)}
                onPress={() => setPicked(picked.includes(x.id) ? picked.filter((id) => id !== x.id) : [...picked, x.id])}
              />
            ))}
          </View>
        </View>
        {lengthPicker}
        <Button label="Start" onPress={() => onStartSets(chosen, length)} disabled={chosen.length === 0} />
      </Card>
    );
  }

  return (
    <Card style={{ gap: t.space(4) }}>
      {sourcePicker}
      <View style={{ gap: t.space(2) }}>
        <Label color={t.c.textFaint}>WORD TYPES</Label>
        <View style={[s.wrap, { gap: t.space(2) }]}>
          {SESSION_CATEGORIES.map((c) => (
            <ToggleChip
              key={c}
              label={CATEGORY_PLURAL[c]}
              count={counts[c]}
              on={categories.includes(c)}
              onPress={() => toggle(c)}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: t.space(2) }}>
        <Label color={t.c.textFaint}>LEVELS</Label>
        <Segmented
          compact
          options={[
            { key: 'mine', label: `Up to niveau ${level}` },
            { key: 'all', label: 'All levels' },
          ]}
          value={allLevels ? 'all' : 'mine'}
          onChange={(k) => setAllLevels(k === 'all')}
        />
      </View>
      {lengthPicker}
      <Button label="Start" onPress={() => onStart(categories, length, allLevels)} disabled={available === 0} />
    </Card>
  );
}

/** A multi-select pill — the same on/off look as Segmented, but each toggles on its own. */
function ToggleChip({
  label,
  count,
  on,
  onPress,
}: {
  label: string;
  count: number;
  on: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: on ? t.c.accent : t.c.border,
        backgroundColor: on ? t.c.accentSoft : t.c.surface,
        borderRadius: 999,
        paddingHorizontal: t.space(3),
        paddingVertical: t.space(1.5),
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Txt variant="chip" color={on ? t.c.accent : t.c.textMuted} style={{ fontSize: 14 }}>
        {label}
        <Txt variant="label" color={t.c.textFaint}>{`  ${count}`}</Txt>
      </Txt>
    </Pressable>
  );
}

/** End of a round: the score, and the words that didn't come to mind. */
function SessionSummary({
  session,
  onAgain,
  onChange,
}: {
  session: Session;
  onAgain: () => void;
  onChange: () => void;
}) {
  const t = useTheme();
  const knew = session.results.filter((r) => r.knewIt).length;
  // A word can come round twice once the deck runs dry; list it once.
  const missed = [
    ...new Map(session.results.filter((r) => !r.knewIt).map((r) => [r.word.id, r.word])).values(),
  ];

  return (
    <Card style={{ gap: t.space(4) }}>
      <View>
        <Txt variant="title">
          Knew {knew} of {session.results.length}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {missed.length
            ? 'These will come back sooner — have another look now.'
            : 'Every word came to mind this round.'}
        </Txt>
      </View>
      {missed.length ? (
        <View style={{ gap: t.space(2) }}>
          <Label color={t.c.textFaint}>TO LOOK AT AGAIN</Label>
          {missed.map((w) => (
            <View key={w.id}>
              <Txt variant="heading">{w.word}</Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 14 }}>
                {w.glossEn}
              </Txt>
            </View>
          ))}
        </View>
      ) : null}
      <View style={[s.row, { gap: t.space(3) }]}>
        <Button label="Change setup" tone="ghost" onPress={onChange} style={{ flex: 1 }} />
        <Button label="Another round" onPress={onAgain} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

function CardBack({ word }: { word: SetCard }) {
  const t = useTheme();
  const examples = word.examples?.slice(0, MAX_EXAMPLES) ?? [];
  return (
    <View style={{ gap: t.space(3) }}>
      <View>
        <Label color={t.c.accent}>{word.own ? 'YOUR MEANING' : 'ENGLISH'}</Label>
        {word.glossEn ? (
          <Txt variant="heading" style={{ marginTop: t.space(1) }}>
            {word.glossEn}
          </Txt>
        ) : (
          <Txt variant="body" color={t.c.textFaint} style={{ marginTop: t.space(1) }}>
            No meaning added yet — you can add one in the set.
          </Txt>
        )}
      </View>
      {word.fromText ? <FromYourText {...word.fromText} /> : null}
      {word.forms ? (
        <View>
          <Label color={t.c.textFaint}>FORMS</Label>
          <Txt variant="heading" style={{ marginTop: t.space(1) }}>
            {word.forms}
          </Txt>
        </View>
      ) : null}
      {word.definitionDa ? (
        <View>
          <Label color={t.c.textFaint}>IN DANISH</Label>
          <Txt variant="body" style={{ marginTop: t.space(1), lineHeight: 22 }}>
            {word.definitionDa}
          </Txt>
        </View>
      ) : null}
      {word.example ? (
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
      ) : null}
      {examples.length ? (
        <View style={{ gap: t.space(3) }}>
          <Label color={t.c.textFaint}>IN USE</Label>
          {examples.map((ex, i) => (
            <UsageSentence key={i} example={ex} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** The sentence a set word was picked out of, with the word in bold and where it came from. */
function FromYourText({ sentence, form, source }: NonNullable<SetCard['fromText']>) {
  const t = useTheme();
  const parts = splitAtPhrase(sentence, form);
  return (
    <View style={{ gap: t.space(1) }}>
      <Label color={t.c.textFaint}>FROM YOUR TEXT</Label>
      <View style={{ borderLeftWidth: 3, borderLeftColor: t.c.accent, paddingLeft: t.space(3) }}>
        <Txt variant="body" style={{ lineHeight: 22 }}>
          {parts ? (
            <>
              {parts.before}
              <Txt variant="body" style={{ lineHeight: 22, fontWeight: '700' }}>
                {parts.match}
              </Txt>
              {parts.after}
            </>
          ) : (
            sentence
          )}
        </Txt>
        {source ? (
          <Txt variant="body" color={t.c.textFaint} style={{ marginTop: t.space(1), fontSize: 13 }}>
            {source.label}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

/** One usage sentence, with the form it demonstrates set in bold. */
function UsageSentence({ example }: { example: VocabExample }) {
  const t = useTheme();
  const parts = splitAtForm(example.da, example.form);
  return (
    <View style={{ borderLeftWidth: 3, borderLeftColor: t.c.border, paddingLeft: t.space(3) }}>
      {example.form ? <Label color={t.c.textFaint}>{example.form}</Label> : null}
      <Txt variant="body" style={{ lineHeight: 22, marginTop: example.form ? t.space(0.5) : 0 }}>
        {parts ? (
          <>
            {parts.before}
            <Txt variant="body" style={{ lineHeight: 22, fontWeight: '700' }}>
              {parts.match}
            </Txt>
            {parts.after}
          </>
        ) : (
          example.da
        )}
      </Txt>
      <Txt variant="body" color={t.c.textFaint} style={{ marginTop: t.space(1), fontSize: 13 }}>
        {example.en}
      </Txt>
    </View>
  );
}
