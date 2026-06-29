-- ============================================================
-- LELLO — Migration 01: Foundation (schema + RLS + registry)
-- Safe to run on a fresh project OR an existing one (idempotent).
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ---------- 1. TABLES ----------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  readers     jsonb default '[]'::jsonb,
  goals       jsonb default '{}'::jsonb,
  avatars     jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

create table if not exists public.library (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  author           text,
  cover_url        text,
  ownership_status text default 'owned' check (ownership_status in ('owned','borrowed')),
  in_wishlist      boolean default false,
  rating           int default 0 check (rating between 0 and 5),
  memo             text,
  shelves          text[] default '{}',
  purchased_at     timestamptz,
  purchased_by     text,
  created_at       timestamptz default now()
);

create table if not exists public.reading_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  book_title   text not null,
  book_author  text,
  reader_name  text not null,
  "timestamp"  timestamptz default now(),
  count        int default 1,
  notes        text,
  created_at   timestamptz default now()
);

-- Add columns that may be missing on an existing install
alter table public.library      add column if not exists purchased_at timestamptz;
alter table public.library      add column if not exists purchased_by text;
alter table public.library      add column if not exists in_wishlist boolean default false;
alter table public.library      add column if not exists shelves text[] default '{}';
alter table public.reading_logs add column if not exists notes text;
alter table public.reading_logs add column if not exists count int default 1;

-- Helpful indexes
create index if not exists idx_library_user      on public.library(user_id);
create index if not exists idx_logs_user         on public.reading_logs(user_id);
create index if not exists idx_logs_user_ts      on public.reading_logs(user_id, "timestamp" desc);
create index if not exists idx_library_wishlist  on public.library(user_id) where in_wishlist = true;

-- ---------- 2. DATA REPAIR (wishlist mismatch fix) ----------
-- The registry page used to look for ownership_status = 'wishlist',
-- a value the app never writes. From now on, in_wishlist boolean is
-- the single source of truth. Repair any legacy rows:

update public.library
  set in_wishlist = true, ownership_status = 'owned'
  where ownership_status not in ('owned','borrowed');

-- ---------- 3. ROW LEVEL SECURITY ----------

alter table public.profiles     enable row level security;
alter table public.library      enable row level security;
alter table public.reading_logs enable row level security;

-- Drop old policies if re-running
drop policy if exists "profiles_own"  on public.profiles;
drop policy if exists "library_own"   on public.library;
drop policy if exists "logs_own"      on public.reading_logs;

-- Each family sees and edits ONLY its own rows.
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "library_own" on public.library
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "logs_own" on public.reading_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTE: there is deliberately NO public/anon access to any table.
-- The public registry works through the two functions below instead.

-- ---------- 4. PUBLIC REGISTRY (secure RPCs) ----------

-- 4a. Read a family's registry: child name(s) + unpurchased wishlist
-- items ONLY. Anonymous visitors can call this; they cannot see
-- ratings, memos, reading logs, goals, or anything else.
create or replace function public.get_registry(registry_user_id uuid)
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'readers', coalesce((select readers from profiles where id = registry_user_id), '[]'::jsonb),
    'books', coalesce((
      select json_agg(json_build_object(
        'id', id,
        'title', title,
        'author', author,
        'cover_url', cover_url
      ) order by created_at desc)
      from library
      where user_id = registry_user_id
        and in_wishlist = true
        and purchased_at is null
    ), '[]'::json)
  );
$$;

-- 4b. Claim a gift: a visitor can mark ONE wishlist item purchased.
-- They cannot modify anything else about the row or any other row.
create or replace function public.claim_gift(book_id uuid, giver text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated int;
begin
  update library
    set purchased_at = now(),
        purchased_by = coalesce(nullif(trim(giver), ''), 'A Family Friend')
    where id = book_id
      and in_wishlist = true
      and purchased_at is null;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

-- Allow anonymous + logged-in users to call the registry functions
grant execute on function public.get_registry(uuid)      to anon, authenticated;
grant execute on function public.claim_gift(uuid, text)  to anon, authenticated;

-- ---------- DONE ----------
-- After running this:
--  * Every table is locked to its owner (RLS).
--  * The registry page must switch to:
--      supabase.rpc('get_registry', { registry_user_id: userId })
--      supabase.rpc('claim_gift', { book_id, giver })
--    (patched page provided separately)
--  * API routes must pass the user's JWT instead of trusting a
--    client-supplied userId (patch provided separately).
