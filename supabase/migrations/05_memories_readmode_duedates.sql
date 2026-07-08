-- ============================================================
-- LELLO — Migration 05: Memories, read modes & due dates
-- Adds three additive Phase 1 features. Idempotent — safe to run
-- more than once.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ---------- Feature A: Reading Memories ----------
-- A photo + a memorable quote can be attached to any read.
alter table public.reading_logs
  add column if not exists photo_url text;

alter table public.reading_logs
  add column if not exists quote text;

-- ---------- Feature B: Who read to whom ----------
-- to_child = adult read to the child (default), together = shared,
-- by_child = the child read it themselves.
alter table public.reading_logs
  add column if not exists read_mode text default 'to_child'
    check (read_mode in ('to_child', 'together', 'by_child'));

-- Backfill any pre-existing rows so the column is never null.
update public.reading_logs set read_mode = 'to_child' where read_mode is null;

-- ---------- Feature C: Library due dates ----------
-- Meaningful only while a book is borrowed; cleared when it becomes owned.
alter table public.library
  add column if not exists due_date date;

-- ---------- Storage: memories bucket ----------
-- Public-read (so a getPublicUrl link renders), owner-only insert/delete.
-- Photos live at {userId}/{uuid}.jpg.
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do update set public = true;

-- Owner can upload into their own folder (first path segment = their uid).
drop policy if exists "memories owner insert" on storage.objects;
create policy "memories owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can delete their own photos.
drop policy if exists "memories owner delete" on storage.objects;
create policy "memories owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read (public bucket; explicit policy for clarity).
drop policy if exists "memories public read" on storage.objects;
create policy "memories public read"
  on storage.objects for select to public
  using (bucket_id = 'memories');
