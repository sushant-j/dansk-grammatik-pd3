# Skema — Danish grammar for PD3

A grammar-first Danish learning app for Android and iOS. It teaches **why** a
sentence is right, using the *sætningsskema* (Diderichsen's field model) that
Danish schools actually teach with — and it has no streaks.

## Why this exists

Every app on the market optimises for something other than grammar. Speaking
apps drill topics and never explain word order. Duolingo recycles the same
sentences and makes the streak the reason to return. Nothing addresses the
written exam — the letter and the topic piece — that PD3 candidates actually sit.

Three commitments follow from that:

1. **Every correction names a rule and explains the mechanism.** A learner who
   moves a word to the right slot without knowing which rule put it there has
   learned nothing transferable.
2. **The visualisation is the pedagogy, not decoration.** The field schema is
   how Danish word order is taught in Denmark. Making it interactive is the
   whole product.
3. **Progress is a map of what you understand, not a count of days.** Mastery is
   tracked per grammar rule, decays honestly over time, and shows you the gaps.
   Nothing is lost by taking a week off.

## What works today

- **Sætningsskema trainer** — tap-to-place word ordering across both clause
  topologies, with a live preview reading your arrangement back as a sentence.
  Includes complex sentences: double objects with fixed receiver-then-thing
  order, three-way stacked adverbials (manner/place/time), and "som" relative
  clauses that obey the same subordinate-clause rules as "fordi" and "hvis".
- **Diagnostic engine** — classifies a wrong answer into the specific rule it
  violates (V2, the ikke-regel, Forfelt overload, verb-cluster splitting,
  adverbial type confusion, missing subject, object order, adverbial order,
  relative clauses) and explains it in the learner's own words. Attributes
  errors by which fields are actually involved, not by the exercise's headline
  rule — a misplaced adverbial is never reported as an inversion error just
  because inversion is what the sentence was built to drill. Accepts
  genuinely valid alternative word orders.
- **Rule cards** — statement, mechanism, why-it's-hard, and contrasting
  wrong/right pairs, with a schema diagram that renders against whichever
  clause topology the rule actually constrains. The `ikke-regel` card shows
  both topologies side by side so the mirror-image rule is visible at a
  glance.
- **Grammar map** — per-rule mastery with time decay and "needs a refresh"
  states, driving what the trainer serves next.
- **Writing studio** — PD3-style letter and essay prompts with an offline,
  deterministic checker for word order and the `at`/`og` trap.
- **Emnearkiv (oral-exam topic archive)** — 57 real PD3 *mundtlig
  kommunikation* topics transcribed from actual exam sessions, 2011–2020, each
  with its obligatory questions, follow-ups, and full model answers, plus the
  two most recent official sessions (2023) transcribed from the exam prompt
  sheets. Full-text search across titles, questions, and answers, filterable
  by year — "what has this exam actually asked, and when." A separate
  practice-topic set, clearly labelled as not-a-real-exam-question, covers
  registers the archive doesn't reach yet (politics, inequality, parental
  leave), written to the exam's own question pattern (Årsag, Konsekvens,
  Fordele/Ulemper, Holdning).
- **Ordforråd (vocabulary flashcards)** — 35 hard words and discourse
  connectors pulled from the real corpus above, each carrying the actual
  sentence it came from rather than a bare translation. Flip-and-self-grade,
  with the same decaying-mastery model as the grammar map (`profile/mastery.ts`
  is shared between the two) — a word "known" once and never revisited fades
  back to "needs review" instead of a false permanent green checkmark.
- **My sets (your own vocabulary)** — select a word or phrase in any reading
  text (web) and choose **＋ Add to set** to file it, with the sentence it came
  from, into a set of your own. A word the deck already has (in any of its
  forms) links to that card and shares its progress; anything else becomes your
  own card, with an English meaning suggested by DeepL from the sentence
  (editable, never overwriting what you type). Sets are practised in the same
  flashcard trainer (Vocabulary → *My sets*), never move your vocab niveau, and
  sync to your account. On a phone, words are added from the set's own screen —
  React Native text has no selection events to hook a menu into.
