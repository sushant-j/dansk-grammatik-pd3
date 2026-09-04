/**
 * In-memory AsyncStorage stand-in for tests.
 *
 * The real @react-native-async-storage/async-storage checks for `window` on
 * import, which doesn't exist in Vitest's node environment — any test that
 * touches a persisted zustand store's own setter (not just its pure derived
 * selectors) hits an unhandled rejection without this. The package ships an
 * official Jest mock, but it's built on `jest.fn`, a global Vitest doesn't
 * provide, so a small honest mock here is more robust than shimming Jest
 * compatibility just to use it. Aliased in via vitest.config.ts, so every
 * test gets this automatically — nothing per-file to remember.
 */

const store = new Map<string, string>();

export default {
  getItem: async (key: string) => store.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: async (key: string) => {
    store.delete(key);
  },
  clear: async () => {
    store.clear();
  },
};
