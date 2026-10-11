# Diary: Tap or type answers, and a wide-screen layout for the grammar exercises

Grammar exercises used to be answered only by tapping: a word chip and then a schema field, or one option button. This task added typed answers, a layout that fits a question on one desktop screen, and finally kept both input modes: tapping on phones, typing on wide screens, with a setting to override.

## Step 1: Plan typed answers

**Author:** main

### Prompt Context

**Verbatim prompt:** In the grammar exercises, instead of clicking and selecting text components, it would be easier to have a user type them out in boxes for that word component. Can you make a plan to update this?
**Interpretation:** Replace tap-to-select with typing. Plan first; no code yet.
**Inferred intent:** Answering should feel more direct and closer to writing Danish, as the exam requires.

### What I did
I explored the exercise code and found two tap mechanics. The first is the sætningsskema board in `/src/ui/SchemaBoard.tsx` and `/src/ui/SchemaQuestion.tsx`, where you tap a token and then tap a field. The second is the option buttons in `/src/ui/ChoiceQuestion.tsx`, which five screens (`/app/nouns.tsx`, `verbs`, `adjectives`, `spelling`, `comma`) had each copied. I asked which mechanic to change. The user answered "both", with tapping removed. I wrote a plan: a pure grading module, a typed `ChoiceQuestion`, the five screens moved onto it, a text box per schema field, and a sentence-editing variant for commas.

### Why
Grading had to keep producing the same `correct: boolean` and token-id `Placement`. Then `evaluate()`, the mastery model and the stored `AnswerEvent`s would stay untouched, with no migration and no changes to content ids.

### What worked
Checking the data before settling the design. All 136 comma pairs differ only in their commas (a Python check over `/src/content/data/comma.json`), so "the sentence with commas removed, put them back" is a sound typed form of the comma question.

### What didn't work
Nothing failed in this step.

### What I learned
`AnswerEvent` (`/src/sync/types.ts`) stores only outcomes and never the answer text, so the input mode can change freely.

### What was tricky
Prompts that relied on their options being visible. Drill prompts like "Jeg har aldrig ___ i Norge" never name the word. That is why drills and spelling keep a read-only "Words:" hint when typing.

### What warrants review
The plan's decision to hide the options for nouns, verbs and adjectives. It only works because their prompts now name the Danish base word (see step 2).

### Future work
None from this step.

## Step 2: Implement typed answers

**Author:** main

### Prompt Context

**Verbatim prompt:** (plan approved)
**Interpretation:** Implement the plan.
**Inferred intent:** Same as step 1.

### What I did
- **`/src/grammar/typedAnswer.ts`:**
  - `normalizeTyped` ignores case, NFC normalisation and spacing, and never folds æ, ø or å into other letters.
  - `matchOption` finds the option the learner typed. If every option ends with the same words, those words can be left off, so "glædede" counts for "glædede sig".
  - `sameSentence` and `commaSentenceSeed` handle the comma questions.
  - `placementFromTyped` searches the possible splits of the words in a field into tokens, so multi-word chips work. When two tokens have the same text, it picks the copy that agrees with the solution or an alternative.
- **Tests:** `/src/grammar/typedAnswer.test.ts`. One test types out the answer key and every alternative of all word-order exercises and checks that each grades correct.
- **UI:**
  - New `/src/ui/AnswerInput.tsx` (autocorrect and spellcheck off) with an æ ø å key row.
  - `ChoiceQuestion` rewritten for typing; the five screens use it.
  - `SchemaBoard`/`SchemaQuestion` have a text box per field.
  - Keyboard props added to `/src/ui/Screen.tsx`.
- **Prompts:** the builder prompts now name the Danish base word.

### Why
With the matching kept in pure functions, the UI could change without touching grading.

### What worked
- The test that types every exercise's answer key passed first time, across all of `EXERCISES`.
- Before finishing, I checked for any options that collapse together after normalising (for example `I`/`i`, `De`/`de`). There were none in the drills or spelling.

