-- ============================================================
-- LELLO — Migration 04: Occasions + registry fields
-- Adds an `occasion` label to library items ("Birthday", "Holiday",
-- ...) and updates get_registry to return both isbn and occasion.
--
-- Standalone-safe: includes the isbn column too, so this works
-- whether or not you already ran 03_isbn.sql. Idempotent.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

alter table public.library
  add column if not exists isbn text;

alter table public.library
  add column if not exists occasion text;

-- Final get_registry: name(s) + unpurchased wishlist items with
-- cover, isbn (for exact Amazon links), and occasion (for filter chips).
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
        'cover_url', cover_url,
        'isbn', isbn,
        'occasion', occasion
      ) order by created_at desc)
      from library
      where user_id = registry_user_id
        and in_wishlist = true
        and purchased_at is null
    ), '[]'::json)
  );
$$;

grant execute on function public.get_registry(uuid) to anon, authenticated;
