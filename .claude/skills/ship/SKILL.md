---
name: ship
description: Ship the current work: verify (typecheck, tests, web build), write the diary entry, update docs and memory, commit, merge or push to main, and watch the Vercel production deployment until it is Ready. Use when the user types /ship or asks to "ship it", "push and deploy", or "wrap up so I can clear context".
---

# Ship

Ship whatever this session built, so that the user can clear context afterwards.
Typing `/ship` is the user's go-ahead to commit and to push to `main`. Nothing else
is pre-approved. Ask before force-pushing, before rewriting history, and before
applying a database migration.

Stop and report if a step fails. Never push something that failed verification.

## 1. Look before shipping

- Run `git status`, `git branch --show-current` and `git log --oneline -5`.
- Read the full diff (`git diff`, plus any untracked files). Don't commit anything you haven't seen.
- Leave out secrets and local files: `.env*`, `.e2e-accounts.local`, `content-private/`, `dist/`. If one of them shows up as changed and not ignored, stop and ask.
- If there is nothing to ship, say so and stop.

## 2. Verify

Run these and wait for each to finish:

```
npm run typecheck
npm test
npm run build:web
```

- `npm run build:web` is what Vercel runs (`vercel.json`). If it fails here, the deploy would fail too.
- A few tests are randomised. If exactly one of them fails, re-run once. If it passes, mention it as flaky and carry on. If it fails again, stop.
- If the diff changed content ids, run `npm run content:lock` only if the change was intended, and say so.
- `dist/` is git-ignored, so the build output never ends up in a commit.

## 3. Diary

Write the implementation diary at `docs/diary/YYYY-MM-DD-<slug>.md`:

- The date is the day the work started.
- Use one file per task. Only edit a diary file that was created in this session; otherwise start a new one.
- Begin with `# Diary: <task>` and a short context paragraph.
- Write one `## Step N: <short description>` per logical chunk of the session. Give each step:
  - an `**Author:** main` line;
  - `### Prompt Context`, holding the **Verbatim prompt** (the user's exact words), the **Interpretation** and the **Inferred intent**;
  - these sections, never skipping one (write "Nothing failed in this step." rather than leaving one out): `### What I did`, `### Why`, `### What worked`, `### What didn't work`, `### What I learned`, `### What was tricky`, `### What warrants review`, `### Future work`.
- Write it as prose. Record failures verbatim, with the command and the exact error; these are the most valuable part. Give paths from the repository root, such as `/src/ui/SchemaBoard.tsx`.
- Be honest about verification: say what was checked in a browser and what was only covered by tests or the typecheck.

## 4. Docs and memory

- If behaviour or structure changed, update `README.md` and/or `PROJECT_SUMMARY.md` to match. Look for wording that describes the old behaviour.
- Update the project memory for this session's work and its `MEMORY.md` line. After shipping, mark the work as merged and record the commit hash.

## 5. Commit and get onto main

- Write commit messages in the repo's style: a short imperative subject ("Add the grammar path: …") and a body explaining why. End them with the attribution lines the harness supplies.
- **On `main`:** commit, in more than one commit if the work splits naturally (for example code, then docs and diary).
- **On a feature branch:** commit there, then run `git checkout main`, `git pull --ff-only` and `git merge --no-ff <branch>`. This follows the existing `Merge branch '…'` history. If the merge conflicts, stop and ask.
- Run `git push origin main`. If the push is rejected because main has moved on, run `git pull --rebase` only when the conflict is trivial. Otherwise stop and ask. Never force-push.

## 6. Watch the deployment

The Vercel project `dansk-grammatik` is connected to GitHub (`.vercel/project.json`; it has a `-git-main` alias), so a push to `main` starts a production deploy by itself. Do not run `vercel deploy` as well.

- Poll `vercel ls dansk-grammatik 2>&1` (the status table goes to stderr; without `2>&1` only bare URLs come through) until the newest **Production** deployment created after the push shows `● Ready` (a build takes about 1 minute). Use the Monitor tool or an until-loop rather than sleeping.
- If its status is `● Error`, run `vercel inspect <url> --logs`, report the failing lines, and stop. Don't attempt a fix without asking.
- If no new deployment appears within about 3 minutes, say so: the Git integration may be disconnected. Offer `vercel deploy --prod` rather than running it.
- Once it is Ready, report the deployment URL. Production is aliased to https://dansk-grammatik.vercel.app; check that it returns 200. The `-git-main` alias returns 302 because of deployment protection, which is expected.

## 7. Database

If the diff adds files under `supabase/migrations/` or changes `supabase/functions/`, the web deploy does not apply them. List them and ask before running `npx supabase db push` or `npx supabase functions deploy …`.

## 8. Report

End with a short summary:
- the commits and the hash now on `main`;
- the verification results (test count, typecheck, build);
- the deployment URL and its status;
- the diary file path;
- anything left for the user, such as an unverified UI or a pending migration.

Close by confirming that the session is safe to clear.
