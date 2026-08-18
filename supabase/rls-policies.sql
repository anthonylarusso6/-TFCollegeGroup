-- ============================================================================
-- TF College Group — Row Level Security baseline
-- ============================================================================
-- Paste this whole file into Supabase → SQL Editor → Run.
-- It is idempotent: safe to run more than once.
--
-- WHAT THIS DOES
--   • Turns Row Level Security ON for every table (default-deny baseline).
--   • Adds policies that permit exactly what the app does today, so nothing
--     in the app breaks.
--   • Locks the Polar OAuth token columns so the public (anon) key can no
--     longer read them — those are only ever used by server routes.
--
-- WHAT THIS DOES *NOT* DO (be honest about the ceiling)
--   The app has no server-side login: athletes are identified by a 4-digit PIN
--   that the browser reads and compares, and the /coach page is just a URL.
--   Because coach and athlete both use the same public anon key, RLS by itself
--   cannot say "coach may delete, athlete may not" — there is no identity to key
--   off of. So this file is a solid *baseline*, not a wall.
--
--   The real hardening (worth doing next, ask Claude to build it):
--     1. Move PIN verification to a server API route (service key) so the pin
--        column can be hidden from the anon key entirely.
--     2. Move destructive coach actions (delete athlete, wipe data) to server
--        routes, then remove DELETE from the anon policies below.
-- ============================================================================

-- 1) Enable RLS + a permissive baseline policy on every table -----------------
do $$
declare
  t text;
  tables text[] := array[
    'athletes','attendance','leaderboard','inbox','weight_log','anvil',
    'pr_log','announcements','callouts','culture_events','culture_rsvps',
    'culture_photos','culture_templates','draft'
  ];
begin
  foreach t in array tables loop
    -- skip tables that don't exist in this project instead of erroring
    if to_regclass('public.' || t) is null then
      raise notice 'skipping % (not found)', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    -- one policy covering select/insert/update/delete for the public keys.
    execute format('drop policy if exists %I on public.%I', t || '_anon_rw', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (true) with check (true)',
      t || '_anon_rw', t
    );
  end loop;
end $$;

-- 2) Hide the Polar OAuth tokens from the public key --------------------------
--    These columns are only read by server routes (service key), never the app.
--    Revoking table-wide SELECT and re-granting every *other* column keeps reads
--    working while making the tokens unreadable via the anon key.
--    NOTE: if you later ALTER TABLE athletes ADD COLUMN, add it to this grant
--    too, or the app won't be able to read the new column.
do $$
begin
  if to_regclass('public.athletes') is not null
     and exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='athletes'
                   and column_name='polar_token') then

    revoke select on public.athletes from anon, authenticated;

    execute (
      select 'grant select ('
             || string_agg(quote_ident(column_name), ', ' order by ordinal_position)
             || ') on public.athletes to anon, authenticated'
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'athletes'
        and column_name not in ('polar_token','polar_refresh_token')
    );
  end if;
end $$;

-- ============================================================================
-- OPTIONAL — apply ONLY after PIN verification is moved server-side.
-- Until then this WILL break login (the browser still reads the pin column).
-- ----------------------------------------------------------------------------
-- do $$
-- begin
--   revoke select on public.athletes from anon, authenticated;
--   execute (
--     select 'grant select ('
--            || string_agg(quote_ident(column_name), ', ' order by ordinal_position)
--            || ') on public.athletes to anon, authenticated'
--     from information_schema.columns
--     where table_schema='public' and table_name='athletes'
--       and column_name not in ('polar_token','polar_refresh_token','pin')
--   );
-- end $$;
-- ============================================================================

-- 3) Sanity check — list which tables now have RLS enabled --------------------
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
order by relname;