- **Responsive web build** — content is capped at a comfortable reading width
  and centered, so the same screens that were designed at phone width don't
  stretch edge-to-edge on a desktop browser. `npm run build:web` produces a
  fully static export deployable to any static host.
- **En-ord og et-ord (gender & double definiteness)** — multiple-choice, not
  tap-to-place, because gender is a lexical fact to recognise rather than a
  position to arrange. Three rules (en/et gender, the definite suffix,
  double definiteness), each wrong option the specific mistake that noun
  invites rather than an arbitrary distractor, mastery tracked per rule via
  the same shared `mastery.ts`.
- **Adjektivets former (adjective agreement)** — the same multiple-choice
  shape, one level up: base form before an en-word, -t before an et-word, -e
  for every plural or definite phrase regardless of gender. Distractors are
  built by deduping an adjective's three real forms against whichever is
  correct, so the two deliberately irregular entries ("dansk", "lille")
  produce a clean two-option question instead of two identical buttons —
  no special-casing needed.
- **Datid og førnutid (tense)** — three rules that are genuinely different in
  kind, not just in vocabulary: the weak -ede/-te suffix choice (a leaky
  phonological pattern), strong-verb forms (pure memorisation, the verb
  equivalent of en/et gender), and the er/har perfect auxiliary (a semantic
  fact — motion or change of state — that cuts across weak and strong verbs
  alike). Every distractor is the specific error a learner actually produces:
  the other weak suffix, or an over-regularised guess at a strong verb's form.
- **Kommaregler (comma rules)** — a different shape from every other module:
  a comma decision depends on the structure of a whole sentence, not a
  property of one word, so there is no per-word generator — the exercise
  bank is hand-written correct/incorrect sentence pairs, and the options
  shown are full sentences rather than single words. Scoped to three rules
  that are genuinely unambiguous (comma before "men" but never before "og";
  no comma before the final item in a list; commas around a non-defining
  relative clause). The contested "startkomma" — optional under the modern
  1996 rules, not a hard requirement — is deliberately left out rather than
  graded as a right/wrong answer it isn't.
- **Stavning (FVU-oriented spelling)** — a different audience from every
  other module: FVU targets adult literacy, including for some native
  speakers, so the failure mode is sound not matching spelling, not a
  grammar choice. Four unambiguous rules — silent d after l/n/r ("hund" vs
  "hun", real minimal-pair words a learner can accidentally spell into),
  silent h in hv-words ("hvad" vs "vad", pronounced identically either way),
  "nogen" vs "nogle" (sentence-type-dependent, one of the most commonly
  confused spellings even among native speakers), and "og" vs "at" before an
  infinitive (near-homophones — "jeg prøver at komme", not "og komme" — an
  error of the ear, not of grammar). 25 hand-written fill-in-the-blank
  sentences, and the "og"/"at" pool deliberately includes genuine "og" cases
  ("brød og mælk") so the skill is discriminating, not defaulting to "at".
  Same shape as the comma module, for the same reason: a spelling confusion
  is tied to a specific real word pair, not a property a generator can derive.
- **Eksamensfokus (exam-target setting)** — a bias, not a filter. Picking
  PD2, PD3, or FVU never removes anything from the grammar map; it sorts
  exam-relevant rules to the top, marks the rest "NOT ON {exam}", and leans
  the sætningsskema trainer toward exercises tagged for that exam — but a
  rule the learner is genuinely weak on can still win the draw, because the
  exam tag breaks ties, it doesn't override mastery. Scoped to what's
  actually tagged (`rules.ts` + `exercises.ts`); vocabulary carries CEFR
  levels, not exam tags, and isn't force-fit into this. FVU is handled
  honestly: its real trainer is the spelling module, so on the word-order map
  only the two most basic sentence rules (subject required, verb in slot two)
  are tagged FVU rather than pretending the full sætningsskema is FVU-level —
  the picker's own copy says as much, and a regression guard keeps every
  offered exam, FVU included, from ever dimming the whole map to a dead-end.
