/**
 * Ids that used to exist and must never be reused.
 *
 * Learner progress points at content by id — grammar exercise ids in `seen`
 * and `history`, vocabulary word ids, and every domain's rule ids as stat
 * keys. Deleting an item is fine; *reusing* its id for a different item would
 * silently credit a learner with practice they never did, and renaming one
 * would orphan the practice they did. So an id that leaves the content goes
 * here, with the date and a reason, and `ids.test.ts` refuses any id that
 * vanishes without an entry.
 */

/** Retired content or rule id → why and when it left. */
export const RETIRED_IDS: Record<string, string> = {};

/**
 * Renamed rule ids: old → new. Stored stats keyed by an old id are carried
 * over to the new one on load, so a rename never resets anyone's mastery.
 * An aliased old id must also be listed in RETIRED_IDS.
 */
export const RULE_ALIASES: Record<string, string> = {};

/** Re-key a stats record through RULE_ALIASES. A key that already exists under its new name wins over the alias. */
export function remapAliases<T>(stats: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(stats)) {
    const target = RULE_ALIASES[key];
    if (target === undefined) out[key] = value;
    else if (!(target in stats)) out[target] = value;
  }
  return out;
}