### What didn't work
- My first `str.replace` script for the verb prompts replaced both occurrences in one call, so the second assertion failed with `AssertionError: ('src/grammar/verbExercise.ts', 'prompt: \`Vælg datid af')`. I redid it with `sed`.
- One full `vitest` run failed in an unrelated, randomised vocab test (`expect(hits / runs).toBeGreaterThan(0.5)`). It passed on the next four runs.
- The Chrome extension was not connected, so I couldn't click through the UI. I verified only with `tsc`, the unit tests and by fetching the web bundle from the running dev server.

### What I learned
`react-native-keyboard-controller` (the Expo docs' recommendation) needs a development build. The built-in `ScrollView` props `keyboardShouldPersistTaps="handled"` and `automaticallyAdjustKeyboardInsets` were enough.

### What was tricky
- The gender prompt "Mand — en-ord eller et-ord?" invited the answer "en-ord", which would be graded wrong. I changed it to a gap: "En eller et? ___ mand."
- The adjective prompts only gave English ("a red car — en ___ bil"), which would have turned them into a vocabulary test.

### What warrants review
- `parseField` in `/src/grammar/typedAnswer.ts`, which picks between possible splits.
- The shared-tail leniency in `matchOption`.

### Future work
When the options are hidden, explanations still name the stored wrong form ("ikke 'spisede'") even if the learner typed some other mistake.

## Step 3: Wide-screen layout

**Author:** main

### Prompt Context

**Verbatim prompt:** The vertical layout for the grammar exercises takes a lot of space and makes it hard to glance everything at once without scrolling. Can you try horizontal layout or arranging the spacing/etc. to make it easier to view all important parts in one viewport (typically 1080 or 1440p screen)?
**Interpretation:** Make one exercise, from task to feedback, fit in one desktop screen.
**Inferred intent:** Desktop study without scrolling back and forth.

### What I did
- **`/src/ui/useWide.ts`:** measures the exercise container. At 860px or wider, the exercise uses the wide layout.
- **`/src/ui/RulesPane.tsx`:** `TrainerScreen` lets the practice column grow beyond 760px.
- **Word-order board:** drawn as the textbook's columns.
- **`SchemaQuestion`:** the task sits beside the "Reads as" preview. The word list sits beside the Check controls, and the verdict beside the diagnoses.
- **`ChoiceQuestion`:** the question sits beside its feedback.
- **Progress and topic lists:** the progress bars wrap into a grid, and so do the drill topic cards.

### Why
The vertical board alone was about 700px tall, so the feedback for a sentence landed below the fold at 1080p.

### What worked
Measuring the container with `onLayout` rather than the window, because the rules pane takes 380px of a wide window.

### What didn't work
The browser was still not connected, so I couldn't check the layout visually.

### What I learned
`Label` in `/src/ui/primitives.tsx` takes no `style` or `numberOfLines` props. Use `<Txt variant="label">` for those.

### What was tricky
Restructuring JSX with Python string slicing. The first attempt used an f-string with JSX braces in it and failed with `NameError: name 'onLayout' is not defined`.

### What warrants review
The layout at 1080p and 1440p, with and without the rules pane.

### Future work
None from this step.

## Step 4: Fix chip overflow in narrow columns

**Author:** main

### Prompt Context

**Verbatim prompt:** There are some visual issues with text overflow. Screenshot attached: [Image #1] Maybe allow stacking of the boxes in 2 lines when horizontal space is limited.
**Interpretation:** The "mange studerende" chip spilled out of a column about 120px wide. Wrap the board onto two lines when columns get too narrow.
**Inferred intent:** The column board should stay readable at any width.

### What I did
- `SchemaBoard` measures its own width. When seven columns would each be narrower than 180px (`MIN_COLUMN_WIDTH`), the fields wrap onto two lines of equal boxes (4 + 3).
- Chips get `maxWidth: '100%'` and text that can shrink, and the field descriptions are limited to one line.
- `PRACTICE_MAX_WIDTH` was raised to 1400, so a 1080p window with the rules pane still fits one line of columns.

### Why
At the old 1200px cap, the columns could never reach 180px, so the board would always have wrapped.

### What worked
The user confirmed it: "This looks good."

### What didn't work
Nothing failed in this step.

### What I learned
The user's screenshot is the only visual check this session has had.

### What was tricky
Choosing the threshold. 165px still clipped "mange studerende" plus the column padding, so I used 180px.

### What warrants review
Long clause chips (for example "hvis det regner") in the two-line layout.

### Future work
None from this step.

## Step 5: Keep both tap and type

**Author:** main

### Prompt Context

**Verbatim prompt:** This looks good. For phones, the previous word selection instead of typing in grammar exercises works better. Could we keep both?
**Interpretation:** Bring tapping back as a second mode: tapping on phones, typing on desktop.
**Inferred intent:** Each device gets the input that suits it.

### What I did
- **Setting:** `answerMode: 'auto' | 'tap' | 'type'` in `/src/profile/settings.ts`, resolved by `resolveAnswerMode` (auto taps on a narrow layout and types on a wide one). The `useAnswerMode` hook lives in `/src/ui/useWide.ts`.
- **Switching:** a "Answering exercises" picker in `/app/settings.tsx`, and a `ModeSwitch` link under each exercise.
- **Tap mode in `ChoiceQuestion`:** the option buttons are back.
- **Tap mode on the board:** `SchemaBoard` brings back `SlotContainer`, pressable `PlacedChip`s and the `TapTray`, and they work in both rows and columns. `SchemaQuestion` keeps the tapped and typed answers separately, so switching modes loses nothing.
- **Prompts:** reworded to read right in both modes ("Datid af …", "Hvor skal der være komma?").

### Why
The user found tapping better on a phone. The on-screen keyboard also covers half the board there.

### What worked
`useWide` starts from a guess based on the window width, so a desktop doesn't flash tap buttons before the first layout.

### What didn't work
`src/profile/persistOptions.test.ts` failed with `expected { targetExam: 'PD3', …(4) } to deeply equal { targetExam: 'PD3', …(3) }`, because older saved settings now also come back with `answerMode: 'auto'`. I updated the expectation, since that behaviour is intended.

### What I learned
Zustand's persist merge fills in new settings at their defaults, so adding a setting needs no migration.

### What was tricky
The prop name `mode` ('word' | 'sentence') in `ChoiceQuestion` clashed with the answer mode, so I renamed the latter to `answerMode`.

### What warrants review
- Tap mode on a phone (gap, comma and word-order questions).
- The switch link in both directions.

### Future work
None from this step.

## Step 6: Ship

**Author:** main

### Prompt Context

**Verbatim prompt:** This looks good. Let's push to main, ensure deployment and update the diary so I can clear context. Also, can you make all this into a single command, like a word I can type and you'll do all of this above?
**Interpretation:**
- Commit and push to main.
- Confirm that the Vercel deployment goes through.
- Write this diary.
- Add a reusable command that does all of this.

**Inferred intent:** Close out the session cleanly and repeatably.

### What I did
- Wrote this diary. It is the first one in `/docs/diary/`, following the diary format from the ai-workshop project.
- Added the `/ship` project skill at `/.claude/skills/ship/SKILL.md`. It covers verification, the diary, docs and memory, the commit, the push to main, and watching the Vercel deploy.
- Ran the checks before pushing: `npm run typecheck` (clean), `npm test` (664 passed, 6 skipped) and `npm run build:web` (exported to `dist` in about 8s).
- Committed in three parts (code, docs and diary, the skill), then pushed to main. The Vercel Git integration deploys main to production; the deployment URL is in the session report.

### Why
The user wants to clear context, so the narrative and the release routine have to live in the repo.

### What worked
Every pre-push check passed on the first run.

### What didn't work
`vercel whoami` printed only the upgrade banner (the installed CLI is 54.1.0, the latest 63.1.2), but `vercel ls` and `vercel inspect` worked fine.

### What I learned
The Vercel project `dansk-grammatik` is linked through `/.vercel/project.json` and builds with `npm run build:web` into `dist` (`/vercel.json`).

### What was tricky
Nothing tricky in this step.

### What warrants review
`/.claude/skills/ship/SKILL.md`, the release routine future sessions will follow.

### Future work
None from this step.