- **App-wide "widest gap"** — the Today tab's headline recommendation rolls
  up every trainer, not just the word-order map. A learner solid on word order
  but shaky on verbs is now pointed at verbs, not told "you're doing great"
  and handed a word-order card that isn't their real gap. `profile/overview.ts`
  aggregates all seven mastery stores to one honest picture (roll-up count,
  and the single domain with the most open gaps), working at the domain level
  so per-word vocabulary doesn't drown out the per-rule trainers. The headline
  card keeps its rich per-rule detail when word order *is* the priority, and
  hands off to the right trainer when it isn't.
- **Exam study plan** — set your exam date and the Today tab turns the
  cross-domain roll-up into a paced, time-bound plan: a countdown, and a
  readiness band (on-track / tight / behind / ready) with a message whose
  maths the learner can check — things not yet solid ÷ weeks left. Two
  honesty rules hold throughout: "ready" means solid on everything *this app
  teaches*, never a guarantee of passing (the app doesn't test speaking,
  task fulfilment, or examiner judgement), and the pace is arithmetic, not a
  hidden model. The date is set with presets plus day/week adjusters — no
  native date-picker dependency, so it behaves identically on web, Android,
  iOS, and Expo Go. `profile/studyplan.ts` is a pure function over the
  overview summary; `profile/settings.ts` holds the persisted date and the
  shared day-maths both the plan and the settings display read from.
- **First-open welcome** — the app is shared with PD3, PD2, and FVU learners
  at once, so a newcomer's first decision is "which exam am I here for",
  landing them on the right focus instead of leaving them to find the level
  pill. Shown exactly once (a persisted `onboarded` flag, gated on `hydrated`
  so it never flashes for a returning user), with a first-class "just show me
  everything" for people not sitting a specific exam. Same honesty as the
  settings screen: it tailors order, hides nothing, changeable anytime.
- **Accounts that sync** — progress belongs to a signed-in account
  (Supabase: email + password), so it follows the learner to any device and
  survives a cleared browser. The web build is still fully static; the app
  talks to Supabase directly, and row-level security keeps every user to
  their own rows. See *Accounts and progress* below.
- **Niveau 1–5, beginner to PD3** — every exercise carries a niveau, shown on
  its card. Each trainer serves material up to the learner's niveau and moves
  them up after 20 answers at 80% right. See *Content* below.
- **Shareable static build** — `npm run build:web` produces a self-contained
  `dist/`. `vercel.json` (and `public/_redirects` for Netlify) ship the SPA
  fallback so deep links and refreshes survive.

## Architecture

