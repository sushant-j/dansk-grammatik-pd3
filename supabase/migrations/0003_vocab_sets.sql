-- Skema: the learner's own vocabulary sets — words and phrases they picked
-- out of a reading text (or typed in) to practise as flashcards.
--
-- Additive only: two new tables, nothing in 0001 or 0002 changes.
--
-- Sets and their words change after they are made (renamed, meaning added,
-- removed), so they are rows, not progress events. Practising them is still
-- recorded in `events` (domain 'vocab'), like any other word.
--
-- There is no delete policy. Removing a set or a word sets `deleted_at`, so a
-- removal made on one device reaches the others instead of the row coming
-- back from whichever device still holds it. The newer `updated_at` wins.

create table public.vocab_sets (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);
create index vocab_sets_user on public.vocab_sets (user_id, updated_at);

alter table public.vocab_sets enable row level security;
create policy "own sets: read"   on public.vocab_sets for select using (user_id = auth.uid());
create policy "own sets: create" on public.vocab_sets for insert with check (user_id = auth.uid());
create policy "own sets: update" on public.vocab_sets for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.vocab_set_items (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  set_id     uuid not null references public.vocab_sets on delete cascade,
  -- The word or phrase as the learner confirmed it.
  text       text not null,
  -- The deck entry it was matched to ('v-…', 'w-…'), so the card and its progress are shared.
  ref_id     text,
  -- The learner's own meaning, for a word that isn't in the deck.
  meaning    text,
  -- The sentence it was picked out of, and where that was ({ paperId, part, label }).
  context    text,
  source     jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);
create index vocab_set_items_user on public.vocab_set_items (user_id, updated_at);

alter table public.vocab_set_items enable row level security;
create policy "own set items: read"   on public.vocab_set_items for select using (user_id = auth.uid());
create policy "own set items: create" on public.vocab_set_items for insert with check (user_id = auth.uid());
create policy "own set items: update" on public.vocab_set_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
