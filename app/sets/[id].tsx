import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { vocabById } from '../../src/content/vocabulary';
import { EMPTY_STAT, progressFor } from '../../src/profile/mastery';
import { useVocabProfile } from '../../src/profile/vocabStore';
import { Screen } from '../../src/ui/Screen';
import { Snackbar } from '../../src/ui/Snackbar';
import { AddToSetSheet } from '../../src/ui/vocab/AddToSetSheet';
import { Button, Card, ListGroup, StrengthBar, Txt, s, withFont } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';
import { setProgress } from '../../src/vocabSets/cards';
import { cardIdFor } from '../../src/vocabSets/match';
import { deleteSet, itemsInSet, removeItem, renameSet, restoreItem, useVocabSets } from '../../src/vocabSets/store';
import type { SetItem } from '../../src/vocabSets/types';

/** One set: its words, practising it, and adding, editing and removing words. */
export default function SetDetail() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const set = useVocabSets((st) => st.sets.find((x) => x.id === id && x.deletedAt === null));
  const allItems = useVocabSets((st) => st.items);
  const hydrated = useVocabSets((st) => st.hydrated);
  const stats = useVocabProfile((st) => st.stats);
  const items = useMemo(() => itemsInSet(allItems, id), [allItems, id]);
  const progress = useMemo(() => setProgress(items, stats), [items, stats]);

  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<SetItem | null>(null);
  const [removed, setRemoved] = useState<SetItem | null>(null);
  const hideToast = useCallback(() => setRemoved(null), []);

  if (!set) {
    return (
      <Screen contentContainerStyle={{ padding: t.space(4), gap: t.space(4) }}>
        <Txt variant="body">{hydrated ? 'This set has been deleted.' : 'Loading…'}</Txt>
        <Button label="Back to my sets" tone="ghost" onPress={() => router.replace('/sets' as never)} />
      </Screen>
    );
  }

  const input = withFont([
    t.font.title,
    {
      color: t.c.text,
      borderWidth: 1,
      borderColor: t.c.borderStrong,
      borderRadius: t.radius.sm,
      paddingHorizontal: t.space(3),
      paddingVertical: t.space(2),
    },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Screen contentContainerStyle={{ padding: t.space(4), paddingBottom: insets.bottom + t.space(20), gap: t.space(4) }}>
        {renaming ? (
          <View style={{ gap: t.space(2) }}>
            <TextInput
              value={name}
              onChangeText={setName}
              autoFocus
              accessibilityLabel="Set name"
              onSubmitEditing={() => {
                renameSet(set.id, name);
                setRenaming(false);
              }}
              style={input}
            />
            <View style={[s.row, { gap: t.space(3) }]}>
              <Button label="Cancel" tone="ghost" onPress={() => setRenaming(false)} style={{ flex: 1 }} />
              <Button
                label="Save"
                disabled={!name.trim()}
                onPress={() => {
                  renameSet(set.id, name);
                  setRenaming(false);
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <View style={{ gap: t.space(1) }}>
            <Txt variant="display" style={{ fontSize: 26 }}>
              {set.name}
            </Txt>
            <View style={[s.row, { gap: t.space(4) }]}>
              <Txt variant="body" color={t.c.textMuted} style={{ flex: 1 }}>
                {`${progress.words} ${progress.words === 1 ? 'word' : 'words'} · ${progress.solid} solid`}
              </Txt>
              <LinkText
                label="Rename"
                onPress={() => {
                  setName(set.name);
                  setRenaming(true);
                }}
              />
              <LinkText label="Delete" onPress={() => setConfirmDelete(true)} />
            </View>
          </View>
        )}

        {confirmDelete ? (
          <Card tone="warning" style={{ gap: t.space(3) }}>
            <Txt variant="body">{`Delete “${set.name}” and its ${items.length} words? Your progress on the words is kept.`}</Txt>
            <View style={[s.row, { gap: t.space(3) }]}>
              <Button label="Keep it" tone="ghost" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }} />
              <Button
                label="Delete set"
                onPress={() => {
                  deleteSet(set.id);
                  router.replace('/sets' as never);
                }}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ) : null}

        <StrengthBar value={progress.words ? progress.solid / progress.words : 0} color={t.c.success} />

        <View style={[s.row, { gap: t.space(3) }]}>
          <Button
            label="Practise this set"
            disabled={!items.length}
            onPress={() => router.push({ pathname: '/vocab', params: { sets: set.id } } as never)}
            style={{ flex: 1 }}
          />
          <Button label="＋ Add word" tone="ghost" onPress={() => setAdding(true)} style={{ flex: 1 }} />
        </View>

        {items.length ? (
          <ListGroup>
            {items.map((item) => (
              <WordRow
                key={item.id}
                item={item}
                strength={progressFor(cardIdFor(item), stats[cardIdFor(item)] ?? EMPTY_STAT).strength}
                onPress={() => setEditing(item)}
                onRemove={() => {
                  removeItem(item.id);
                  setRemoved(item);
                }}
              />
            ))}
          </ListGroup>
        ) : (
          <Card tone="sunken">
            <Txt variant="body" color={t.c.textMuted} style={{ lineHeight: 22 }}>
              No words yet. Add one here, or select a word in a reading text (web) and choose “Add to set”.
            </Txt>
          </Card>
        )}
      </Screen>

      <AddToSetSheet visible={adding} setId={set.id} onClose={() => setAdding(false)} />
      <AddToSetSheet visible={!!editing} editing={editing} onClose={() => setEditing(null)} />
      <Snackbar
        message={removed ? `Removed “${removed.text}”` : null}
        action="Undo"
        onAction={() => removed && restoreItem(removed.id)}
        onHide={hideToast}
      />
    </View>
  );
}

function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6}>
      <Txt variant="body" color={t.c.accent} style={{ fontSize: 15 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

function WordRow({
  item,
  strength,
  onPress,
  onRemove,
}: {
  item: SetItem;
  strength: number;
  onPress: () => void;
  onRemove: () => void;
}) {
  const t = useTheme();
  const deck = item.refId ? vocabById(item.refId) : undefined;
  const detail = deck ? `${deck.word} · ${deck.glossEn}` : item.meaning;
  return (
    <View style={[s.row, { paddingRight: t.space(2) }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.text}`}
        style={({ pressed }) => ({
          flex: 1,
          paddingHorizontal: t.space(4),
          paddingVertical: t.space(3),
          gap: t.space(1.5),
          backgroundColor: pressed ? t.c.surfaceSunken : 'transparent',
        })}
      >
        <View style={[s.row, { gap: t.space(3) }]}>
          <Txt variant="heading" style={{ flexShrink: 1 }}>
            {item.text}
          </Txt>
          <Txt variant="body" color={detail ? t.c.textMuted : t.c.textFaint} style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
            {detail ?? 'add a meaning'}
          </Txt>
        </View>
        <View style={{ maxWidth: 160 }}>
          <StrengthBar value={strength} color={t.c.success} />
        </View>
      </Pressable>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.text}`}
        hitSlop={8}
        style={({ pressed }) => ({ padding: t.space(2), opacity: pressed ? 0.5 : 1 })}
      >
        <Txt variant="heading" color={t.c.textFaint}>
          ✕
        </Txt>
      </Pressable>
    </View>
  );
}
