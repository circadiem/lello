-- ============================================================
-- LELLO — Migration 02: Chapter books ("Currently Reading")
-- Adds a start date to reading logs so a long book can be tracked
-- from start → finish. Safe to run more than once (idempotent).
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

alter table public.reading_logs
  add column if not exists started_at timestamptz;

-- Row semantics after this migration:
--   * Single read (picture book): started_at IS NULL, timestamp = read date.
--   * Chapter book in progress:   started_at set,      timestamp IS NULL.
--   * Chapter book finished:      started_at set,      timestamp = finish date
--     (duration = timestamp − started_at).
