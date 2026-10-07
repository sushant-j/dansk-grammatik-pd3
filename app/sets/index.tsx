import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVocabProfile } from '../../src/profile/vocabStore';
import { Screen } from '../../src/ui/Screen';
import { Button, Card, ListGroup, ListRow, StrengthBar, Txt, s, withFont } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';
import { setProgress } from '../../src/vocabSets/cards';
import { createSet, itemsInSet, liveSets, useVocabSets } from '../../src/vocabSets/store';

/**
 * The learner's own vocabulary sets: words and phrases they picked out of a
 * reading text, or typed in, to practise as flashcards alongside the deck.
 */
export default function Sets() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const allSets = useVocabSets((st) => st.sets);
  const items = useVocabSets((st) => st.items);
  const stats = useVocabProfile((st) => st.stats);
  const sets = useMemo(() => liveSets(allSets), [allSets]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  const create = () => {
    if (!name.trim()) return;
    const set = createSet(name);
    setNaming(false);
    setName('');
    router.push({ pathname: '/sets/[id]', params: { id: set.id } } as never);
  };

  return (
    <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: insets.bottom + t.space(10), gap: t.space(5) }}>
      <View style={s.rowBetween}>
        <Txt variant="display" style={{ fontSize: 26 }}>
          My sets
        </Txt>
        {naming ? null : (
          <Button label="＋ New set" tone="ghost" onPress={() => setNaming(true)} style={{ paddingVertical: t.space(2) }} />
        )}
      </View>

      {naming ? (
        <Card style={{ gap: t.space(3) }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name, e.g. Svære ord fra læsning"
            placeholderTextColor={t.c.textFaint}
            autoFocus
            onSubmitEditing={create}
            accessibilityLabel="New set name"
            style={withFont([
              t.font.body,
              {
                color: t.c.text,
                borderWidth: 1,
                borderColor: t.c.borderStrong,
                borderRadius: t.radius.sm,
                paddingHorizontal: t.space(3),
                paddingVertical: t.space(2.5),
              },
            ])}
          />
          <View style={[s.row, { gap: t.space(3) }]}>
            <Button label="Cancel" tone="ghost" onPress={() => setNaming(false)} style={{ flex: 1 }} />
            <Button label="Create" onPress={create} disabled={!name.trim()} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      {sets.length ? (
        <ListGroup>
          {sets.map((set) => {
            const p = setProgress(itemsInSet(items, set.id), stats);
            return (
              <ListRow
                key={set.id}
                title={set.name}
                detail={`${p.words} ${p.words === 1 ? 'word' : 'words'} · ${p.solid} solid`}
                onPress={() => router.push({ pathname: '/sets/[id]', params: { id: set.id } } as never)}
              >
                <StrengthBar value={p.words ? p.solid / p.words : 0} color={t.c.success} />
              </ListRow>
            );
          })}
        </ListGroup>
      ) : naming ? null : (
        <Card tone="sunken" style={{ gap: t.space(2) }}>
          <Txt variant="heading">No sets yet</Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ lineHeight: 22 }}>
            Make a set for the words you want to keep: the ones you had to look up, or keep forgetting.
          </Txt>
        </Card>
      )}

      <Txt variant="body" color={t.c.textFaint} style={{ fontSize: 14, lineHeight: 20 }}>
        {Platform.OS === 'web'
          ? 'Tip: select a word or phrase in any reading text and choose “Add to set” to file it here with its sentence.'
          : 'Tip: open a set to add words. In the web version you can also select words straight from a reading text.'}
      </Txt>
    </Screen>
  );
}
