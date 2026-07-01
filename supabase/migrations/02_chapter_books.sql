-- ============================================================
-- LELLO — Migration 02: Chapter books ("Currently Reading")
-- Adds a start date to reading logs so a long book can be tracked
-- from start → finish. Safe to run more than once (idempotent).
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

alter table public.reading_logs
  add column if not exists started_at timestamptz;

-- A chapter book "in progress" is stored with timestamp = NULL, so the column
-- must be nullable. Older installs may have created reading_logs with a NOT
-- NULL timestamp; drop it (safe/idempotent — no-op if already nullable).
alter table public.reading_logs
  alter column "timestamp" drop not null;

-- Row semantics after this migration:
--   * Single read (picture book): started_at IS NULL, timestamp = read date.
--   * Chapter book in progress:   started_at set,      timestamp IS NULL.
--   * Chapter book finished:      started_at set,      timestamp = finish date
--     (duration = timestamp − started_at).
