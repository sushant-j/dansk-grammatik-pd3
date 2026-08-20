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
- **Diagnostic engine** — classifies a wrong answer into the specific rule it
  violates (V2, the ikke-regel, Forfelt overload, verb-cluster splitting,
  adverbial type confusion, missing subject) and explains it in the learner's
  own words. Accepts genuinely valid alternative word orders.
- **Rule cards** — statement, mechanism, why-it's-hard, and contrasting
  wrong/right pairs, with a schema diagram. The `ikke-regel` card shows both
  topologies side by side so the mirror-image rule is visible at a glance.
- **Grammar map** — per-rule mastery with time decay and "needs a refresh"
  states, driving what the trainer serves next.
- **Writing studio** — PD3-style letter and essay prompts with an offline,
  deterministic checker for word order and the `at`/`og` trap.

## Architecture

```
app/                       expo-router screens
  index.tsx                grammar map (home)
  train.tsx                the schema trainer
  write.tsx                writing studio
  rule/[id].tsx            rule card
src/
  grammar/
    fields.ts              the two field topologies
    rules.ts               rule catalogue — the unit of both feedback and mastery
    analyze.ts             diagnostic engine
    types.ts
  content/exercises.ts     PD3 sentence bank
  profile/store.ts         learner model (zustand + AsyncStorage)
  feedback/
    types.ts               provider contract
    offlineRules.ts        deterministic checker
    claudeCoach.ts         AI coach — interface complete, transport stubbed
  ui/                      theme, primitives, SchemaBoard
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
- **Web** — runs, and is the fastest way to iterate.

## Roadmap

The schema engine generalises; the next modules reuse the rule catalogue and the
mastery map wholesale.

- En/et gender and the definite suffix, including double definiteness
  (*den røde bil*, not *den røde bilen*)
- Adjective agreement across the three forms
- The tense system, and the -te/-ede weak split against the strong verbs
- Komma rules, and FVU-oriented spelling
- Live AI review of full letters, with corrections linked to rule cards
- PD2 and FVU level tagging (the content schema already carries `exams` and
  `cefr` on every item)
