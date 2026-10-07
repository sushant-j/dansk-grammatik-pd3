import { beforeEach, describe, expect, it } from 'vitest';
import {
  addItem,
  createSet,
  deleteSet,
  findInSet,
  itemsInSet,
  liveSets,
  markSetsUploaded,
  mergeSets,
  removeItem,
  renameSet,
  restoreItem,
  switchSetsUser,
  updateItem,
  useVocabSets,
} from './store';

beforeEach(async () => {
  await switchSetsUser(`u-${Math.random()}`);
});

const state = () => useVocabSets.getState();

describe('sets', () => {
  it('creates, renames and deletes a set, queuing each change', () => {
    const set = createSet('  Læsning  ', 100);
    expect(set.name).toBe('Læsning');
    renameSet(set.id, 'Svære ord', 200);
    expect(state().sets[0]).toMatchObject({ name: 'Svære ord', updatedAt: 200 });
    deleteSet(set.id, 300);
    expect(liveSets(state().sets)).toHaveLength(0);
    expect(state().sets[0].deletedAt).toBe(300);
    expect(state().setOutbox).toEqual([set.id]);
  });

  it('deleting a set removes its words too', () => {
    const set = createSet('A');
    const item = addItem({ setId: set.id, text: 'fordi' })!;
    deleteSet(set.id, 500);
    expect(itemsInSet(state().items, set.id)).toHaveLength(0);
    expect(state().items.find((i) => i.id === item.id)?.deletedAt).toBe(500);
    expect(state().itemOutbox).toContain(item.id);
  });
});

describe('items', () => {
  it('adds a word, tidied, and remembers the set for next time', () => {
    const set = createSet('A');
    const item = addItem({ setId: set.id, text: ' besluttet at, ', meaning: '  ', context: 'Skolen har besluttet at.' })!;
    expect(item).toMatchObject({ text: 'besluttet at', meaning: null, refId: null });
    expect(state().lastSetId).toBe(set.id);
  });

  it('refuses a word the set already has, ignoring case and punctuation', () => {
    const set = createSet('A');
    addItem({ setId: set.id, text: 'Fordi' });
    expect(addItem({ setId: set.id, text: 'fordi.' })).toBeNull();
    expect(findInSet(state().items, set.id, 'FORDI')).not.toBeNull();
    // Another set may have it.
    const other = createSet('B');
    expect(addItem({ setId: other.id, text: 'fordi' })).not.toBeNull();
  });

  it('edits, removes and restores a word', () => {
    const set = createSet('A');
    const item = addItem({ setId: set.id, text: 'bøgerne' }, 100)!;
    updateItem(item.id, { text: 'bog', meaning: 'book' }, 200);
    expect(itemsInSet(state().items, set.id)[0]).toMatchObject({ text: 'bog', meaning: 'book', updatedAt: 200 });
    removeItem(item.id, 300);
    expect(itemsInSet(state().items, set.id)).toHaveLength(0);
    restoreItem(item.id, 400);
    expect(itemsInSet(state().items, set.id)).toHaveLength(1);
  });
});

describe('sync support', () => {
  it('takes the newer copy from the server, but never over an unsent local change', () => {
    const set = createSet('Local', 100);
    markSetsUploaded({ sets: [set], items: [] });
    mergeSets([{ ...set, name: 'Remote', updatedAt: 200 }], []);
    expect(state().sets[0].name).toBe('Remote');

    renameSet(set.id, 'Mine', 300);
    mergeSets([{ ...set, name: 'Remote again', updatedAt: 400 }], []);
    expect(state().sets[0].name).toBe('Mine');
  });

  it('lets a newer removal from another device win', () => {
    const set = createSet('A', 100);
    const item = addItem({ setId: set.id, text: 'fordi' }, 100)!;
    markSetsUploaded({ sets: [state().sets[0]], items: [item] });
    mergeSets([], [{ ...item, deletedAt: 200, updatedAt: 200 }]);
    expect(itemsInSet(state().items, set.id)).toHaveLength(0);
  });

  it('keeps an old server copy from bringing back a newer removal', () => {
    const set = createSet('A', 100);
    const item = addItem({ setId: set.id, text: 'fordi' }, 100)!;
    removeItem(item.id, 300);
    markSetsUploaded({ sets: state().sets, items: state().items });
    mergeSets([], [item]);
    expect(itemsInSet(state().items, set.id)).toHaveLength(0);
  });

  it('keeps a row queued if it changed again while uploading', () => {
    const set = createSet('A', 100);
    const sent = { sets: [...state().sets], items: [] };
    renameSet(set.id, 'B', 200);
    markSetsUploaded(sent);
    expect(state().setOutbox).toEqual([set.id]);
  });

  it('starts each user from their own saved copy', async () => {
    await switchSetsUser('alice');
    createSet('Alice’s');
    await switchSetsUser('bob');
    expect(state().sets).toHaveLength(0);
  });
});
