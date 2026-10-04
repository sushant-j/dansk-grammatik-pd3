-- Skema: PD3 reading papers and the learner's attempts at them.
--
-- Additive only: two new tables, nothing in 0001 changes.

-- ── Papers: official PD3 reading papers, transcribed ───────────────────────
-- The repo is public and the web build is a static bundle, so the official
-- texts are not shipped with the app. They live here, readable by any
-- signed-in user and by nobody else. There is no insert/update/delete policy:
-- only the seed script (scripts/upload-exam-papers.mjs, using the secret key,
-- which bypasses row-level security) writes them.
create table public.exam_papers (
  id         text primary key,
  -- PaperMeta (src/content/exams/types.ts): what the list screen shows.
  meta       jsonb not null,
  -- The full ReadingPaper, fetched when a paper is opened.
  content    jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.exam_papers enable row level security;
create policy "signed-in users: read papers" on public.exam_papers for select to authenticated using (true);

-- ── Attempts: one finished part (Læseforståelse 1 or 2) of one paper ───────
create table public.exam_attempts (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  -- Not a foreign key: simulated papers ship with the app and have no row in exam_papers.
  paper_id    text not null,
  part        text not null check (part in ('lf1', 'lf2')),
  mode        text not null check (mode in ('exam', 'practice')),
  answers     jsonb not null,
  -- LF1 answers the learner marked right or wrong themselves (the key is a guide).
  self_marks  jsonb not null default '{}'::jsonb,
  points      smallint not null,
  max_points  smallint not null,
  duration_ms integer not null,
  finished_at timestamptz not null,
  -- Self-marking after the fact changes the row; the newer copy wins on sync.
  updated_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index exam_attempts_user on public.exam_attempts (user_id, finished_at);

alter table public.exam_attempts enable row level security;
create policy "own attempts: read"   on public.exam_attempts for select using (user_id = auth.uid());
create policy "own attempts: create" on public.exam_attempts for insert with check (user_id = auth.uid());
-- Updating is allowed so self-marks can change; there is still no delete.
create policy "own attempts: update" on public.exam_attempts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