```
app/                       expo-router screens
  _layout.tsx              root Stack: fonts, onboarding gate, trainers push over the tabs
  (tabs)/_layout.tsx       bottom tabs: Today · Practise · Exam · Progress
  (tabs)/index.tsx         Today: exam countdown + the one thing to do next
  (tabs)/practise.tsx      every trainer, grouped by skill, with mastery bars
  (tabs)/exam.tsx          exam guide + oral topics + writing practice
  (tabs)/progress.tsx      overall mastery, streak, per trainer, grammar map
  train.tsx                the schema trainer
  write.tsx                writing studio
  vocab.tsx                vocabulary flashcards (the deck, or your own sets)
  sets/index.tsx           your vocabulary sets
  sets/[id].tsx            one set: its words, practise, add / edit / remove
  nouns.tsx                en/et gender & double-definiteness trainer
  adjectives.tsx           adjective agreement trainer
  verbs.tsx                tense trainer (weak suffix, strong verbs, er/har)
  comma.tsx                comma trainer (full-sentence multiple choice)
  spelling.tsx             FVU spelling trainer (silent d, silent h, nogen/nogle)
  settings.tsx             exam-target picker (bias, not a filter)
  rule/[id].tsx            rule card
  topics/index.tsx         oral-exam archive search
  topics/[id].tsx          one archive topic, full Q&A
  topics/practice.tsx      practice-topic index (clearly marked non-exam)
  topics/practice/[id].tsx one practice topic
src/
  grammar/
    fields.ts              the two field topologies
    rules.ts               sætningsskema rule catalogue (word order)
    nounRules.ts            noun-phrase rule catalogue (gender, definiteness)
    adjectiveRules.ts        adjective-agreement rule catalogue
    verbRules.ts              tense rule catalogue
    commaRules.ts               comma rule catalogue
    spellingRules.ts              FVU spelling rule catalogue
    analyze.ts              diagnostic engine (word order)
    nounExercise.ts          multiple-choice question builder (nouns)
    adjectiveExercise.ts      multiple-choice question builder (adjectives)
    verbExercise.ts            multiple-choice question builder (verbs)
    commaExercise.ts             packages a comma-example entry into a question
    spellingExercise.ts            packages a spelling-example entry into a question
    types.ts
  content/
    levels.ts              the niveau 1–5 scale and the level-aware pool picker
    data/*.json            the drafted banks (and verbs.json, imported — see below)
    exercises.ts           sentence bank (schema trainer): hand-written + data/exercises.json
    compact.ts               one-line authoring format for sentence exercises
    nouns.ts                noun bank: hand-written + data/nouns.json
    adjectives.ts             adjective bank (base/-t/-e forms)
    verbs.ts                   500 verbs: data/verbs.json (forms) + data/verbs.meta.json (gloss, niveau)
    commaExamples.ts             correct/incorrect sentence pairs
    spellingExamples.ts            fill-in-the-blank word pairs
    retired.ts                 retired ids and renamed rules (never reuse an id)
    content-ids.lock.json      every id that has ever shipped
    topics.ts               oral-exam archive: TOPICS, OFFICIAL_SESSIONS, PRACTICE_TOPICS
    vocabulary.ts            hard-word bank, each entry traced to a real sentence
  profile/
    mastery.ts              shared decay/leveling math (all seven domains below)
    store.ts                grammar learner model (a view of the progress log)
    levelStore.ts            niveau climb per trainer
    vocabStore.ts            vocabulary learner model, same mastery math
    nounStore.ts             noun-rule learner model, same mastery math
    adjectiveStore.ts         adjective-rule learner model, same mastery math
    verbStore.ts               verb-rule learner model, same mastery math
    commaStore.ts                comma-rule learner model, same mastery math
    spellingStore.ts               spelling-rule learner model, same mastery math
    settings.ts                     target-exam preference + exam date (persisted); shared day-maths
    overview.ts                      cross-domain roll-up — the app-wide "widest gap"
    studyplan.ts                     exam date + roll-up → paced, honest readiness plan
  vocabSets/
    store.ts               your sets and their words; tombstones, newer-wins merge
    sync.ts                pull / upload, as for reading-paper attempts
    match.ts               deck lookup by any form, phrase tidying, sentence cutting
    cards.ts               set words as flashcards (the deck's card, or your own)
    gloss.ts               suggested English meaning, from the `gloss` function
  sync/
    types.ts               progress events and baselines
    replay.ts              rebuilds all progress from the log (pure)
    log.ts                 the signed-in user's log on this device; publishes into the stores
    sync.ts                pull / upload / profile, retried until it succeeds
    remote.ts              the Supabase tables, behind a small interface
    legacy.ts              moves pre-account device progress into the first account
  auth/
    supabase.ts, session.ts  client, sign-in state, account actions
  feedback/
    types.ts               provider contract
    offlineRules.ts        deterministic checker
    claudeCoach.ts          AI coach — interface complete, transport stubbed
  ui/
    SignIn.tsx               sign-in / create-account gate
    Onboarding.tsx           first-open "which exam?" welcome (shown once)
    LevelBadge.tsx           "Niveau 3 · B1" badge and the level-up notice
    Screen.tsx              max-width wrapper — the phone→web responsive seam
    exam/SelectionCapture.web.tsx  select text in a reading paper → "Add to set"
    vocab/AddToSetSheet.tsx  add / edit a set word (deck match, meaning, set)
    Snackbar.tsx             short confirmation with Undo
supabase/
  migrations/              numbered, additive-only schema changes
  functions/gloss/         Edge Function: DeepL meaning for a picked-out word
    theme.ts, primitives.tsx, SchemaBoard.tsx
```

Key design decisions and their rationale live in the header comment of each
module.

### Tap-to-place, not drag-and-drop

