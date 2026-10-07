import { beforeEach, describe, expect, it } from 'vitest';
import { addItem, createSet, removeItem, switchSetsUser, useVocabSets } from './store';
import { syncSets, type SetsRemote } from './sync';
import type { SetItem, VocabSet } from './types';

/** A server that keeps whatever it is sent, by id, as an upsert does. */
function fakeServer() {
  const sets = new Map<string, VocabSet>();
  const items = new Map<string, SetItem>();
  const remote: SetsRemote = {
    async pull() {
      return { sets: [...sets.values()], items: [...items.values()] };
    },
    async push(s, i) {
      for (const x of s) sets.set(x.id, x);
      for (const x of i) {
        // As the foreign key would: a word's set must already be there.
        if (!sets.has(x.setId)) throw new Error('set missing');
        items.set(x.id, x);
      }
    },
  };
  return { remote, sets, items };
}

beforeEach(async () => {
  await switchSetsUser(`u-${Math.random()}`);
});

describe('syncSets', () => {
  it('uploads new sets before their words, and empties the outboxes', async () => {
    const server = fakeServer();
    const set = createSet('A');
    addItem({ setId: set.id, text: 'fordi' });
    await syncSets(server.remote);
    expect(server.sets.size).toBe(1);
    expect(server.items.size).toBe(1);
    expect(useVocabSets.getState().setOutbox).toEqual([]);
    expect(useVocabSets.getState().itemOutbox).toEqual([]);
  });

  it('carries a word and its removal from one device to another', async () => {
    const server = fakeServer();
    await switchSetsUser('phone');
    const set = createSet('A');
    const item = addItem({ setId: set.id, text: 'fordi' })!;
    await syncSets(server.remote);

    await switchSetsUser('laptop');
    await syncSets(server.remote);
    expect(useVocabSets.getState().items.filter((i) => i.deletedAt === null)).toHaveLength(1);

    removeItem(item.id, Date.now() + 1000);
    await syncSets(server.remote);

    await switchSetsUser('phone');
    await syncSets(server.remote);
    expect(useVocabSets.getState().items.find((i) => i.id === item.id)?.deletedAt).not.toBeNull();
  });

  it('keeps the outbox when the server can’t be reached', async () => {
    const set = createSet('A');
    const offline: SetsRemote = {
      pull: async () => {
        throw new Error('offline');
      },
      push: async () => {},
    };
    await expect(syncSets(offline)).rejects.toThrow('offline');
    expect(useVocabSets.getState().setOutbox).toEqual([set.id]);
  });
});
