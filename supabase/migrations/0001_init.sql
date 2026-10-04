-- Skema: per-user learner progress.
--
-- Progress is an append-only log of events, never a table of stats. The app
-- derives every stat, niveau, "seen" list and active day by replaying the log
-- (src/sync/replay.ts), so:
--   * two devices can never overwrite each other — they only add rows;
--   * an event is keyed by a client-generated uuid, so retrying an upload is harmless;
--   * changing the mastery or niveau math later recomputes everyone's progress
--     from the same log, losing nothing.
-- Migrations here only ever add. Never drop or rewrite a column progress lives in.

-- ── Profile: the user's exam focus and onboarding state ────────────────────
create table public.profiles (
  user_id     uuid primary key default auth.uid() references auth.users on delete cascade,
  target_exam text check (target_exam in ('PD1', 'PD2', 'PD3', 'FVU')),
  exam_date   date,
  onboarded   boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- ── Events: every answer, niveau change and reset ──────────────────────────
create table public.events (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  kind       text not null check (kind in ('answer', 'set-level', 'reset')),
  domain     text not null,
  item_id    text,
  level      smallint check (level between 1 and 5),
  -- {ruleOrWordId: true|false}: what this answer was evidence for.
  outcomes   jsonb,
  correct    boolean,
  violated   text[],
  at         timestamptz not null,
  -- Server time, for incremental pulls ("everything since my last sync").
  created_at timestamptz not null default now()
);
create index events_user_created on public.events (user_id, created_at);

-- ── Baselines: progress imported from a device that predates accounts ──────
create table public.baselines (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  domain  text not null,
  key     text not null,
  stat    jsonb not null,
  as_of   timestamptz not null,
  primary key (user_id, domain, key)
);

-- ── Row-level security: each user sees and writes only their own rows ──────
alter table public.profiles  enable row level security;
alter table public.events    enable row level security;
alter table public.baselines enable row level security;

create policy "own profile: read"   on public.profiles for select using (user_id = auth.uid());
create policy "own profile: create" on public.profiles for insert with check (user_id = auth.uid());
create policy "own profile: update" on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Events are append-only: no update or delete policy exists, so neither is possible.
create policy "own events: read"   on public.events for select using (user_id = auth.uid());
create policy "own events: append" on public.events for insert with check (user_id = auth.uid());

create policy "own baselines: read"   on public.baselines for select using (user_id = auth.uid());
create policy "own baselines: create" on public.baselines for insert with check (user_id = auth.uid());
create policy "own baselines: update" on public.baselines for update using (user_id = auth.uid()) with check (user_id = auth.uid());