Dragging a word across seven narrow targets on a 390pt screen is a dexterity
test, not a grammar test, and it is unusable with a screen reader. Tap the word,
tap its field.

### The Forfelt accepts two words

It should hold exactly one constituent. The board deliberately lets you put two
in, because an error you cannot express is an error nobody can teach you about.
Build "I går jeg gik", then get told which rule you broke.

## Running it

```bash
npm install
```

```bash
npx expo start
```

Add `--web`, `--android`, or `--ios`. Tests and typecheck:

```bash
npm test && npm run typecheck
```

> **Note:** `babel.config.js` requires `babel-preset-expo` as a direct
> dependency — it is not hoisted from `expo` and Metro fails to construct its
> transformer without it.

### Web build

```bash
npm run build:web
```

Produces a fully static `dist/` — no server-side rendering, no API routes —
deployable as-is to Netlify, Vercel, GitHub Pages, S3, or any static host.
`npm run serve:web` serves that build locally to sanity-check it before
deploying.

## Accounts and progress

Progress is an **append-only log of events** — every answer, every niveau set
by hand, every reset — and every stat, niveau, streak day and "seen" list is
derived by replaying it (`src/sync/replay.ts`). Consequences:

- **Two devices never overwrite each other.** They only add events; events
  carry a client-made uuid, so a retried upload is a no-op.
- **Works offline.** Answers are recorded locally first and uploaded later.
- **Changing the mastery or niveau math loses nothing**: replay the same log.
- **Two people on one browser stay separate**: each user's log is saved under
  its own key.
- **Progress from before accounts is kept**: the first account that signs in
  on a device takes over that device's old saves as a starting baseline
  (`src/sync/legacy.ts`). The old saves are never deleted.

### Setting up Supabase (once)

1. Create a project at supabase.com (the free plan needs no card).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`.
3. Authentication → Sign In / Providers → Email: turn **Confirm email** off
   (the built-in sender is limited to a few emails an hour; set up custom SMTP
   before turning it back on).
4. Put the project URL and publishable key in `.env.local` (and in the Vercel
   project's environment variables):

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable or anon key>
   ```

   Both are public by design; row-level security is what protects the data.

Schema changes go in a new numbered file in `supabase/migrations/` and only
ever **add** — never drop or rewrite a column progress lives in.

### Reading papers (official PD3 papers)

The official reading papers are not in this repo or the app bundle; they are
served from Supabase to signed-in users only. To set them up:

1. In the SQL editor, run `supabase/migrations/0002_exam.sql` (the
   `exam_papers` and `exam_attempts` tables).
2. Add the project's **secret** key to `.env.local` — server-side only, never
   with an `EXPO_PUBLIC_` prefix, never in Vercel:

   ```
   SUPABASE_SECRET_KEY=<secret / service-role key>
   ```

3. With the transcribed papers in `content-private/exams/` (gitignored), run
   `npm run exam:upload`. It validates every paper, then uploads the ones that
   changed.

Simulated papers ship with the app (`src/content/exams/simulated/`) and need
none of this.

### Vocabulary sets and suggested meanings

1. In the SQL editor, run `supabase/migrations/0003_vocab_sets.sql` (the
   `vocab_sets` and `vocab_set_items` tables). Until then sets are kept on
   the device and their upload quietly retries.
