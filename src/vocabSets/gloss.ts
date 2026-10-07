/**
 * A suggested English meaning for a picked-out word that the deck doesn't
 * have, from the `gloss` Supabase function (supabase/functions/gloss), which
 * has DeepL translate it, using the sentence it came from as context.
 *
 * A suggestion is a convenience, never a requirement: offline, signed out, or
 * with the function not deployed, this quietly gives null and the learner
 * types the meaning themselves.
 */

import { supabase } from '../auth/supabase';
import { normalise } from './match';

const cache = new Map<string, Promise<string | null>>();

export function suggestMeaning(text: string, context: string | null | undefined): Promise<string | null> {
  const key = `${normalise(text)}\n${context ?? ''}`;
  const had = cache.get(key);
  if (had) return had;
  const asked = ask(text, context ?? null);
  cache.set(key, asked);
  // A failure may be passing (offline): don't remember it.
  asked.then((g) => g === null && cache.delete(key));
  return asked;
}

async function ask(text: string, context: string | null): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke<{ gloss: string | null }>('gloss', {
      body: { text, context },
    });
    if (error || !data) return null;
    return data.gloss?.trim() || null;
  } catch {
    return null;
  }
}
