import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addItem, createSet, findInSet, liveSets, updateItem, useVocabSets } from '../../vocabSets/store';
import { suggestMeaning } from '../../vocabSets/gloss';
import { isPickable, matchDeck, normalise, splitAtPhrase, tidy } from '../../vocabSets/match';
import type { SetItem, SetSource } from '../../vocabSets/types';
import { Button, Label, Txt, s, withFont } from '../primitives';
import { useTheme } from '../theme';

export interface Picked {
  text: string;
  context?: string | null;
  source?: SetSource | null;
}

/**
 * Add a word or phrase to one of the learner's sets — or, given `editing`,
 * change one already there. The text can be edited first (to cut a
 * selection down, or to its base form). A word the deck has is linked to
 * that card unless the learner says it's a different word; anything else
 * gets a meaning of their own, suggested in English (from the sentence it
 * came from) until they type one.
 */
export function AddToSetSheet({
  visible,
  picked,
  editing,
  setId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  /** What was selected (new word). */
  picked?: Picked | null;
  /** An existing word to edit instead. */
  editing?: SetItem | null;
  /** Add to this set without asking (the set's own screen). */
  setId?: string;
  onClose: () => void;
  onSaved?: (item: SetItem, setName: string) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const allSets = useVocabSets((st) => st.sets);
  const items = useVocabSets((st) => st.items);
  const lastSetId = useVocabSets((st) => st.lastSetId);
  const sets = useMemo(() => liveSets(allSets), [allSets]);

  const [text, setText] = useState('');
  const [meaning, setMeaning] = useState('');
  /** The learner has typed in the meaning field: a suggestion never overwrites it. */
  const [typed, setTyped] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  /** The normalised text the learner said is not the deck's word. */
  const [unlinkedFor, setUnlinkedFor] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | 'new'>('new');
  const [newName, setNewName] = useState('');

  // Fresh state each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setText(editing?.text ?? tidy(picked?.text ?? ''));
    setMeaning(editing?.meaning ?? '');
    setTyped(!!editing?.meaning);
    setSuggested(false);
    setUnlinkedFor(editing && !editing.refId ? normalise(editing.text) : null);
    const preferred = setId ?? editing?.setId ?? (sets.some((x) => x.id === lastSetId) ? lastSetId : sets[0]?.id);
    setChoice(preferred ?? 'new');
    setNewName('');
    // Only on open: later store changes must not reset what the learner is typing.
  }, [visible]);

  const deck = useMemo(() => (unlinkedFor === normalise(text) ? null : matchDeck(text)), [text, unlinkedFor]);
  const context = editing?.context ?? picked?.context ?? null;
  const source = editing?.source ?? picked?.source ?? null;

  // Suggest an English meaning for a word the deck doesn't have, once the text settles.
  const wantSuggestion = visible && !deck && !typed && isPickable(text);
  useEffect(() => {
    if (!wantSuggestion) {
      setLookingUp(false);
      return;
    }
    let live = true;
    setLookingUp(true);
    const id = setTimeout(() => {
      suggestMeaning(text, context).then((gloss) => {
        if (!live) return;
        setLookingUp(false);
        setMeaning(gloss ?? '');
        setSuggested(!!gloss);
      });
    }, 400);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [wantSuggestion, text, context]);

  const targetSet = choice === 'new' ? null : sets.find((x) => x.id === choice) ?? null;
  const duplicate = targetSet ? findInSet(items, targetSet.id, text, editing?.id) : null;
  const canSave = !!tidy(text) && !duplicate && (choice !== 'new' || !!newName.trim());

  const save = () => {
    if (!canSave) return;
    if (editing) {
      updateItem(editing.id, { text, refId: deck?.id ?? null, meaning: deck ? null : meaning });
      onSaved?.({ ...editing, text: tidy(text) }, targetSet?.name ?? '');
      onClose();
      return;
    }
    const set = targetSet ?? createSet(newName);
    const item = addItem({ setId: set.id, text, refId: deck?.id ?? null, meaning: deck ? null : meaning, context, source });
    if (item) onSaved?.(item, set.name);
    onClose();
  };

  const input = withFont([
    t.font.body,
    {
      color: t.c.text,
      borderWidth: 1,
      borderColor: t.c.borderStrong,
      borderRadius: t.radius.sm,
      paddingHorizontal: t.space(3),
      paddingVertical: t.space(2.5),
      backgroundColor: t.c.surface,
    },
  ]);

  const parts = context ? splitAtPhrase(context, text) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* On iOS the keyboard would otherwise cover the Add and Cancel buttons. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: '#0007', justifyContent: 'center', alignItems: 'center', padding: t.space(4) }}
      >
        <View
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: 480,
            maxHeight: '92%',
            backgroundColor: t.c.surface,
            borderRadius: t.radius.lg,
            borderWidth: 1,
            borderColor: t.c.border,
            marginBottom: insets.bottom,
          }}
        >
          <View style={[s.rowBetween, { padding: t.space(4), paddingBottom: t.space(2) }]}>
            <Txt variant="title">{editing ? 'Edit word' : 'Add to set'}</Txt>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
              <Txt variant="title" color={t.c.textMuted}>
                ✕
              </Txt>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: t.space(4), paddingTop: t.space(2), gap: t.space(4) }}>
            <View style={{ gap: t.space(2) }}>
              <Label color={t.c.textFaint}>WORD OR PHRASE</Label>
              <TextInput
                value={text}
                onChangeText={setText}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Word or phrase"
                style={input}
              />
              {deck ? (
                <View
                  style={{
                    padding: t.space(3),
                    borderRadius: t.radius.md,
                    backgroundColor: t.c.successSoft,
                    gap: t.space(1),
                  }}
                >
                  <Txt variant="body" style={{ fontWeight: '700' }}>
                    {`✓ In the deck: ${deck.word} · ${deck.glossEn}`}
                  </Txt>
                  <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 14 }}>
                    It uses the deck’s card, and practising it counts toward that word.
                  </Txt>
                  <Pressable onPress={() => setUnlinkedFor(normalise(text))} accessibilityRole="button">
                    <Txt variant="body" color={t.c.accent} style={{ fontSize: 14, textDecorationLine: 'underline' }}>
                      Not this word?
                    </Txt>
                  </Pressable>
                </View>
              ) : tidy(text) ? (
                <Txt variant="body" color={t.c.textMuted} style={{ fontSize: 14 }}>
                  Not in the deck — it will be your own card.
                </Txt>
              ) : null}
            </View>

            {deck ? null : (
              <View style={{ gap: t.space(2) }}>
                <View style={[s.row, { gap: t.space(2) }]}>
                  <Label color={t.c.textFaint}>MEANING</Label>
                  {lookingUp ? (
                    <Label color={t.c.textFaint}>· looking it up…</Label>
                  ) : suggested && !typed ? (
                    <Label color={t.c.accent}>· suggested, check it</Label>
                  ) : null}
                </View>
                <TextInput
                  value={meaning}
                  onChangeText={(v) => {
                    setMeaning(v);
                    setTyped(true);
                    setSuggested(false);
                  }}
                  placeholder={lookingUp ? '' : 'e.g. decided to'}
                  placeholderTextColor={t.c.textFaint}
                  accessibilityLabel="Meaning"
                  style={input}
                />
              </View>
            )}

            {context ? (
              <View style={{ gap: t.space(1.5) }}>
                <Label color={t.c.textFaint}>FROM YOUR TEXT</Label>
                <View style={{ borderLeftWidth: 3, borderLeftColor: t.c.border, paddingLeft: t.space(3) }}>
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
                      context
                    )}
                  </Txt>
                  {source ? (
                    <Txt variant="body" color={t.c.textFaint} style={{ fontSize: 13, marginTop: t.space(1) }}>
                      {source.label}
                    </Txt>
                  ) : null}
                </View>
              </View>
            ) : null}

            {editing || setId ? null : (
              <View style={{ gap: t.space(1) }}>
                <Label color={t.c.textFaint}>SET</Label>
                {sets.map((x) => (
                  <Choice
                    key={x.id}
                    on={choice === x.id}
                    label={x.name}
                    meta={`${items.filter((i) => i.setId === x.id && i.deletedAt === null).length} words`}
                    onPress={() => setChoice(x.id)}
                  />
                ))}
                {choice === 'new' ? (
                  <View style={[s.row, { gap: t.space(2), paddingVertical: t.space(1.5) }]}>
                    <Radio on />
                    <TextInput
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="New set name"
                      placeholderTextColor={t.c.textFaint}
                      autoFocus={sets.length > 0}
                      accessibilityLabel="New set name"
                      onSubmitEditing={save}
                      style={[input, { flex: 1 }]}
                    />
                  </View>
                ) : (
                  <Choice on={false} label="＋ New set…" onPress={() => setChoice('new')} />
                )}
              </View>
            )}

            {duplicate ? (
              <Txt variant="body" color={t.c.warning}>
                {`Already in ${targetSet?.name}.`}
              </Txt>
            ) : null}
          </ScrollView>

          <View style={[s.row, { gap: t.space(3), padding: t.space(4), borderTopWidth: 1, borderTopColor: t.c.border }]}>
            <Button label="Cancel" tone="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button label={editing ? 'Save' : 'Add to set'} onPress={save} disabled={!canSave} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Radio({ on }: { on: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: on ? t.c.accent : t.c.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.c.accent }} /> : null}
    </View>
  );
}

function Choice({ on, label, meta, onPress }: { on: boolean; label: string; meta?: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      style={({ pressed }) => [s.row, { gap: t.space(2), paddingVertical: t.space(2), opacity: pressed ? 0.7 : 1 }]}
    >
      <Radio on={on} />
      <Txt variant="body" style={{ flex: 1 }} color={on ? t.c.text : t.c.textMuted}>
        {label}
      </Txt>
      {meta ? <Label color={t.c.textFaint}>{meta}</Label> : null}
    </Pressable>
  );
}
