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

## Architecture

```
app/                       expo-router screens
  index.tsx                home: grammar map + module links
  train.tsx                the schema trainer
  write.tsx                writing studio
  vocab.tsx                vocabulary flashcards
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
    exercises.ts           PD3 sentence bank (schema trainer)
    nouns.ts                noun bank with hand-verified definite/wrong forms
    adjectives.ts             adjective bank (base/-t/-e forms)
    verbs.ts                   verb bank (weak/strong, past + participle + aux)
    commaExamples.ts             hand-written correct/incorrect sentence pairs
    spellingExamples.ts            hand-written fill-in-the-blank word pairs
    topics.ts               oral-exam archive: TOPICS, OFFICIAL_SESSIONS, PRACTICE_TOPICS
    vocabulary.ts            hard-word bank, each entry traced to a real sentence
  profile/
    mastery.ts              shared decay/leveling math (all seven domains below)
    store.ts                grammar learner model (zustand + AsyncStorage)
    vocabStore.ts            vocabulary learner model, same mastery math
    nounStore.ts             noun-rule learner model, same mastery math
    adjectiveStore.ts         adjective-rule learner model, same mastery math
    verbStore.ts               verb-rule learner model, same mastery math
    commaStore.ts                comma-rule learner model, same mastery math
    spellingStore.ts               spelling-rule learner model, same mastery math
    settings.ts                     target-exam preference (persisted, biases the two above)
  feedback/
    types.ts               provider contract
    offlineRules.ts        deterministic checker
    claudeCoach.ts          AI coach — interface complete, transport stubbed
  ui/
    Screen.tsx              max-width wrapper — the phone→web responsive seam
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