2. For the suggested English meanings, deploy the `gloss` Edge Function with a
   DeepL API key (the free tier is plenty; context characters aren't billed).
   Run these in your own terminal — `supabase login` needs an interactive one:

   ```
   npx supabase login
   npx supabase secrets set --project-ref <ref> DEEPL_API_KEY=<key>
   npx supabase functions deploy gloss --project-ref <ref>
   ```

   The key stays in Supabase; the function only answers signed-in users.
   Without it, adding words still works — the meaning is just typed by hand.

## Content

Every bank item has a stable `id`, a `level` (niveau 1–5) and, for drafted
content, `reviewed: false` until a person has checked the Danish.

- **Adding items**: append to the bank (or its `data/*.json`), then run
  `npm run content:lock` to accept the new ids. The tests check structure
  (genders vs. suffixes, distractors, comma pairs that differ only in commas,
  sentence solutions that grade as correct) and print each bank's size per
  niveau and how much is still unreviewed.
- **Changing an item**: keep its id for a fix; give it a new id if it becomes
  a different item.
- **Removing an item**: move its id to `RETIRED_IDS` in `retired.ts`. An id
  is never reused. Renaming a rule: add it to `RULE_ALIASES`, and stored
  stats move to the new name.
- **Verbs** are imported from basby.dk's *500 most common verbs in Danish*:
  `node scripts/import-verbs.mjs` regenerates `data/verbs.json`; glosses and
  niveaus live in `data/verbs.meta.json`.
- **Sentence exercises** are written in the compact format, e.g.
  `"F:i går | v:gik | n:jeg | a:ikke | A:på arbejde"` (see `compact.ts`).

## Wiring up the AI writing coach

`src/feedback/claudeCoach.ts` is complete except for the transport. It talks to
a backend proxy, never to Anthropic directly:

**Never ship an API key in the app bundle.** A mobile binary is a public
artifact and anything compiled into it is extractable. The proxy holds the key
and applies per-user rate limiting.

1. Stand up a proxy exposing `POST /review` that accepts a `CoachRequest` and
   returns `WritingFeedback` (both defined in `src/feedback/`).
2. Have it call the Claude API using `COACH_SYSTEM_PROMPT`, which requires every
   correction to cite the rule and the schema field involved.
3. Set `EXPO_PUBLIC_COACH_URL` to the proxy origin.

Until then `activeProvider()` returns the offline checker, and the UI labels
which provider reviewed the text.

## Platform status

- **Android** — builds and runs; SDK is installed on the dev machine.
- **iOS** — one codebase away, but needs Xcode (not just Command Line Tools) or
  an EAS cloud build.
- **Web** — runs in dev, and `npm run build:web` produces a verified static
  export (zero console errors on a cold static-file-server load).

## Content provenance

The oral-exam archive and vocabulary bank are transcribed from a learner's own
study materials: exam-session PDFs (official *Mundtlig kommunikation* prompt
sheets, Undervisningsministeriet / Niels Roland illustrations) and a
hand-compiled 2011–2024 Q&A document. `TOPICS` in `src/content/topics.ts`
carries only sessions with a real transcribed Q&A; `OFFICIAL_SESSIONS` carries
the two most recent sessions title-only, because those source sheets are
picture prompts with no printed answer key; `PRACTICE_TOPICS` is clearly
separated because it was written to match the exam's question pattern rather
than transcribed from one, and every screen that shows it says so.

The **reading papers** come in two kinds. Official PD3 papers (2015–2024) are
transcribed from the learner's own copies of the SIRI exam booklets, with the
censor booklets' answer keys and each session's point-to-grade table. Because
this repo is public and the web build is a static bundle, the transcriptions
live in a gitignored folder (`content-private/`) and are served from Supabase
only to signed-in users; each paper is labelled with its session. Simulated
papers (`src/content/exams/simulated/`) are written for the app in the current
format, modelled on the official ones, and are labelled as simulated wherever
they appear. sim-1–3 turned out easier than the official papers and are listed
as warm-ups; sim-4 on are marked `level: 'exam'` and must stay within the
official current-format papers' range on readability (LIX), question shape and
answer cues: `npm run exam:difficulty` measures every paper against the
official ones (when `content-private/` is present) and fails if an exam-level
paper falls outside. A simulated paper's content never changes once shipped —
attempts store answers by question position — so harder papers are added under
new ids, never written over old ones.

## Roadmap

The schema engine and the mastery model both generalise; the next modules
reuse them wholesale rather than rebuilding parallel systems.

- Live AI review of full letters, with corrections linked to rule cards
  (needs a live backend proxy holding the API key — infrastructure to stand
  up, not something to scaffold blind)
- Extend the archive search to the FVU/PD2 written-exam materials once
  transcribed, using the same `Topic`/search pattern
- Extend the exam-target bias to vocabulary once it carries `exams` tags of
  its own (today it's CEFR-only, a genuinely different axis)
