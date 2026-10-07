/**
 * Supabase Edge Function: a short English meaning for a Danish word or
 * phrase, as it is used in the sentence the learner picked it out of.
 *
 * The app suggests this meaning when a word is added to a vocabulary set and
 * the deck doesn't already have it. It asks DeepL, passing the sentence as
 * context (which steers the translation and isn't billed). The DeepL key
 * lives here, as a Supabase secret, never in the app: a web bundle or a phone
 * binary is public. Only signed-in learners get an answer.
 *
 * Deploy:  npx supabase functions deploy gloss
 * Secret:  npx supabase secrets set DEEPL_API_KEY=…   (a Free key ends in ":fx")
 *
 * Request:  POST { text: string, context?: string | null }  (with the user's session)
 * Response: 200 { gloss: string | null }
 */

import { createClient } from 'npm:@supabase/supabase-js@2.117.3';

/** The same limits the app puts on a picked-out phrase, plus room for its sentence. */
const MAX_TEXT = 80;
const MAX_CONTEXT = 400;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const DEEPL_KEY = Deno.env.get('DEEPL_API_KEY') ?? '';
// Free keys end in ":fx" and have their own host.
const DEEPL_URL = DEEPL_KEY.endsWith(':fx')
  ? 'https://api-free.deepl.com/v2/translate'
  : 'https://api.deepl.com/v2/translate';

/**
 * A translation, made to read like a dictionary gloss: no closing full stop,
 * and lower case at the start unless the Danish started with a capital.
 */
function asGloss(danish: string, english: string): string {
  const g = english.trim().replace(/[.!]+$/, '');
  const danishLower = danish[0] === danish[0]?.toLowerCase();
  // Leave "I …" and acronyms ("EU", "TV") alone.
  const keepCapital = /^I\b/.test(g) || /^\p{Lu}{2}/u.test(g);
  return danishLower && !keepCapital ? g.charAt(0).toLowerCase() + g.slice(1) : g;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!DEEPL_KEY) return json({ error: 'DEEPL_API_KEY is not set' }, 500);

  // A signed-in learner, not just anyone holding the app's public key.
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
  );
  const { data: user } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
  if (!user?.user) return json({ error: 'Sign in first' }, 401);

  let body: { text?: unknown; context?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Send JSON' }, 400);
  }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const context = typeof body.context === 'string' ? body.context.trim().slice(0, MAX_CONTEXT) : '';
  if (!text || text.length > MAX_TEXT) return json({ error: 'A word or a short phrase, please' }, 400);

  const res = await fetch(DEEPL_URL, {
    method: 'POST',
    headers: { Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: [text],
      source_lang: 'DA',
      target_lang: 'EN-GB',
      ...(context ? { context } : {}),
    }),
  });
  if (res.status === 429 || res.status === 456) {
    // 456: the month's free characters are used up.
    return json({ error: 'Translation quota reached, try again later' }, 429);
  }
  if (!res.ok) {
    console.error('DeepL error', res.status, await res.text());
    return json({ error: 'Lookup failed' }, 502);
  }
  const data = (await res.json()) as { translations?: { text?: string }[] };
  const english = data.translations?.[0]?.text?.trim();
  // DeepL hands back the Danish unchanged when it has nothing better.
  if (!english || english.toLowerCase() === text.toLowerCase()) return json({ gloss: null });
  return json({ gloss: asGloss(text, english) });
});
