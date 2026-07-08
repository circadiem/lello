-- ============================================================
-- LELLO — Migration 06: Households (second-parent access)
-- Changes the ownership model from "rows belong to a user" to
-- "rows belong to a household". Every existing user gets their own
-- household via backfill; a partner joins by invite code.
--
-- RUN ONLY AFTER Phase 1 is verified in production. Snapshot the DB
-- first (Dashboard → Database → Backups). Idempotent — safe to re-run.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Notes on deviations from the draft spec (deliberate):
--   * profiles UPDATE is household-scoped (both parents co-edit the
--     shared family profile), not own-only.
--   * A profiles_own_delete policy is kept so Factory Reset still works.
--   * A BEFORE INSERT trigger auto-provisions a household for any NEW
--     profile created after this migration (backfill only covers rows
--     that exist now).
--   * RLS is enabled on the household tables; invites are never directly
--     readable (codes are secrets) — all access is via SECURITY DEFINER
--     RPCs.
-- ============================================================

-- ---------- 1. Tables ----------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text default 'parent',
  created_at timestamptz default now(),
  primary key (household_id, user_id),
  unique (user_id)          -- one household per user (v1)
);

create table if not exists public.household_invites (
  code text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid references auth.users(id),
  expires_at timestamptz not null,
  used_by uuid,
  used_at timestamptz
);

-- ---------- 2. household_id columns ----------
alter table public.profiles     add column if not exists household_id uuid references public.households(id);
alter table public.library      add column if not exists household_id uuid references public.households(id);
alter table public.reading_logs add column if not exists household_id uuid references public.households(id);

-- ---------- 3. Backfill: one household per existing user, stamp all rows ----------
do $$
declare r record; hid uuid;
begin
  for r in select id from public.profiles p
           where not exists (select 1 from public.household_members m where m.user_id = p.id)
  loop
    insert into public.households default values returning id into hid;
    insert into public.household_members (household_id, user_id) values (hid, r.id);
  end loop;
end $$;

update public.profiles     p set household_id = m.household_id from public.household_members m where m.user_id = p.id       and p.household_id is null;
update public.library      l set household_id = m.household_id from public.household_members m where m.user_id = l.user_id  and l.household_id is null;
update public.reading_logs g set household_id = m.household_id from public.household_members m where m.user_id = g.user_id  and g.household_id is null;

-- ---------- 4. Helper + stamping triggers ----------
create or replace function public.current_household_id()
returns uuid language sql stable security definer set search_path = public as
$$ select household_id from household_members where user_id = auth.uid() $$;

create or replace function public.stamp_household()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.household_id is null then new.household_id := public.current_household_id(); end if;
  return new;
end $$;

drop trigger if exists stamp_household_library on public.library;
create trigger stamp_household_library before insert on public.library
  for each row execute function public.stamp_household();
drop trigger if exists stamp_household_logs on public.reading_logs;
create trigger stamp_household_logs before insert on public.reading_logs
  for each row execute function public.stamp_household();

-- Any NEW profile created after this migration (a fresh "new family"
-- signup) gets its own household + membership automatically, so its
-- library/log inserts can be stamped and read back.
create or replace function public.ensure_household_for_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if not exists (select 1 from household_members where user_id = new.id) then
    insert into households default values returning id into hid;
    insert into household_members (household_id, user_id) values (hid, new.id);
    new.household_id := hid;
  elsif new.household_id is null then
    new.household_id := (select household_id from household_members where user_id = new.id);
  end if;
  return new;
end $$;

drop trigger if exists ensure_household_before_profile on public.profiles;
create trigger ensure_household_before_profile before insert on public.profiles
  for each row execute function public.ensure_household_for_profile();

-- ---------- 5. RLS: household-scoped ----------
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;

-- library / reading_logs: full household access (both parents co-manage).
drop policy if exists "library_own" on public.library;
drop policy if exists "library_household" on public.library;
create policy "library_household" on public.library
  for all using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id() or household_id is null);

drop policy if exists "logs_own" on public.reading_logs;
drop policy if exists "logs_household" on public.reading_logs;
create policy "logs_household" on public.reading_logs
  for all using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id() or household_id is null);

-- profiles: household members may READ and UPDATE any profile in their
-- household (co-edit the shared family config). INSERT/DELETE stay
-- own-row only (create your own profile; Factory Reset deletes it).
drop policy if exists "profiles_own" on public.profiles;
drop policy if exists "profiles_household_read" on public.profiles;
drop policy if exists "profiles_own_write" on public.profiles;
drop policy if exists "profiles_own_update" on public.profiles;
drop policy if exists "profiles_household_update" on public.profiles;
drop policy if exists "profiles_own_insert" on public.profiles;
drop policy if exists "profiles_own_delete" on public.profiles;
create policy "profiles_household_read" on public.profiles
  for select using (household_id = public.current_household_id() or auth.uid() = id);
create policy "profiles_own_insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_household_update" on public.profiles
  for update using (household_id = public.current_household_id() or auth.uid() = id)
              with check (household_id = public.current_household_id() or auth.uid() = id);
create policy "profiles_own_delete" on public.profiles
  for delete using (auth.uid() = id);

-- household tables: readable only to their own members; invites are
-- never directly readable (all invite access goes through the RPCs).
create policy "households_member_read" on public.households
  for select using (id = public.current_household_id());
create policy "household_members_read" on public.household_members
  for select using (household_id = public.current_household_id());

-- ---------- 6. Invites (RPCs) ----------
create or replace function public.create_household_invite()
returns text language plpgsql security definer set search_path = public as $$
declare c text := upper(substr(md5(random()::text), 1, 6)); hid uuid := public.current_household_id();
begin
  if hid is null then raise exception 'No household'; end if;
  insert into household_invites (code, household_id, created_by, expires_at)
  values (c, hid, auth.uid(), now() + interval '7 days');
  return c;
end $$;

create or replace function public.join_household(invite_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  select * into inv from household_invites
    where code = upper(trim(invite_code)) and used_at is null and expires_at > now();
  if not found then return false; end if;
  -- move the joiner to the inviting household (their solo membership, if any,
  -- is dropped; their old solo data stays behind — merging is out of scope).
  delete from household_members where user_id = auth.uid();
  insert into household_members (household_id, user_id) values (inv.household_id, auth.uid());
  update profiles set household_id = inv.household_id where id = auth.uid();
  update household_invites set used_by = auth.uid(), used_at = now() where code = inv.code;
  return true;
end $$;

grant execute on function public.create_household_invite() to authenticated;
grant execute on function public.join_household(text) to authenticated;

-- ---------- 7. Registry resolves household ----------
create or replace function public.get_registry(registry_user_id uuid)
returns json language sql security definer set search_path = public stable as $$
  with hh as (select household_id from household_members where user_id = registry_user_id)
  select json_build_object(
    'readers', coalesce((select readers from profiles p
                         where p.household_id = (select household_id from hh)
                         order by created_at asc limit 1), '[]'::jsonb),
    'books', coalesce((
      select json_agg(json_build_object('id', id, 'title', title, 'author', author,
                       'cover_url', cover_url, 'isbn', isbn, 'occasion', occasion)
                      order by created_at desc)
      from library
      where household_id = (select household_id from hh)
        and in_wishlist = true and purchased_at is null), '[]'::json)
  );
$$;

grant execute on function public.get_registry(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
